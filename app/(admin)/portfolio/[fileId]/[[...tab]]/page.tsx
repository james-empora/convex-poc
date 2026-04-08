import { FileContentWell } from "../../_components/file-content-well";
import { FileIdSync } from "../../_components/file-id-sync";
import { createAuthenticatedConvexHttpClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";
import type { PersistedChatMessage } from "@/lib/chat/threads";

function parseTabFromSegments(tab?: string[]): { type: string; id?: string } {
  if (!tab || tab.length === 0) return { type: "overview" };
  if (tab[0] === "finances") return { type: "finances" };
  if (tab[0] === "chat" && tab[1]) return { type: "chat", id: tab[1] };
  if (tab[0] === "doc" && tab[1]) return { type: "doc", id: tab[1] };
  return { type: "overview" };
}

export default async function FileTabPage({
  params,
}: {
  params: Promise<{ fileId: string; tab?: string[] }>;
}) {
  const { fileId, tab: tabSegments } = await params;
  const parsedTab = parseTabFromSegments(tabSegments);
  const convex = await createAuthenticatedConvexHttpClient();

  // Always fetch file detail, documents, and chats in parallel.
  // Conditionally fetch active tab data (chat messages or document metadata).
  const chatFetch = parsedTab.type === "chat" && parsedTab.id
    ? convex.query(api.chat.getChat, { chatId: parsedTab.id })
    : null;
  const docFetch = parsedTab.type === "doc" && parsedTab.id
    ? convex.query(api.documents.getDocument, { documentId: parsedTab.id }).catch(() => null)
    : null;

  const [fileResult, docsResult, chatsResult, chatResult, docResult] = await Promise.all([
    convex.query(api.files.getFile, { fileId }).catch(() => null),
    convex.query(api.documents.listFileDocuments, { fileId }),
    convex.query(api.chat.listFileChats, { fileId, includeSystem: true }),
    chatFetch,
    docFetch,
  ]);

  const file = fileResult;
  const documents = docsResult;
  const chats = chatsResult;

  const initialMessages = chatResult
    ? (chatResult?.messages as PersistedChatMessage[] ?? [])
    : undefined;

  const initialDocument = docResult ?? undefined;

  return (
    <>
      <FileIdSync fileId={fileId} tabType={parsedTab.type} tabId={parsedTab.id} />
      <FileContentWell
        fileId={fileId}
        file={file}
        documents={documents}
        chats={chats}
        initialMessages={initialMessages}
        initialDocument={initialDocument}
      />
    </>
  );
}
