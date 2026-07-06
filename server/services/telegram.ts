// Telegram Bot API client for the live support chat feature.
//
// Plain fetch against https://api.telegram.org — no third-party Telegram
// framework. This module is the ONLY outbound integration for support chat.
// Secrets come from env only and message bodies are never logged.

// Trim env values at load: secrets pasted into a dashboard commonly pick up a
// trailing newline/space, which would silently break the admin-chat comparison
// and the secret-token check (both are exact-match).
const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;

// True only when every TELEGRAM_* var is present. When false the chat feature
// degrades gracefully: customer messages are stored with deliveredToAgent=false
// and no Telegram call is attempted (the retry sweep picks them up later).
export function isTelegramConfigured(): boolean {
  return !!(TOKEN && ADMIN_CHAT_ID && WEBHOOK_SECRET);
}

export function getWebhookSecret(): string | undefined {
  return WEBHOOK_SECRET;
}

export function getAdminChatId(): string | undefined {
  return ADMIN_CHAT_ID;
}

// Fail fast (warn, never crash) at startup if any TELEGRAM_* var is missing.
export function warnIfTelegramMisconfigured(): void {
  const missing: string[] = [];
  if (!TOKEN) missing.push("TELEGRAM_BOT_TOKEN");
  if (!ADMIN_CHAT_ID) missing.push("TELEGRAM_ADMIN_CHAT_ID");
  if (!WEBHOOK_SECRET) missing.push("TELEGRAM_WEBHOOK_SECRET");
  if (missing.length > 0) {
    console.warn(
      `[Telegram] Support chat running in degraded mode — missing env: ${missing.join(", ")}. ` +
      `Customer messages will be stored and relayed once these secrets are set.`,
    );
  } else {
    console.log("[Telegram] Support chat configured and ready.");
  }
}

interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

// Send a plain-text message to the admin chat. No parse_mode is used so
// user-supplied text can never break formatting or inject markup.
// Returns the Telegram message_id of the sent message.
export async function sendMessage(
  text: string,
  opts?: { replyMarkup?: object },
): Promise<number> {
  if (!TOKEN || !ADMIN_CHAT_ID) {
    throw new Error("Telegram is not configured");
  }

  const res = await fetch(`${BASE_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: ADMIN_CHAT_ID,
      text,
      reply_markup: opts?.replyMarkup,
    }),
  });

  const data = (await res.json()) as TelegramApiResponse<{ message_id: number }>;
  if (!data.ok || !data.result) {
    throw new Error(`Telegram sendMessage failed: ${data.description ?? res.statusText}`);
  }
  return data.result.message_id;
}

// Acknowledge an inline-button tap so Telegram stops showing the loading spinner.
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
): Promise<void> {
  if (!TOKEN) {
    throw new Error("Telegram is not configured");
  }
  await fetch(`${BASE_URL}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

// Minimal typed shape of the Telegram update payload — only the fields we use.
export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    reply_to_message?: {
      message_id: number;
    };
    chat: {
      id: number;
    };
    from?: {
      id: number;
    };
  };
  callback_query?: {
    id: string;
    data?: string;
    from: {
      id: number;
    };
    message?: {
      chat: {
        id: number;
      };
    };
  };
}
