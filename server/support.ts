// Live support chat bridged to Telegram.
//
// Merchants send messages from a dashboard bubble; each is persisted and relayed
// to the operator's personal Telegram chat via the Bot API. The operator replies
// in Telegram (swipe-to-reply to route, or by S-code prefix); those replies flow
// back to the merchant over Server-Sent Events in real time.
//
// Design notes:
//  - Uses `db` directly (matches routes.ts style) rather than the storage layer.
//  - SSE fan-out is in-process via a single EventEmitter keyed by conversation id.
//    This works for the single-instance Replit deployment; a multi-instance setup
//    would need a shared pub/sub, which is out of scope here.
//  - Telegram failures are never surfaced to the customer: their POST still
//    returns 200 and a background retry (plus a periodic sweep) handles delivery.

import type { Express, Request, Response } from "express";
import { EventEmitter } from "events";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { and, asc, desc, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { db } from "./db";
import {
  supportConversations,
  supportMessages,
  telegramWebhookState,
  stores,
  users,
  type SupportMessage,
} from "@shared/schema";
import {
  answerCallbackQuery,
  getAdminChatId,
  getAiSharedSecret,
  getAiWebhookUrl,
  getWebhookSecret,
  isAiConfigured,
  isTelegramConfigured,
  sendMessage,
  warnIfTelegramMisconfigured,
  type TelegramUpdate,
} from "./services/telegram";

// ---------------------------------------------------------------------------
// SSE fan-out
// ---------------------------------------------------------------------------

type SupportEvent =
  | { type: "message"; message: SupportMessage }
  | { type: "status"; status: "open" | "closed" };

const emitter = new EventEmitter();
// One conversation can have several open tabs; never cap listeners.
emitter.setMaxListeners(0);

function channel(conversationId: number): string {
  return `conv:${conversationId}`;
}

function emitSupportEvent(conversationId: number, event: SupportEvent): void {
  emitter.emit(channel(conversationId), event);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SHORT_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
const SHORT_CODE_RE = /S-[A-Z0-9]{4}/;

function randomShortCode(): string {
  let code = "S-";
  const bytes = crypto.randomBytes(4);
  for (let i = 0; i < 4; i++) {
    code += SHORT_CODE_ALPHABET[bytes[i] % SHORT_CODE_ALPHABET.length];
  }
  return code;
}

async function generateUniqueShortCode(): Promise<string> {
  // Collisions are astronomically unlikely, but retry a few times to be safe.
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomShortCode();
    const [existing] = await db
      .select({ id: supportConversations.id })
      .from(supportConversations)
      .where(eq(supportConversations.shortCode, code))
      .limit(1);
    if (!existing) return code;
  }
  // Extremely unlikely fallback: widen with a timestamp suffix.
  return `S-${crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 4)}`;
}

const GREETING =
  "Hi! Send us a message and our team will get back to you here as soon as we can.";

// Build the one-time context header prepended to the first relayed user message
// so the operator knows who is chatting without leaving Telegram.
async function buildContextHeader(userId: string, shortCode: string): Promise<string> {
  const lines: string[] = [`💬 New chat ${shortCode}`];

  try {
    const [user] = await db
      .select({
        email: users.email,
        subscriptionStatus: users.subscriptionStatus,
        chargeFree: users.chargeFree,
        selectedProducts: users.selectedProducts,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.email) lines.push(`👤 ${user.email}`);

    const storeRows = await db
      .select({ displayName: stores.displayName, shopName: stores.shopName })
      .from(stores)
      .where(eq(stores.userId, userId))
      .orderBy(asc(stores.createdAt));

    if (storeRows.length > 0) {
      const names = storeRows.map((s) => s.displayName || s.shopName);
      const shown = names.slice(0, 5).join(", ");
      const extra = names.length > 5 ? ` +${names.length - 5} more` : "";
      lines.push(`🏪 ${shown}${extra}`);
    }

    const status = user?.chargeFree
      ? "complimentary"
      : user?.subscriptionStatus || "no subscription";
    const products = (user?.selectedProducts || []).join(", ");
    lines.push(`💳 ${status}${products ? ` (${products})` : ""}`);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(supportConversations)
      .where(eq(supportConversations.userId, userId));
    const previous = Math.max(0, (count ?? 0) - 1);
    lines.push(`🗂️ ${previous} previous chat${previous === 1 ? "" : "s"}`);
  } catch (err) {
    console.error("[Support] Failed to build context header:", err);
  }

  return lines.join("\n");
}

function closeButtonMarkup(shortCode: string): object {
  return {
    inline_keyboard: [[{ text: `✅ Close ${shortCode}`, callback_data: `close:${shortCode}` }]],
  };
}

// ---------------------------------------------------------------------------
// Relay: dashboard -> Telegram
// ---------------------------------------------------------------------------

const RETRY_DELAYS_MS = [0, 1000, 5000, 15000]; // immediate, then 1s / 5s / 15s

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Send a single stored user message to Telegram with the appropriate framing.
// Returns the Telegram message_id on success, or null on failure.
async function attemptRelay(
  message: SupportMessage,
  shortCode: string,
  userId: string,
  includeHeader: boolean,
): Promise<number | null> {
  if (!isTelegramConfigured()) return null;

  let text: string;
  let replyMarkup: object | undefined;
  if (includeHeader) {
    const header = await buildContextHeader(userId, shortCode);
    text = `${header}\n\n${message.body}`;
    replyMarkup = closeButtonMarkup(shortCode);
  } else {
    text = `[${shortCode}] ${message.body}`;
  }

  const telegramMessageId = await sendMessage(text, { replyMarkup });
  return telegramMessageId;
}

// Fire-and-forget relay with bounded exponential backoff. Never throws; on final
// failure the message row stays deliveredToAgent=false for the sweep to retry.
async function relayUserMessage(
  message: SupportMessage,
  shortCode: string,
  userId: string,
  includeHeader: boolean,
): Promise<void> {
  if (!isTelegramConfigured()) return;

  for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
    if (RETRY_DELAYS_MS[i] > 0) await sleep(RETRY_DELAYS_MS[i]);
    try {
      const telegramMessageId = await attemptRelay(message, shortCode, userId, includeHeader);
      if (telegramMessageId != null) {
        await db
          .update(supportMessages)
          .set({ telegramMessageId, deliveredToAgent: true })
          .where(eq(supportMessages.id, message.id));
        return;
      }
    } catch (err) {
      console.error(
        `[Support] Relay attempt ${i + 1} failed for message ${message.id}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
  console.warn(`[Support] Message ${message.id} left undelivered after retries; sweep will retry.`);
}

// ---------------------------------------------------------------------------
// Forward: dashboard -> external AI agent (n8n)
// ---------------------------------------------------------------------------

const AI_FORWARD_TIMEOUT_MS = 5000;
const AI_HISTORY_LIMIT = 10;

// Fire-and-forget forward of a new user message to the external AI agent.
// Every failure is caught and logged — a forward failure must never affect the
// customer response or the Telegram relay. There is deliberately no retry
// queue: the degradation mode is simply "a human will answer".
async function forwardToAi(
  conversation: { id: number; shortCode: string; userId: string },
  message: SupportMessage,
): Promise<void> {
  const url = getAiWebhookUrl();
  const secret = getAiSharedSecret();
  if (!url || !secret) return;

  try {
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, conversation.userId))
      .limit(1);

    const storeRows = await db
      .select({ displayName: stores.displayName, shopName: stores.shopName })
      .from(stores)
      .where(eq(stores.userId, conversation.userId))
      .orderBy(asc(stores.createdAt));

    // Last N messages of this conversation (ascending, excluding the one being
    // forwarded) so the AI has context.
    const recent = await db
      .select({ sender: supportMessages.sender, body: supportMessages.body })
      .from(supportMessages)
      .where(
        and(
          eq(supportMessages.conversationId, conversation.id),
          ne(supportMessages.id, message.id),
        ),
      )
      .orderBy(desc(supportMessages.createdAt), desc(supportMessages.id))
      .limit(AI_HISTORY_LIMIT);
    const history = recent.reverse();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_FORWARD_TIMEOUT_MS);
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Support-Secret": secret },
        body: JSON.stringify({
          conversationId: conversation.id,
          shortCode: conversation.shortCode,
          userEmail: user?.email ?? null,
          stores: storeRows.map((s) => s.displayName || s.shopName),
          message: message.body,
          history,
        }),
        signal: controller.signal,
      });
      if (!resp.ok) throw new Error(`webhook responded ${resp.status}`);
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    console.error(
      `[Support][ai] forward failed conversation=${conversation.id}: ` +
        `${err instanceof Error ? err.message : err}`,
    );
  }
}

// Relay a copy of an AI reply to the operator's Telegram so they can follow
// along and swipe-reply (which routes to this conversation AND flips it to
// human mode). On failure the AI reply still stands — the row keeps
// deliveredToAgent=false so the sweep retries the copy.
async function relayAiCopy(message: SupportMessage, shortCode: string): Promise<void> {
  if (!isTelegramConfigured()) return;
  try {
    const telegramMessageId = await sendMessage(`AI [${shortCode}]: ${message.body}`);
    await db
      .update(supportMessages)
      .set({ telegramMessageId, deliveredToAgent: true })
      .where(eq(supportMessages.id, message.id));
  } catch (err) {
    console.error(
      `[Support][ai] Telegram copy failed for message ${message.id}: ` +
        `${err instanceof Error ? err.message : err}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

async function insertMessage(
  conversationId: number,
  sender: "user" | "agent" | "system" | "ai",
  body: string,
  opts?: { telegramMessageId?: number; deliveredToAgent?: boolean; readByUser?: boolean },
  executor: Pick<typeof db, "insert" | "update"> = db,
): Promise<SupportMessage> {
  const [row] = await executor
    .insert(supportMessages)
    .values({
      conversationId,
      sender,
      body,
      telegramMessageId: opts?.telegramMessageId,
      deliveredToAgent: opts?.deliveredToAgent ?? false,
      readByUser: opts?.readByUser ?? false,
    })
    .returning();
  await executor
    .update(supportConversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(supportConversations.id, conversationId));
  return row;
}

// Find (or create) the caller's single active conversation. Merchants have at
// most one open conversation at a time; a closed one is reopened lazily only via
// the agent side, so the dashboard always creates a fresh open conversation.
async function getOrCreateOpenConversation(userId: string) {
  const [open] = await db
    .select()
    .from(supportConversations)
    .where(and(eq(supportConversations.userId, userId), eq(supportConversations.status, "open")))
    .orderBy(desc(supportConversations.createdAt))
    .limit(1);
  if (open) return { conversation: open, created: false as const };

  const shortCode = await generateUniqueShortCode();
  const [created] = await db
    .insert(supportConversations)
    .values({ userId, shortCode, status: "open" })
    .returning();
  // Seed the greeting so the panel is never empty. It does not count toward
  // inactivity auto-close and is never relayed to Telegram.
  await insertMessage(created.id, "system", GREETING, { readByUser: true });
  return { conversation: created, created: true as const };
}

// ---------------------------------------------------------------------------
// Inbound: Telegram -> dashboard
// ---------------------------------------------------------------------------

// Normalize any id for comparison: Telegram sends numeric ids, the admin id
// comes from an env string, and either can carry surrounding whitespace.
function normalizeId(value: unknown): string {
  return String(value ?? "").trim();
}

// Every id field that can legitimately carry the operator's id, regardless of
// whether the update is a message or a callback_query, and whether the bot
// lives in a private chat or a group.
function adminCandidateIds(update: TelegramUpdate): string[] {
  return [
    update.message?.chat.id,
    update.message?.from?.id,
    update.callback_query?.from.id,
    update.callback_query?.message?.chat.id,
  ]
    .filter((id): id is number => id != null)
    .map(normalizeId);
}

function isFromAdminChat(update: TelegramUpdate): boolean {
  const adminId = normalizeId(getAdminChatId());
  if (!adminId) return false;
  return adminCandidateIds(update).includes(adminId);
}

async function closeConversation(conversationId: number, systemNote: string): Promise<void> {
  await db
    .update(supportConversations)
    .set({ status: "closed" })
    .where(eq(supportConversations.id, conversationId));
  const sysMsg = await insertMessage(conversationId, "system", systemNote, { readByUser: false });
  emitSupportEvent(conversationId, { type: "status", status: "closed" });
  emitSupportEvent(conversationId, { type: "message", message: sysMsg });
}

// Resolve which conversation an agent's Telegram message targets, in priority
// order: (1) swipe-to-reply quote, (2) explicit S-code prefix, (3) the most
// recently active open conversation.
async function routeAgentMessage(
  update: TelegramUpdate,
): Promise<{ id: number; shortCode: string } | null> {
  const msg = update.message!;

  // (1) Reply-to-quote: match the quoted Telegram message_id to a stored one.
  const quotedId = msg.reply_to_message?.message_id;
  if (quotedId != null) {
    const [row] = await db
      .select({ conversationId: supportMessages.conversationId })
      .from(supportMessages)
      .where(eq(supportMessages.telegramMessageId, quotedId))
      .limit(1);
    if (row) {
      const [conv] = await db
        .select({ id: supportConversations.id, shortCode: supportConversations.shortCode })
        .from(supportConversations)
        .where(eq(supportConversations.id, row.conversationId))
        .limit(1);
      if (conv) return conv;
    }
  }

  // (2) Explicit S-code anywhere in the text.
  const codeMatch = msg.text?.match(SHORT_CODE_RE);
  if (codeMatch) {
    const [conv] = await db
      .select({ id: supportConversations.id, shortCode: supportConversations.shortCode })
      .from(supportConversations)
      .where(eq(supportConversations.shortCode, codeMatch[0]))
      .limit(1);
    if (conv) return conv;
  }

  // (3) Fallback: the most recently active open conversation.
  const [recent] = await db
    .select({ id: supportConversations.id, shortCode: supportConversations.shortCode })
    .from(supportConversations)
    .where(eq(supportConversations.status, "open"))
    .orderBy(desc(supportConversations.lastMessageAt))
    .limit(1);
  return recent ?? null;
}

// Strip a leading S-code (and optional following whitespace/colon) from an agent
// message so the merchant doesn't see the routing token echoed back.
function stripShortCode(text: string): string {
  return text.replace(new RegExp(`^\\s*${SHORT_CODE_RE.source}[:\\s]*`), "").trim() || text.trim();
}

async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  // --- Inline "Close" button ---
  if (update.callback_query) {
    const cq = update.callback_query;
    const data = cq.data || "";
    if (data.startsWith("close:")) {
      const shortCode = data.slice("close:".length);
      const [conv] = await db
        .select({ id: supportConversations.id, status: supportConversations.status })
        .from(supportConversations)
        .where(eq(supportConversations.shortCode, shortCode))
        .limit(1);
      if (conv && conv.status === "open") {
        await closeConversation(conv.id, "This conversation was closed by our support team.");
        console.log(
          `[Support][webhook] callback close applied conversation=${conv.id} ` +
            `shortCode=${shortCode} — SSE 'status' emitted`,
        );
      }
      try {
        await answerCallbackQuery(cq.id, conv ? `Closed ${shortCode}` : "Conversation not found");
      } catch (err) {
        console.error("[Support] answerCallbackQuery failed:", err);
      }
    } else {
      try {
        await answerCallbackQuery(cq.id);
      } catch {
        /* non-fatal */
      }
    }
    return;
  }

  const msg = update.message;
  if (!msg) return;

  // Non-text agent messages (stickers, photos, etc.) aren't supported.
  if (!msg.text) {
    try {
      await sendMessage("Only plain-text replies are relayed to customers. Please resend as text.");
    } catch {
      /* non-fatal */
    }
    return;
  }

  const text = msg.text.trim();

  // --- Commands ---
  if (text.startsWith("/")) {
    if (text.toLowerCase().startsWith("/close")) {
      // Optional S-code argument; otherwise close the routed conversation.
      const target = await routeAgentMessage(update);
      if (target) {
        await closeConversation(target.id, "This conversation was closed by our support team.");
        try {
          await sendMessage(`Closed ${target.shortCode}.`);
        } catch {
          /* non-fatal */
        }
      } else {
        try {
          await sendMessage("No open conversation to close.");
        } catch {
          /* non-fatal */
        }
      }
    }
    return;
  }

  // --- Regular agent reply ---
  const target = await routeAgentMessage(update);
  if (!target) {
    try {
      await sendMessage("No open conversation to reply to.");
    } catch {
      /* non-fatal */
    }
    return;
  }

  const body = stripShortCode(text);

  // Manual takeover: BEFORE inserting the agent message, an ai-mode
  // conversation flips to human so the external AI stops answering. This
  // applies to every routing method (quote, S-code, fallback); the AI reply
  // endpoint re-checks mode at insertion time, which closes the race where a
  // takeover happens while the AI is mid-generation.
  const [conv] = await db
    .select({ status: supportConversations.status, mode: supportConversations.mode })
    .from(supportConversations)
    .where(eq(supportConversations.id, target.id))
    .limit(1);
  if (conv?.mode === "ai") {
    await db
      .update(supportConversations)
      .set({ mode: "human" })
      .where(eq(supportConversations.id, target.id));
    console.log(`[Support][ai] manual takeover conversation=${target.id} — mode flipped to human`);
  }

  const agentMsg = await insertMessage(target.id, "agent", body, {
    telegramMessageId: msg.message_id,
    deliveredToAgent: true,
    readByUser: false,
  });

  // A reply on a closed conversation reopens it.
  if (conv?.status === "closed") {
    await db
      .update(supportConversations)
      .set({ status: "open" })
      .where(eq(supportConversations.id, target.id));
    emitSupportEvent(target.id, { type: "status", status: "open" });
  }

  emitSupportEvent(target.id, { type: "message", message: agentMsg });
  console.log(
    `[Support][webhook] agent reply inserted conversation=${target.id} ` +
      `message_id=${agentMsg.id} — SSE 'message' emitted`,
  );
}

// ---------------------------------------------------------------------------
// Duplicate-delivery guard
// ---------------------------------------------------------------------------

// Returns true if this update_id is new (and records it), false if already seen.
async function claimUpdateId(updateId: number): Promise<boolean> {
  // Ensure the singleton row exists, then atomically bump it only if this
  // update_id is strictly greater — so concurrent/duplicate deliveries can't
  // both win.
  await db
    .insert(telegramWebhookState)
    .values({ id: "singleton", lastUpdateId: 0 })
    .onConflictDoNothing();
  const [current] = await db
    .select({ lastUpdateId: telegramWebhookState.lastUpdateId })
    .from(telegramWebhookState)
    .where(eq(telegramWebhookState.id, "singleton"))
    .limit(1);
  console.log(
    `[Support][webhook] dedup incoming_update_id=${updateId} stored_max=${current?.lastUpdateId ?? "none"}`,
  );
  const updated = await db
    .update(telegramWebhookState)
    .set({ lastUpdateId: updateId })
    .where(and(eq(telegramWebhookState.id, "singleton"), lt(telegramWebhookState.lastUpdateId, updateId)))
    .returning({ id: telegramWebhookState.id });
  return updated.length > 0;
}

// ---------------------------------------------------------------------------
// Webhook signature check
// ---------------------------------------------------------------------------

function validWebhookSecret(req: Request): boolean {
  const expected = getWebhookSecret();
  if (!expected) return false;
  const provided = req.headers["x-telegram-bot-api-secret-token"];
  if (typeof provided !== "string") return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Same timing-safe pattern for the AI agent's shared secret.
function validAiSecret(req: Request): boolean {
  const expected = getAiSharedSecret();
  if (!expected) return false;
  const provided = req.headers["x-support-secret"];
  if (typeof provided !== "string") return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// System messages shown to the merchant when the AI escalates to a human.
const ESCALATION_MESSAGES: Record<"money" | "human_requested", string> = {
  human_requested: "You're being connected with a real person. Anto will reply here shortly.",
  money: "This looks like a billing question — a human will take it from here and reply shortly.",
};

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

type Middleware = (req: Request, res: Response, next: Function) => void;

export function registerSupportRoutes(app: Express, requireAuth: Middleware): void {
  warnIfTelegramMisconfigured();

  // Per-user message rate limit: 10 messages / minute.
  const messageLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: "You're sending messages too quickly. Please wait a moment." },
    standardHeaders: true,
    legacyHeaders: false,
    // Behind requireAuth, so req.user is always present; key purely by user id
    // (no IP fallback, which would trip express-rate-limit's IPv6 validation).
    keyGenerator: (req: Request) => req.user?.id ?? "anonymous",
  });

  // Create (or return existing) open conversation for the merchant.
  app.post("/api/support/conversations", requireAuth, async (req, res) => {
    try {
      const { conversation } = await getOrCreateOpenConversation(req.user!.id);
      const messages = await db
        .select()
        .from(supportMessages)
        .where(eq(supportMessages.conversationId, conversation.id))
        .orderBy(asc(supportMessages.createdAt));
      res.json({ conversation, messages });
    } catch (err) {
      console.error("[Support] create conversation error:", err);
      res.status(500).json({ error: "Failed to start conversation" });
    }
  });

  // Fetch the merchant's current open conversation (if any) plus its messages.
  app.get("/api/support/conversations/current", requireAuth, async (req, res) => {
    try {
      const [conversation] = await db
        .select()
        .from(supportConversations)
        .where(and(eq(supportConversations.userId, req.user!.id), eq(supportConversations.status, "open")))
        .orderBy(desc(supportConversations.createdAt))
        .limit(1);
      if (!conversation) return res.status(404).json({ error: "No open conversation" });
      const messages = await db
        .select()
        .from(supportMessages)
        .where(eq(supportMessages.conversationId, conversation.id))
        .orderBy(asc(supportMessages.createdAt));
      res.json({ conversation, messages });
    } catch (err) {
      console.error("[Support] get current conversation error:", err);
      res.status(500).json({ error: "Failed to load conversation" });
    }
  });

  // Ensure a conversation belongs to the caller before mutating/streaming it.
  async function ownConversation(userId: string, conversationId: number) {
    const [conv] = await db
      .select()
      .from(supportConversations)
      .where(and(eq(supportConversations.id, conversationId), eq(supportConversations.userId, userId)))
      .limit(1);
    return conv ?? null;
  }

  // Post a merchant message. Persists + returns immediately, relays in background.
  app.post("/api/support/conversations/:id/messages", requireAuth, messageLimiter, async (req, res) => {
    const conversationId = Number(req.params.id);
    if (!Number.isInteger(conversationId)) return res.status(400).json({ error: "Invalid conversation id" });

    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
    if (!body) return res.status(400).json({ error: "Message body is required" });
    if (body.length > 2000) return res.status(400).json({ error: "Message is too long" });

    try {
      const conv = await ownConversation(req.user!.id, conversationId);
      if (!conv) return res.status(404).json({ error: "Conversation not found" });

      // A closed conversation cannot receive new messages — the client must
      // start a fresh conversation instead (spec: 409).
      if (conv.status === "closed") {
        return res.status(409).json({ error: "Conversation is closed" });
      }

      // Header is attached to the first user message of the conversation.
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(supportMessages)
        .where(and(eq(supportMessages.conversationId, conversationId), eq(supportMessages.sender, "user")));
      const isFirstUserMessage = (count ?? 0) === 0;

      const message = await insertMessage(conversationId, "user", body, { readByUser: true });
      res.json({ message });

      // Background relay — failures never affect the customer's request.
      void relayUserMessage(message, conv.shortCode, req.user!.id, isFirstUserMessage);

      // Forward to the external AI agent only for open, ai-mode conversations.
      // Fire-and-forget: a forward failure never affects anything else.
      if (isAiConfigured() && conv.status === "open" && conv.mode === "ai") {
        void forwardToAi(
          { id: conv.id, shortCode: conv.shortCode, userId: req.user!.id },
          message,
        );
      }
    } catch (err) {
      console.error("[Support] post message error:", err);
      if (!res.headersSent) res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Mark all agent messages in a conversation as read by the merchant.
  app.post("/api/support/conversations/:id/read", requireAuth, async (req, res) => {
    const conversationId = Number(req.params.id);
    if (!Number.isInteger(conversationId)) return res.status(400).json({ error: "Invalid conversation id" });
    try {
      const conv = await ownConversation(req.user!.id, conversationId);
      if (!conv) return res.status(404).json({ error: "Conversation not found" });
      await db
        .update(supportMessages)
        .set({ readByUser: true })
        .where(and(eq(supportMessages.conversationId, conversationId), eq(supportMessages.readByUser, false)));
      res.json({ ok: true });
    } catch (err) {
      console.error("[Support] mark read error:", err);
      res.status(500).json({ error: "Failed to mark read" });
    }
  });

  // SSE stream of new agent/system messages and status changes for a conversation.
  app.get("/api/support/conversations/:id/events", requireAuth, async (req, res) => {
    const conversationId = Number(req.params.id);
    if (!Number.isInteger(conversationId)) return res.status(400).end();
    const conv = await ownConversation(req.user!.id, conversationId);
    if (!conv) return res.status(404).end();

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(": connected\n\n");

    const listener = (event: SupportEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };
    emitter.on(channel(conversationId), listener);

    // Heartbeat so proxies/browsers keep the connection alive.
    const heartbeat = setInterval(() => {
      res.write(": ping\n\n");
    }, 25000);

    req.on("close", () => {
      clearInterval(heartbeat);
      emitter.off(channel(conversationId), listener);
      res.end();
    });
  });

  // Telegram webhook — unauthenticated but secured by the secret-token header.
  app.post("/api/webhooks/telegram", async (req, res) => {
    const body = req.body as Partial<TelegramUpdate> | undefined;
    const updateId =
      body && typeof body.update_id === "number" ? String(body.update_id) : "unknown";

    if (!validWebhookSecret(req)) {
      console.warn(`[Support][webhook] rejected reason=bad_secret update_id=${updateId}`);
      return res.status(401).json({ error: "Unauthorized" });
    }
    // Always ack quickly so Telegram doesn't retry a request we did receive.
    res.json({ ok: true });

    try {
      const update = req.body as TelegramUpdate;
      if (!update || typeof update.update_id !== "number") {
        console.warn(`[Support][webhook] ignored reason=unsupported_update_type update_id=${updateId}`);
        return;
      }
      if (!update.message && !update.callback_query) {
        console.warn(
          `[Support][webhook] ignored reason=unsupported_update_type update_id=${update.update_id}`,
        );
        return;
      }
      if (!isFromAdminChat(update)) {
        // Log the extracted candidate ids vs the expected admin id (numeric
        // chat ids are not secrets) so an admin-id misconfiguration is
        // immediately diagnosable from production logs.
        console.warn(
          `[Support][webhook] ignored reason=wrong_chat update_id=${update.update_id} ` +
            `candidates=[${adminCandidateIds(update).join(",")}] expected=${normalizeId(getAdminChatId())}`,
        );
        return;
      }
      const isNew = await claimUpdateId(update.update_id);
      if (!isNew) {
        console.warn(
          `[Support][webhook] ignored reason=duplicate_update_id update_id=${update.update_id}`,
        );
        return;
      }
      await handleTelegramUpdate(update);
      console.log(`[Support][webhook] processed update_id=${update.update_id} — passed all gates`);
    } catch (err) {
      console.error(`[Support][webhook] processing error update_id=${updateId}:`, err);
    }
  });

  // --- AI agent inbound: reply -------------------------------------------
  // Secured by the shared secret; unauthenticated otherwise (called by n8n).
  app.post("/api/support/ai/reply", async (req, res) => {
    if (!isAiConfigured()) {
      return res.status(503).json({ error: "AI integration is not configured" });
    }
    if (!validAiSecret(req)) {
      console.warn("[Support][ai] reply rejected reason=bad_secret");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const conversationId = Number(req.body?.conversationId);
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!Number.isInteger(conversationId) || !text) {
      return res.status(400).json({ error: "conversationId and non-empty text are required" });
    }
    if (text.length > 3000) {
      return res.status(400).json({ error: "Text is too long (max 3000 characters)" });
    }

    try {
      // Transaction with a row lock: the state re-check and the insert are
      // atomic, so a manual takeover (which flips mode before inserting the
      // agent message) cannot interleave between check and insert.
      const outcome = await db.transaction(async (tx) => {
        const [conv] = await tx
          .select()
          .from(supportConversations)
          .where(eq(supportConversations.id, conversationId))
          .for("update")
          .limit(1);
        if (!conv) return { kind: "not_found" as const };
        if (conv.status !== "open" || conv.mode !== "ai") {
          return { kind: "taken_over" as const, status: conv.status, mode: conv.mode };
        }
        const aiMsg = await insertMessage(conversationId, "ai", text, { readByUser: false }, tx);
        return { kind: "inserted" as const, aiMsg, shortCode: conv.shortCode };
      });

      if (outcome.kind === "not_found") {
        return res.status(404).json({ error: "Conversation not found" });
      }
      if (outcome.kind === "taken_over") {
        console.log(
          `[Support][ai] reply rejected conversation=${conversationId} ` +
            `status=${outcome.status} mode=${outcome.mode} — conversation_taken_over`,
        );
        return res.status(409).json({ error: "conversation_taken_over" });
      }

      const { aiMsg } = outcome;
      emitSupportEvent(conversationId, { type: "message", message: aiMsg });
      console.log(
        `[Support][ai] reply inserted conversation=${conversationId} ` +
          `message_id=${aiMsg.id} — SSE 'message' emitted`,
      );
      res.json({ ok: true, messageId: aiMsg.id });

      // Copy to Telegram in the background; failure leaves deliveredToAgent
      // false for the sweep to retry, and never affects the stored reply.
      void relayAiCopy(aiMsg, outcome.shortCode);
    } catch (err) {
      console.error("[Support][ai] reply endpoint error:", err);
      if (!res.headersSent) res.status(500).json({ error: "Failed to store reply" });
    }
  });

  // --- AI agent inbound: escalate to human --------------------------------
  app.post("/api/support/ai/escalate", async (req, res) => {
    if (!isAiConfigured()) {
      return res.status(503).json({ error: "AI integration is not configured" });
    }
    if (!validAiSecret(req)) {
      console.warn("[Support][ai] escalate rejected reason=bad_secret");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const conversationId = Number(req.body?.conversationId);
    const reason = req.body?.reason as unknown;
    if (!Number.isInteger(conversationId) || (reason !== "money" && reason !== "human_requested")) {
      return res
        .status(400)
        .json({ error: "conversationId and reason ('money' | 'human_requested') are required" });
    }

    try {
      // Atomic conditional flip: only ONE concurrent escalate (or none, if a
      // takeover already flipped the mode) wins this UPDATE, so exactly one
      // system message + operator ping is ever produced.
      const [flipped] = await db
        .update(supportConversations)
        .set({ mode: "human" })
        .where(
          and(
            eq(supportConversations.id, conversationId),
            eq(supportConversations.mode, "ai"),
            eq(supportConversations.status, "open"),
          ),
        )
        .returning();

      if (!flipped) {
        const [conv] = await db
          .select({ id: supportConversations.id })
          .from(supportConversations)
          .where(eq(supportConversations.id, conversationId))
          .limit(1);
        if (!conv) return res.status(404).json({ error: "Conversation not found" });
        // Idempotent: already human (or closed) means there is nothing to do.
        return res.json({ ok: true, alreadyHuman: true });
      }
      const conv = flipped;

      const sysMsg = await insertMessage(conversationId, "system", ESCALATION_MESSAGES[reason], {
        readByUser: false,
      });
      emitSupportEvent(conversationId, { type: "message", message: sysMsg });
      console.log(
        `[Support][ai] escalated conversation=${conversationId} reason=${reason} ` +
          `— mode flipped to human, SSE 'message' emitted`,
      );
      res.json({ ok: true, alreadyHuman: false });

      // Ping the operator in the background. If this fails, the mode flip and
      // system message stand — never let a Telegram hiccup silently leave the
      // bot in charge of a billing issue.
      void (async () => {
        try {
          const [user] = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, conv.userId))
            .limit(1);
          const email = user?.email ?? "unknown";
          const ping =
            reason === "money"
              ? `⚠️ [${conv.shortCode}] Billing question from ${email} — switched to human mode. Reply here as usual.`
              : `⚠️ [${conv.shortCode}] ${email} asked for a human — switched to human mode. Reply here as usual.`;
          await sendMessage(ping);
        } catch (err) {
          console.error(
            `[Support][ai] escalation ping failed conversation=${conversationId}: ` +
              `${err instanceof Error ? err.message : err}`,
          );
        }
      })();
    } catch (err) {
      console.error("[Support][ai] escalate endpoint error:", err);
      if (!res.headersSent) res.status(500).json({ error: "Failed to escalate" });
    }
  });
}

// ---------------------------------------------------------------------------
// Periodic sweep: auto-close stale chats + retry undelivered relays
// ---------------------------------------------------------------------------

const AUTO_CLOSE_MS = 24 * 60 * 60 * 1000; // 24h of inactivity
const MAX_RETRIES_PER_SWEEP = 20;

async function runSupportSweep(): Promise<void> {
  // 1) Auto-close conversations with no user/agent activity in 24h. The greeting
  //    (system) message is ignored, so a chat that only ever got a greeting is
  //    not force-closed on a schedule.
  try {
    const openConvs = await db
      .select({ id: supportConversations.id })
      .from(supportConversations)
      .where(eq(supportConversations.status, "open"));
    const cutoff = new Date(Date.now() - AUTO_CLOSE_MS);
    for (const conv of openConvs) {
      const [last] = await db
        .select({ createdAt: supportMessages.createdAt })
        .from(supportMessages)
        .where(and(eq(supportMessages.conversationId, conv.id), ne(supportMessages.sender, "system")))
        .orderBy(desc(supportMessages.createdAt))
        .limit(1);
      if (last?.createdAt && last.createdAt < cutoff) {
        await closeConversation(
          conv.id,
          "This conversation was closed automatically after 24 hours of inactivity.",
        );
      }
    }
  } catch (err) {
    console.error("[Support] auto-close sweep error:", err);
  }

  // 2) Retry undelivered Telegram sends in still-open conversations, oldest
  //    first: user-message relays AND copies of AI replies. This retry pass is
  //    Telegram-only — forwards to the external AI agent are never retried.
  if (!isTelegramConfigured()) return;
  try {
    const pending = await db
      .select({
        message: supportMessages,
        shortCode: supportConversations.shortCode,
        userId: supportConversations.userId,
      })
      .from(supportMessages)
      .innerJoin(supportConversations, eq(supportMessages.conversationId, supportConversations.id))
      .where(
        and(
          inArray(supportMessages.sender, ["user", "ai"]),
          eq(supportMessages.deliveredToAgent, false),
          eq(supportConversations.status, "open"),
        ),
      )
      .orderBy(asc(supportMessages.createdAt))
      .limit(MAX_RETRIES_PER_SWEEP);

    for (const row of pending) {
      try {
        if (row.message.sender === "ai") {
          // Retry the Telegram copy of an AI reply (same framing as the
          // original send so swipe-reply routing keeps working).
          await relayAiCopy(row.message, row.shortCode);
          continue;
        }

        // Header only if no user message from this conversation has been delivered yet.
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(supportMessages)
          .where(
            and(
              eq(supportMessages.conversationId, row.message.conversationId),
              eq(supportMessages.sender, "user"),
              eq(supportMessages.deliveredToAgent, true),
            ),
          );
        const includeHeader = (count ?? 0) === 0;
        const telegramMessageId = await attemptRelay(row.message, row.shortCode, row.userId, includeHeader);
        if (telegramMessageId != null) {
          await db
            .update(supportMessages)
            .set({ telegramMessageId, deliveredToAgent: true })
            .where(eq(supportMessages.id, row.message.id));
        }
      } catch (err) {
        console.error(`[Support] sweep retry failed for message ${row.message.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[Support] retry sweep error:", err);
  }
}

let sweepStarted = false;

export function startSupportSweepService(): void {
  if (sweepStarted) return;
  sweepStarted = true;
  const INTERVAL_MS = 15 * 60 * 1000; // every 15 minutes
  setInterval(() => {
    void runSupportSweep();
  }, INTERVAL_MS);
  console.log("[Support] Sweep service started (auto-close + relay retry every 15m).");
}
