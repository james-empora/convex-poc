"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { ChatInput, type ChatSendOptions } from "@/components/composite/chat-input";
import { ChatBubble, TypingIndicator } from "@/components/composite/chat-bubble";
import { AssistantMessageParts } from "@/components/composite/assistant-message-parts";
import { isToolPart } from "@/lib/chat/ui-helpers";
import { ResourceLinkProvider } from "@/lib/chat/resource-link-context";
import { uploadDocumentClient } from "@/lib/documents/client-upload";
import type { PersistedChatMessage } from "@/lib/chat/threads";
import { useChatThread } from "@/lib/chat/queries";
import { useFile } from "@/lib/files/queries";
import { pendingChatPromptAtom, pendingChatResourceAtom, pendingChatAutoSendAtom, pendingChatSkillAtom, pendingChatDomainAtom } from "@/app/(admin)/portfolio/_lib/atoms";
import type { ChatResource } from "@/lib/chat/types";
import type { SkillContext, SkillDomain } from "@/lib/skills/domains";
import type { SkillWithPlacements } from "@/lib/skills/list-skills";
import type { ThreadType } from "@/lib/chat/threads";

const EXT_MAP: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/tiff": "tiff",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

interface UploadedFileInfo {
  name: string;
  url: string;
  filetype: string;
  size: number;
}

const transport = new DefaultChatTransport({ api: "/api/chat" });

export function ChatContent({
  fileId,
  chatId,
  initialMessages,
  threadType,
}: {
  fileId: string;
  chatId: string;
  initialMessages?: PersistedChatMessage[];
  threadType?: ThreadType;
}) {
  // Only use server-provided messages when they match the current chatId.
  // When the user navigates client-side to a different chat, initialMessages
  // is stale (from the original server render) — fetch fresh data instead.
  const [serverChatId] = useState(chatId);
  const serverMessagesValid = !!initialMessages && chatId === serverChatId;
  const { data: savedChat, isLoading } = useChatThread(serverMessagesValid ? null : chatId);

  if (isLoading && !serverMessagesValid) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="rounded-xl border border-onyx-20 bg-onyx-5 px-4 py-2 text-sm text-onyx-60">
          Loading chat...
        </div>
      </div>
    );
  }

  const resolvedType = threadType ?? savedChat?.threadType;

  return (
    <ChatSessionWithResource
      key={chatId}
      fileId={fileId}
      chatId={chatId}
      initialMessages={
        serverMessagesValid
          ? initialMessages
          : ((savedChat?.messages as PersistedChatMessage[] | undefined) ?? [])
      }
      readOnly={resolvedType === "system"}
    />
  );
}

/**
 * Reads the pending resource atom for this chat and passes it into ChatSession.
 * The resource is consumed once on mount so the atom doesn't leak.
 */
function ChatSessionWithResource({
  fileId,
  chatId,
  initialMessages,
  readOnly,
}: {
  fileId: string;
  chatId: string;
  initialMessages: PersistedChatMessage[];
  readOnly?: boolean;
}) {
  const [pendingResources, setPendingResources] = useAtom(pendingChatResourceAtom);
  // Capture the resource once via lazy initializer — stable across re-renders
  const [resource] = useState<ChatResource | undefined>(() => pendingResources.get(chatId));

  // Consume the pending resource on mount so the atom doesn't leak
  useEffect(() => {
    if (pendingResources.has(chatId)) {
      setPendingResources((prev: Map<string, ChatResource>) => {
        const next = new Map(prev);
        next.delete(chatId);
        return next;
      });
    }
  }, [chatId, pendingResources, setPendingResources]);

  return (
    <ChatSession
      fileId={fileId}
      chatId={chatId}
      initialMessages={initialMessages}
      resource={resource}
      readOnly={readOnly}
    />
  );
}

function ChatSession({
  fileId,
  chatId,
  initialMessages,
  resource,
  readOnly,
}: {
  fileId: string;
  chatId: string;
  initialMessages: PersistedChatMessage[];
  resource?: ChatResource;
  readOnly?: boolean;
}) {
  const { data: file } = useFile(fileId);
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (titleRefreshTimeoutRef.current) {
        clearTimeout(titleRefreshTimeoutRef.current);
      }
    };
  }, []);

  const { messages, sendMessage, status, stop } = useChat({
    id: `file-chat-${chatId}`,
    messages: initialMessages,
    transport,
    onFinish: () => {
      router.refresh();

      if (titleRefreshTimeoutRef.current) {
        clearTimeout(titleRefreshTimeoutRef.current);
      }

      titleRefreshTimeoutRef.current = setTimeout(() => {
        router.refresh();
      }, 1200);
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Auto-submit or pre-fill a pending prompt (e.g., from skills or command palette)
  const [pendingPrompts, setPendingPrompts] = useAtom(pendingChatPromptAtom);
  const [pendingAutoSend, setPendingAutoSend] = useAtom(pendingChatAutoSendAtom);
  const [pendingSkills, setPendingSkills] = useAtom(pendingChatSkillAtom);
  const [pendingDomains, setPendingDomains] = useAtom(pendingChatDomainAtom);
  const [prefillMessage, setPrefillMessage] = useState<string | null>(null);
  const [activeSkills, setActiveSkills] = useState<SkillContext[]>([]);
  const [chatDomain, setChatDomain] = useState<SkillDomain | undefined>(
    () => pendingDomains.get(chatId),
  );
  const handleSkillClick = useCallback((skill: SkillWithPlacements) => {
    const ctx: SkillContext = {
      skillId: skill.id,
      label: skill.label,
      promptTemplate: skill.promptTemplate,
    };
    setActiveSkills((prev) =>
      prev.some((s) => s.skillId === skill.id) ? prev : [...prev, ctx],
    );
  }, []);

  const autoSentRef = useRef(false);
  useEffect(() => {
    const prompt = pendingPrompts.get(chatId);
    if (prompt && !autoSentRef.current) {
      autoSentRef.current = true;
      const shouldAutoSend = pendingAutoSend.get(chatId) ?? true;
      const skill = pendingSkills.get(chatId) ?? null;

      if (shouldAutoSend) {
        sendMessage({ text: prompt }, { body: { fileId, resource } });
      } else if (skill) {
        // Non-autoSend skill: show the two-part compose UX
        setActiveSkills([skill]);
      } else {
        setPrefillMessage(prompt);
      }

      setPendingPrompts((prev: Map<string, string>) => {
        const next = new Map(prev);
        next.delete(chatId);
        return next;
      });
      setPendingAutoSend((prev: Map<string, boolean>) => {
        const next = new Map(prev);
        next.delete(chatId);
        return next;
      });
      setPendingSkills((prev: Map<string, SkillContext>) => {
        const next = new Map(prev);
        next.delete(chatId);
        return next;
      });
      setPendingDomains((prev: Map<string, SkillDomain>) => {
        const next = new Map(prev);
        next.delete(chatId);
        return next;
      });
    }
  }, [chatId, fileId, resource, pendingPrompts, pendingAutoSend, pendingSkills, pendingDomains, sendMessage, setPendingPrompts, setPendingAutoSend, setPendingSkills, setPendingDomains]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isStreaming]);

  const handleSend = useCallback(
    async (msg: string, files: File[], opts: ChatSendOptions) => {
      let uploadedFiles: UploadedFileInfo[] | undefined;

      if (files.length > 0) {
        setUploading(true);
        try {
          uploadedFiles = await Promise.all(
            files.map(async (f) => {
              const blob = await uploadDocumentClient(f);
              return {
                name: f.name,
                url: blob.url,
                filetype: EXT_MAP[f.type] ?? f.name.split(".").pop() ?? "pdf",
                size: f.size,
              };
            }),
          );
        } finally {
          setUploading(false);
        }
      }

      sendMessage(
        { text: msg },
        { body: { chatId, fileId, model: opts.model, uploadedFiles, resource } },
      );
    },
    [chatId, fileId, resource, sendMessage],
  );

  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <ResourceLinkProvider fileId={fileId}>
      <div className="flex h-full flex-col">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sapphire-10">
                <span className="text-lg">{readOnly ? "🤖" : "💬"}</span>
              </div>
              <p className="text-sm font-medium text-onyx-60">
                {readOnly ? "No messages yet" : "Start a conversation"}
              </p>
              {!readOnly && (
                <p className="max-w-[240px] text-xs text-onyx-40">
                  Ask questions about this file, drop a document, or get help with
                  action items.
                </p>
              )}
            </div>
          ) : (
            <div className="mx-auto max-w-2xl px-4 py-6">
              <div className="flex flex-col gap-4">
                {messages.map((m) => (
                  <MessageRow key={m.id} message={m} />
                ))}
                {isStreaming && isLastAssistantEmpty(messages) && (
                  <TypingIndicator />
                )}
              </div>
            </div>
          )}
        </div>
        {readOnly ? (
          <div className="shrink-0 border-t border-onyx-20 bg-onyx-5 px-4 py-3">
            <p className="text-center text-xs text-onyx-40">
              This is an automated skill run — read only
            </p>
          </div>
        ) : (
          <div className="shrink-0 border-t border-onyx-20 bg-onyx-10 p-3">
                <ChatInput
                  onSend={handleSend}
                  onStop={stop}
                  isStreaming={isStreaming || uploading}
                  initialMessage={prefillMessage}
                  activeSkills={activeSkills}
                  onDismissSkill={(id) => setActiveSkills((prev) => prev.filter((s) => s.skillId !== id))}
                  onSlashSkillSelect={handleSkillClick}
                  chatDomain={chatDomain}
                  placeholder="Ask anything or drop a document..."
                  className="shadow-none border-onyx-15"
                />
          </div>
        )}
      </div>
    </ResourceLinkProvider>
  );
}

/* ---------- message rendering ---------- */

function MessageRow({ message }: { message: UIMessage }) {
  if (message.role === "user") {
    return <ChatBubble message={uiMessageToBubble(message)} />;
  }

  // Assistant: render parts in chronological order (tool calls inline with text)
  return <AssistantMessageParts parts={message.parts} />;
}

function uiMessageToBubble(m: UIMessage) {
  const text = m.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");

  return {
    id: m.id,
    role: m.role as "user" | "assistant",
    content: text,
    timestamp: new Date(),
  };
}

function isLastAssistantEmpty(msgs: UIMessage[]) {
  const last = msgs.at(-1);
  if (!last || last.role !== "assistant") return false;
  const hasContent = last.parts.some(
    (p) =>
      (p.type === "text" && (p as { text: string }).text.trim()) ||
      isToolPart(p),
  );
  return !hasContent;
}
