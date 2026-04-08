"use client";

import { usePathname } from "next/navigation";
import { TabBar } from "./tab-bar";
import { OverviewContent } from "./tabs/overview-content";
import { FinancesContent } from "./tabs/finances-content";
import { ChatContent } from "./tabs/chat-content";
import { DocContent } from "./tabs/doc-content";
import type { FileDetail } from "@/lib/files/get-file";
import type { DocumentDetail } from "@/lib/documents/get-document";
import type { FileDocumentSummary } from "@/lib/documents/list-file-documents";
import type { FileChatSummary, PersistedChatMessage } from "@/lib/chat/threads";

/* ---------- helpers ---------- */

interface ParsedTab {
  type: "overview" | "finances" | "chat" | "doc";
  id?: string;
}

function parseTabFromPathname(pathname: string): ParsedTab {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 3) {
    const tabSegment = segments[2];
    if (tabSegment === "finances") return { type: "finances" };
    if (tabSegment === "chat" && segments[3]) return { type: "chat", id: segments[3] };
    if (tabSegment === "doc" && segments[3]) return { type: "doc", id: segments[3] };
  }
  return { type: "overview" };
}

/* ---------- component ---------- */

export function FileContentWell({
  fileId,
  file,
  documents,
  chats,
  initialMessages,
  initialDocument,
}: {
  fileId: string;
  file?: FileDetail | null;
  documents?: FileDocumentSummary[];
  chats?: FileChatSummary[];
  initialMessages?: PersistedChatMessage[];
  initialDocument?: DocumentDetail | null;
}) {
  const pathname = usePathname();
  const tab = parseTabFromPathname(pathname);

  return (
    <div className="flex h-full flex-col">
      <TabBar fileId={fileId} chats={chats} />
      <div className="min-h-0 flex-1 overflow-hidden">
        {tab.type === "overview" && <OverviewContent fileId={fileId} file={file} />}
        {tab.type === "finances" && <FinancesContent fileId={fileId} />}
        {tab.type === "chat" && tab.id && (
          <ChatContent
            fileId={fileId}
            chatId={tab.id}
            initialMessages={initialMessages}
            threadType={chats?.find((c) => c.id === tab.id)?.threadType}
          />
        )}
        {tab.type === "doc" && tab.id && (
          <DocContent fileId={fileId} docId={tab.id} initialDocument={initialDocument} />
        )}
      </div>
    </div>
  );
}
