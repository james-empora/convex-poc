"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
  type ReactNode,
} from "react";
import type { ChatSendOptions } from "@/components/composite/chat-input";
import {
  ChatBubble,
  type ChatMessage,
} from "@/components/composite/chat-bubble";
import { TypingIndicator } from "@/components/composite/chat-bubble";
import {
  PermissionCard,
  type PermissionRequest,
} from "@/components/composite/permission-card";
import { consumeChatStream, type StreamPermissionEvent } from "@/lib/chat/parse-stream";
import { ResourceLinkProvider } from "@/lib/chat/resource-link-context";

/* ---------- types ---------- */

type TimelineItem =
  | { kind: "message"; data: ChatMessage }
  | { kind: "permission"; data: PermissionRequest };

export interface ChatTimelineHandle {
  sendMessage: (content: string, options?: ChatSendOptions) => void;
  handleSend: (content: string, files: File[], options: ChatSendOptions) => void;
  handleStop: () => void;
}

export interface ChatTimelineProps {
  /** File ID for scoped context, or null for general coordinator chat */
  fileId?: string | null;
  /** Prefix for message IDs (e.g., "msg" or "${tabId}-msg") */
  idPrefix?: string;
  /** Custom empty state shown when no messages exist */
  emptyState?: ReactNode;
  /** Called before a message is sent (e.g., to clear skill pre-fill state) */
  onBeforeSend?: () => void;
  /** Called when streaming state changes */
  onStreamingChange?: (isStreaming: boolean) => void;
}

/* ---------- component ---------- */

export const ChatTimeline = forwardRef<ChatTimelineHandle, ChatTimelineProps>(
  function ChatTimeline(
    {
      fileId = null,
      idPrefix = "msg",
      emptyState,
      onBeforeSend,
      onStreamingChange,
    },
    ref,
  ) {
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);
    const sessionIdRef = useRef<string>(crypto.randomUUID());
    const hasSessionRef = useRef(false);
    const activeAssistantIdRef = useRef<string | null>(null);

    const scrollToBottom = useCallback(() => {
      const el = scrollRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, []);

    useEffect(() => {
      scrollToBottom();
    }, [timeline, isStreaming, scrollToBottom]);

    useEffect(() => {
      onStreamingChange?.(isStreaming);
    }, [isStreaming, onStreamingChange]);

    useEffect(() => {
      return () => {
        abortRef.current?.abort();
      };
    }, []);

    const sendMessage = useCallback(
      async (
        content: string,
        options: ChatSendOptions = { model: "claude-sonnet-4-6", thinking: false },
      ) => {
        if (!content.trim()) return;

        const userMessage: ChatMessage = {
          id: `${idPrefix}-${Date.now()}`,
          role: "user",
          content: content.trim(),
          timestamp: new Date(),
        };

        setTimeline((prev) => [...prev, { kind: "message", data: userMessage }]);
        setIsStreaming(true);

        const firstAssistantId = `${idPrefix}-${Date.now() + 1}`;
        activeAssistantIdRef.current = firstAssistantId;
        setTimeline((prev) => [
          ...prev,
          {
            kind: "message",
            data: { id: firstAssistantId, role: "assistant", content: "", timestamp: new Date() },
          },
        ]);

        const allMessages: Array<{ role: string; content: string }> = [];
        for (const item of timeline) {
          if (item.kind === "message") {
            allMessages.push({ role: item.data.role, content: item.data.content });
          }
        }
        allMessages.push({ role: userMessage.role, content: userMessage.content });

        const abortController = new AbortController();
        abortRef.current = abortController;

        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: allMessages,
              fileId,
              model: options.model,
              sessionId: sessionIdRef.current,
              resumeSession: hasSessionRef.current,
            }),
            signal: abortController.signal,
          });

          if (!response.ok) throw new Error(`Chat request failed: ${response.status}`);
          if (!response.body) throw new Error("No response body");

          await consumeChatStream(
            response.body,
            {
              onTextDelta: (delta) => {
                let assistantId = activeAssistantIdRef.current;

                if (!assistantId) {
                  assistantId = `${idPrefix}-${Date.now()}`;
                  activeAssistantIdRef.current = assistantId;
                  setTimeline((prev) => [
                    ...prev,
                    {
                      kind: "message",
                      data: { id: assistantId!, role: "assistant", content: delta, timestamp: new Date() },
                    },
                  ]);
                  return;
                }

                setTimeline((prev) =>
                  prev.map((item) =>
                    item.kind === "message" && item.data.id === assistantId
                      ? { ...item, data: { ...item.data, content: item.data.content + delta } }
                      : item,
                  ),
                );
              },
              onPermission: (event: StreamPermissionEvent) => {
                activeAssistantIdRef.current = null;
                setTimeline((prev) => [...prev, { kind: "permission", data: event }]);
              },
            },
            abortController.signal,
          );

          hasSessionRef.current = true;

          setTimeline((prev) =>
            prev.filter(
              (item) =>
                !(item.kind === "message" && item.data.role === "assistant" && !item.data.content.trim()),
            ),
          );
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          console.error("[chat-timeline] Stream error:", err);
          const assistantId = activeAssistantIdRef.current;
          if (assistantId) {
            setTimeline((prev) =>
              prev.map((item) =>
                item.kind === "message" && item.data.id === assistantId
                  ? { ...item, data: { ...item.data, content: `*Error: ${(err as Error).message}*` } }
                  : item,
              ),
            );
          }
        } finally {
          setIsStreaming(false);
          abortRef.current = null;
          activeAssistantIdRef.current = null;
        }
      },
      [fileId, idPrefix, timeline],
    );

    const handleStop = useCallback(() => {
      abortRef.current?.abort();
      setIsStreaming(false);
    }, []);

    const handleSend = useCallback((content: string, _files: File[], options: ChatSendOptions) => {
      onBeforeSend?.();
      sendMessage(content, options);
    }, [onBeforeSend, sendMessage]);

    useImperativeHandle(ref, () => ({
      sendMessage,
      handleSend,
      handleStop,
    }), [sendMessage, handleSend, handleStop]);

    const isEmpty = timeline.length === 0 && !isStreaming;
    const lastItem = timeline.at(-1);
    const showTyping =
      isStreaming &&
      lastItem?.kind === "message" &&
      lastItem.data.role === "assistant" &&
      !lastItem.data.content;

    return (
      <ResourceLinkProvider fileId={fileId}>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {isEmpty ? (
            emptyState ?? null
          ) : (
            <div className="mx-auto max-w-2xl px-4 py-6">
              <div className="flex flex-col gap-4">
                {timeline.map((item) =>
                  item.kind === "message" ? (
                    <ChatBubble key={item.data.id} message={item.data} />
                  ) : (
                    <PermissionCard
                      key={item.data.id}
                      permission={item.data}
                      onResolve={() => {}}
                    />
                  ),
                )}
                {showTyping && <TypingIndicator />}
              </div>
            </div>
          )}
        </div>
      </ResourceLinkProvider>
    );
  },
);
