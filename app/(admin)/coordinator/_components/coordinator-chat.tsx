"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { ChatInput, type ChatSendOptions } from "@/components/composite/chat-input";
import { ChatBubble, TypingIndicator } from "@/components/composite/chat-bubble";
import { AssistantMessageParts } from "@/components/composite/assistant-message-parts";
import { isToolPart } from "@/lib/chat/ui-helpers";
import { ResourceLinkProvider } from "@/lib/chat/resource-link-context";
import { uploadDocumentClient } from "@/lib/documents/client-upload";
import type { PersistedChatMessage } from "@/lib/chat/threads";
import { useChatThread } from "@/lib/chat/queries";
import { SkillsGrid } from "@/components/composite/skills-grid";
import type { SkillWithPlacements } from "@/lib/skills/list-skills";
import type { SkillContext } from "@/lib/skills/domains";

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

export function CoordinatorChat({
  chatId,
  isNew,
  initialMessages,
}: {
  chatId: string;
  isNew?: boolean;
  initialMessages?: PersistedChatMessage[];
}) {
  // When the server already provided messages, skip the client-side fetch.
  // useChatThread still runs for client-side navigations (no initialMessages).
  const skipQuery = isNew || !!initialMessages;
  const { data: savedChat, isLoading } = useChatThread(skipQuery ? null : chatId);

  if (isLoading && !skipQuery) {
    return (
      <div className="flex h-full items-center justify-center bg-onyx-5">
        <div className="rounded-xl border border-onyx-20 bg-white px-4 py-2 text-sm text-onyx-60">
          Loading chat...
        </div>
      </div>
    );
  }

  return (
    <CoordinatorChatSession
      key={chatId}
      chatId={chatId}
      isNew={isNew}
      initialMessages={
        initialMessages ?? ((savedChat?.messages as PersistedChatMessage[] | undefined) ?? [])
      }
    />
  );
}

function CoordinatorChatSession({
  chatId,
  isNew,
  initialMessages,
}: {
  chatId: string;
  isNew?: boolean;
  initialMessages: PersistedChatMessage[];
}) {
  const [activeSkills, setActiveSkills] = useState<SkillContext[]>([]);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const titleRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Files awaiting association with the next user message
  const pendingAttachRef = useRef<UploadedFileInfo[] | null>(null);
  const [attachmentMap, setAttachmentMap] = useState<Map<string, UploadedFileInfo[]>>(new Map);

  useEffect(() => {
    return () => {
      if (titleRefreshTimeoutRef.current) {
        clearTimeout(titleRefreshTimeoutRef.current);
      }
    };
  }, []);

  const { messages, sendMessage, status, stop } = useChat({
    id: `coordinator-${chatId}`,
    messages: initialMessages,
    transport,
    onFinish: () => {
      if (isNew) {
        // First message on a draft chat: navigate to the chat-specific URL
        // so the sidebar appears. Using push (not refresh) avoids triggering
        // the redirect() in the /coordinator server component which would
        // tear down the React tree during a refresh cycle.
        router.push(`/coordinator/${chatId}`);
      } else {
        router.refresh();
      }

      if (titleRefreshTimeoutRef.current) {
        clearTimeout(titleRefreshTimeoutRef.current);
      }

      titleRefreshTimeoutRef.current = setTimeout(() => {
        router.refresh();
      }, 1200);
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isStreaming]);

  function handleSkillClick(skill: SkillWithPlacements) {
    const ctx: SkillContext = {
      skillId: skill.id,
      label: skill.label,
      promptTemplate: skill.promptTemplate,
    };
    setActiveSkills((prev) =>
      prev.some((s) => s.skillId === skill.id) ? prev : [...prev, ctx],
    );
  }

  const handleSend = useCallback(
    async (msg: string, files: File[], opts: ChatSendOptions) => {
      setActiveSkills([]);

      let uploadedFiles: UploadedFileInfo[] | undefined;

      if (files.length > 0) {
        setUploading(true);
        try {
          uploadedFiles = await Promise.all(
            files.map(async (file) => {
              const blob = await uploadDocumentClient(file);
              return {
                name: file.name,
                url: blob.url,
                filetype: EXT_MAP[file.type] ?? file.name.split(".").pop() ?? "pdf",
                size: file.size,
              };
            }),
          );
        } finally {
          setUploading(false);
        }
      }

      if (uploadedFiles?.length) {
        pendingAttachRef.current = uploadedFiles;
      }

      sendMessage(
        { text: msg },
        { body: { chatId, model: opts.model, uploadedFiles } },
      );
    },
    [chatId, sendMessage],
  );

  // Associate pending file attachments with the newest user message once
  // it appears in the messages array after sendMessage triggers a re-render.
  useEffect(() => {
    const pending = pendingAttachRef.current;
    if (!pending) return;
    const lastUser = messages.findLast((m) => m.role === "user");
    if (!lastUser || attachmentMap.has(lastUser.id)) return;
    pendingAttachRef.current = null;
    setAttachmentMap((prev) => new Map(prev).set(lastUser.id, pending));
  }, [messages, attachmentMap]);

  const input = (
    <ChatInput
      onSend={handleSend}
      onStop={stop}
      isStreaming={isStreaming || uploading}
      activeSkills={activeSkills}
      onDismissSkill={(id) => setActiveSkills((prev) => prev.filter((s) => s.skillId !== id))}
      onSlashSkillSelect={handleSkillClick}
      chatDomain="coordinator"
      placeholder="Ask anything or drop a document..."
      className="shadow-none border-onyx-15"
    />
  );

  if (!hasMessages && !isStreaming) {
    return (
      <ResourceLinkProvider fileId={null}>
        <div className="flex h-full flex-col items-center justify-center px-4">
          <div className="w-full max-w-2xl space-y-8">
            <div className="space-y-2 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/empora-logo.svg" alt="Empora" className="mx-auto h-8" />
              <h1 className="font-display text-xl font-semibold text-onyx-90">
                Coordinator
              </h1>
              <p className="text-sm text-onyx-50">
                Ask anything about your portfolio, look up files, or drop a
                document to get started.
              </p>
            </div>
            <SkillsGrid domain="coordinator" onSkillClick={handleSkillClick} />
            <div className="pb-8">{input}</div>
          </div>
        </div>
      </ResourceLinkProvider>
    );
  }

  return (
    <ResourceLinkProvider fileId={null}>
      <div className="flex h-full flex-col">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          <div className="mx-auto max-w-2xl px-4 py-6">
            <div className="flex flex-col gap-4">
              {messages.map((m) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  attachments={attachmentMap.get(m.id)}
                />
              ))}
              {isStreaming && isLastAssistantEmpty(messages) && (
                <TypingIndicator />
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-onyx-15 bg-onyx-5 px-4 py-3">
          <div className="mx-auto max-w-2xl">{input}</div>
        </div>
      </div>
    </ResourceLinkProvider>
  );
}

/* ---------- message rendering ---------- */

function MessageRow({
  message,
  attachments,
}: {
  message: UIMessage;
  attachments?: UploadedFileInfo[];
}) {
  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {attachments.map((f) => (
              <div
                key={f.url}
                className="inline-flex items-center gap-1.5 rounded-lg bg-onyx-10 px-2.5 py-1 text-xs"
              >
                <FileText className="h-3 w-3 text-onyx-40" />
                <span className="max-w-[180px] truncate font-medium text-onyx-70">
                  {f.name}
                </span>
              </div>
            ))}
          </div>
        )}
        <ChatBubble message={uiMessageToBubble(message)} />
      </div>
    );
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
