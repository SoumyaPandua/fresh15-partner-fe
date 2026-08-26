"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  X,
  Loader2,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useAuth } from "@/lib/app-state";
import { sendAiMessage, type AiMessage } from "@/lib/ai-chat-api";
import { sendAiAgent } from "@/lib/ai-agent-api";
import { toast } from "sonner";

const chatbotStarter: AiMessage[] = [
  {
    role: "assistant",
    content:
      "Hi! I’m Fresh15 AI. I can help with Fresh15 products, offers, cart, orders, delivery, refunds, payments and grocery suggestions.",
  },
];

type AgentMessage = {
  role: "user" | "assistant";
  content: string;
};

export function Fresh15AiAssistant() {
  const { token } = useAuth();

  const [chatOpen, setChatOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [agentInput, setAgentInput] = useState("");

  const [chatMessages, setChatMessages] =
    useState<AiMessage[]>(chatbotStarter);

  const [agentMessages, setAgentMessages] =
    useState<AgentMessage[]>([
      {
        role: "assistant",
        content:
          "Hi! I’m Fresh15 Agent. Tell me what you want to do and I’ll help you through the available Fresh15 actions.",
      },
    ]);

  const [conversationId, setConversationId] =
    useState<string | undefined>();

  const [agentConversationId, setAgentConversationId] =
    useState<string | undefined>();

  const [chatLoading, setChatLoading] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const agentEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    agentEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [agentMessages, agentLoading]);

  if (!token) {
    return null;
  }

  const authenticatedToken = token;

  async function submitChat() {
    const text = chatInput.trim();

    if (!text || chatLoading) {
      return;
    }

    setChatInput("");

    setChatMessages((current) => [
      ...current,
      {
        role: "user",
        content: text,
      },
    ]);

    setChatLoading(true);

    try {
      const response = await sendAiMessage(
        authenticatedToken,
        text,
        conversationId,
      );

      setConversationId(
        response.conversationId,
      );

      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.reply,
          blocked: response.blocked,
        },
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Fresh15 AI is unavailable.",
      );
    } finally {
      setChatLoading(false);
    }
  }

  async function submitAgent() {
    const text = agentInput.trim();

    if (!text || agentLoading) {
      return;
    }

    setAgentInput("");

    setAgentMessages((current) => [
      ...current,
      {
        role: "user",
        content: text,
      },
    ]);

    setAgentLoading(true);

    try {
      const response = await sendAiAgent(
        authenticatedToken,
        text,
        agentConversationId,
      );

      setAgentConversationId(
        response.conversationId,
      );

      const actions = response.actions ?? [];

      let assistantText =
        response.reply?.trim() ||
        "Done. I processed your request.";

      if (actions.length > 0) {
        assistantText +=
          `\n\nActions completed: ${actions.length}`;
      }

      setAgentMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: assistantText,
        },
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Fresh15 Agent is unavailable.",
      );
    } finally {
      setAgentLoading(false);
    }
  }

  return (
    <>
      <style jsx global>{`
        @keyframes fresh15AiFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes fresh15AgentPulse {
          0%,
          100% {
            box-shadow:
              0 0 0 0 rgb(34 197 94 / 0.18);
          }

          50% {
            box-shadow:
              0 0 0 6px rgb(34 197 94 / 0);
          }
        }
      `}</style>

      {!chatOpen && !agentOpen && (
        <div className="fixed bottom-6 right-4 z-[70] flex flex-col items-end gap-2 sm:right-6">
          {/* Existing chatbot */}
          <button
            type="button"
            aria-label="Open Fresh15 AI"
            onClick={() => setChatOpen(true)}
            className="group flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/25 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/20 animate-[fresh15AiFloat_3.2s_ease-in-out_infinite]"
          >
            <span className="relative grid h-5 w-5 place-items-center">
              <Bot className="h-5 w-5 transition-transform duration-500 group-hover:rotate-12" />
              <Sparkles className="absolute -right-2 -top-2 h-3 w-3 animate-pulse" />
            </span>

            Fresh15 AI
          </button>

          {/* Agent */}
          <button
            type="button"
            aria-label="Open Fresh15 AI Agent"
            onClick={() => setAgentOpen(true)}
            className="group flex items-center gap-2 rounded-full border border-primary/30 bg-background/95 px-4 py-3 text-sm font-bold text-foreground shadow-lg backdrop-blur transition-all duration-300 hover:scale-105 hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-4 focus:ring-primary/20 animate-[fresh15AgentPulse_2.8s_ease-in-out_infinite]"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary">
              <WandSparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
            </span>

            Fresh15 Agent
          </button>
        </div>
      )}

      {/* Existing chatbot */}
      {chatOpen && (
        <div
          className="fixed inset-x-3 bottom-4 z-[70] flex h-[min(680px,78dvh)] max-h-[78dvh] flex-col overflow-hidden rounded-3xl border bg-background shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[390px]"
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
              </span>

              <div>
                <div className="font-black">
                  Fresh15 AI
                </div>

                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure assistant
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="rounded-full p-2 hover:bg-muted"
              aria-label="Close Fresh15 AI"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3"
            onWheel={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
          >
            <div className="space-y-3">
              {chatMessages.map(
                (message, index) => (
                  <div
                    key={`${index}-${message.role}`}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ),
              )}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-muted px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submitChat();
            }}
            className="shrink-0 border-t bg-card p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={chatInput}
                onChange={(event) =>
                  setChatInput(
                    event.target.value.slice(
                      0,
                      1200,
                    ),
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    void submitChat();
                  }
                }}
                rows={1}
                placeholder="Ask about Fresh15..."
                className="min-h-10 flex-1 resize-none rounded-2xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />

              <button
                type="submit"
                disabled={
                  !chatInput.trim() ||
                  chatLoading
                }
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
              >
                {chatLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Agent */}
      {agentOpen && (
        <div
          className="fixed inset-x-3 bottom-4 z-[70] flex h-[min(680px,78dvh)] max-h-[78dvh] flex-col overflow-hidden rounded-3xl border bg-background shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[390px]"
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                <WandSparkles className="h-5 w-5" />
              </span>

              <div>
                <div className="font-black">
                  Fresh15 Agent
                </div>

                <div className="text-[11px] text-muted-foreground">
                  Action-based assistant
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close Fresh15 Agent"
              onClick={() =>
                setAgentOpen(false)
              }
              className="rounded-full p-2 hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3"
            onWheel={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
          >
            <div className="space-y-3">
              {agentMessages.map(
                (message, index) => (
                  <div
                    key={`${index}-${message.role}`}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ),
              )}

              {agentLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-muted px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={agentEndRef} />
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submitAgent();
            }}
            className="shrink-0 border-t bg-card p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={agentInput}
                onChange={(event) =>
                  setAgentInput(
                    event.target.value.slice(
                      0,
                      1200,
                    ),
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    void submitAgent();
                  }
                }}
                rows={1}
                placeholder="Tell Fresh15 Agent what to do..."
                disabled={agentLoading}
                className="min-h-10 flex-1 resize-none rounded-2xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />

              <button
                type="submit"
                disabled={
                  !agentInput.trim() ||
                  agentLoading
                }
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                aria-label="Send agent command"
              >
                {agentLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="mt-2 text-[10px] text-muted-foreground">
              The agent can perform only permitted Fresh15 actions. Payments and other high-risk actions require confirmation.
            </div>
          </form>
        </div>
      )}
    </>
  );
}