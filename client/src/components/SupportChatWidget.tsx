import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface Conversation {
  id: number;
  shortCode: string;
  status: "open" | "closed";
}

interface Message {
  id: number;
  conversationId: number;
  sender: "user" | "agent" | "system" | "ai";
  body: string;
  createdAt: string;
  readByUser: boolean;
  deliveredToAgent: boolean;
  telegramMessageId: number | null;
  // Client-only delivery state for optimistic user messages.
  _status?: "sending" | "sent" | "failed";
}

type ConversationResponse = { conversation: Conversation | null; messages: Message[] };

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [unread, setUnread] = useState(0);

  const openRef = useRef(open);
  openRef.current = open;
  const esRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // --- Load any existing conversation on mount so the unread badge is accurate
  // even before the panel is opened. ---
  useEffect(() => {
    let cancelled = false;
    apiRequest<ConversationResponse>("/api/support/conversations/current")
      .then((data) => {
        if (cancelled || !data.conversation) return;
        setConversation(data.conversation);
        setMessages(data.messages);
        const unreadCount = data.messages.filter(
          (m) => m.sender === "agent" && !m.readByUser,
        ).length;
        setUnread(unreadCount);
      })
      .catch(() => {
        /* not logged in yet or no conversation — silent */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const mergeMessage = useCallback((incoming: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === incoming.id)) return prev;
      return [...prev, incoming];
    });
  }, []);

  // --- Subscribe to the live event stream whenever we have a conversation. ---
  useEffect(() => {
    if (!conversation) return;
    const es = new EventSource(`/api/support/conversations/${conversation.id}/events`);
    esRef.current = es;

    es.onmessage = (evt) => {
      try {
        const event = JSON.parse(evt.data) as
          | { type: "message"; message: Message }
          | { type: "status"; status: "open" | "closed" };
        if (event.type === "message") {
          mergeMessage(event.message);
          if (event.message.sender === "agent" && !openRef.current) {
            setUnread((u) => u + 1);
          }
        } else if (event.type === "status") {
          setConversation((c) => (c ? { ...c, status: event.status } : c));
        }
      } catch {
        /* ignore malformed frame */
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects; nothing to do here.
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [conversation?.id, mergeMessage]);

  // --- Keep the message list scrolled to the newest message. ---
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const markRead = useCallback(async (conversationId: number) => {
    setUnread(0);
    setMessages((prev) =>
      prev.map((m) => (m.sender === "agent" ? { ...m, readByUser: true } : m)),
    );
    try {
      await apiRequest(`/api/support/conversations/${conversationId}/read`, { method: "POST" });
    } catch {
      /* non-fatal */
    }
  }, []);

  // Create a fresh conversation and swap the widget over to it.
  const startNewConversation = useCallback(async () => {
    setStarting(true);
    try {
      const data = await apiRequest<ConversationResponse>("/api/support/conversations", {
        method: "POST",
      });
      if (data.conversation) {
        setConversation(data.conversation);
        setMessages(data.messages);
        setUnread(0);
      }
    } catch {
      /* surfaced via disabled send state */
    } finally {
      setStarting(false);
    }
  }, []);

  const handleOpen = useCallback(async () => {
    setOpen(true);
    if (conversation) {
      void markRead(conversation.id);
      return;
    }
    // Lazily create a conversation the first time the panel is opened.
    await startNewConversation();
  }, [conversation, markRead, startNewConversation]);

  const sendMessage = useCallback(
    async (body: string, retryTempId?: number) => {
      if (!conversation || !body.trim()) return;
      const text = body.trim();
      const tempId = retryTempId ?? -Date.now();

      if (retryTempId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === retryTempId ? { ...m, _status: "sending" } : m)),
        );
      } else {
        const optimistic: Message = {
          id: tempId,
          conversationId: conversation.id,
          sender: "user",
          body: text,
          createdAt: new Date().toISOString(),
          readByUser: true,
          deliveredToAgent: false,
          telegramMessageId: null,
          _status: "sending",
        };
        setMessages((prev) => [...prev, optimistic]);
      }

      setSending(true);
      try {
        const data = await apiRequest<{ message: Message }>(
          `/api/support/conversations/${conversation.id}/messages`,
          { method: "POST", body: JSON.stringify({ body: text }) },
        );
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...data.message, _status: "sent" } : m)),
        );
      } catch (err) {
        // A 409 surfaces as "Conversation is closed" (the server's error body).
        // Reflect the closed state so the user is prompted to start a new one.
        if (err instanceof Error && /closed/i.test(err.message)) {
          setConversation((c) => (c ? { ...c, status: "closed" } : c));
        }
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, _status: "failed" } : m)),
        );
      } finally {
        setSending(false);
      }
    },
    [conversation],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    void sendMessage(input);
    setInput("");
  };

  return (
    <>
      {/* Launcher bubble */}
      {!open && (
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Open support chat"
          data-testid="button-support-open"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover-elevate active-elevate-2"
        >
          <MessageCircle className="h-6 w-6" />
          {unread > 0 && (
            <span
              data-testid="badge-support-unread"
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-medium text-destructive-foreground"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}

      {/* Chat panel — full-screen sheet on mobile, floating card on desktop */}
      {open && (
        <Card
          className="fixed inset-0 z-50 flex h-full max-h-none w-full max-w-none flex-col overflow-hidden rounded-none p-0 shadow-lg sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[32rem] sm:max-h-[calc(100vh-3rem)] sm:w-[22rem] sm:max-w-[calc(100vw-3rem)] sm:rounded-md"
          data-testid="panel-support-chat"
        >
          <div className="flex items-center justify-between gap-2 border-b p-4">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  conversation?.status === "closed" ? "bg-muted-foreground" : "bg-green-500",
                )}
                aria-hidden="true"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">uniHub Support</span>
                <span className="text-xs text-muted-foreground">
                  {conversation?.status === "closed"
                    ? "This chat is closed"
                    : "We usually reply within a few hours"}
                </span>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setOpen(false)}
              data-testid="button-support-close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto p-4"
            data-testid="list-support-messages"
          >
            {starting && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {messages.map((m) => {
              if (m.sender === "system") {
                return (
                  <div
                    key={m.id}
                    className="mx-auto max-w-[90%] rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground"
                    data-testid={`message-system-${m.id}`}
                  >
                    {m.body}
                  </div>
                );
              }
              const isUser = m.sender === "user";
              return (
                <div
                  key={m.id}
                  className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}
                  data-testid={`message-${m.sender}-${m.id}`}
                >
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap break-words rounded-md px-3 py-2 text-sm",
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {m.body}
                  </div>
                  <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                    <span>{formatTime(m.createdAt)}</span>
                    {m.sender === "ai" && (
                      <span
                        className="rounded-sm border px-1 text-[10px] font-medium uppercase"
                        data-testid={`badge-ai-${m.id}`}
                      >
                        AI
                      </span>
                    )}
                    {isUser && m._status === "sending" && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    {isUser && m._status === "failed" && (
                      <button
                        type="button"
                        onClick={() => void sendMessage(m.body, m.id)}
                        className="flex items-center gap-1 text-destructive hover-elevate rounded-sm px-1"
                        data-testid={`button-retry-${m.id}`}
                      >
                        <RefreshCw className="h-3 w-3" /> Retry
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {conversation?.status === "closed" ? (
            <div className="border-t p-3">
              <Button
                type="button"
                className="w-full"
                onClick={() => void startNewConversation()}
                disabled={starting}
                data-testid="button-support-new-conversation"
              >
                {starting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Start new conversation"
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t p-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    handleSubmit(e);
                  }
                }}
                placeholder="Type your message..."
                rows={1}
                maxLength={2000}
                className="max-h-24 min-h-9 flex-1 resize-none"
                disabled={!conversation || starting}
                data-testid="input-support-message"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!conversation || !input.trim() || sending || starting}
                data-testid="button-support-send"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          )}
        </Card>
      )}
    </>
  );
}
