"use client";

import { useRouter, useParams } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";
import { createChatId } from "@/lib/chat/threads";
import type { FileChatSummary } from "@/lib/chat/threads";
import { cn } from "@/lib/utils";

function formatLastMessageAt(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function CoordinatorRail({
  activeChatId,
  chats,
}: {
  activeChatId: string | null;
  chats: FileChatSummary[];
}) {
  const router = useRouter();

  function createNewChat() {
    router.push(`/coordinator/${createChatId()}`);
  }

  return (
    <div className="flex h-full flex-col border-r border-onyx-20 bg-white">
      <div className="flex h-9 shrink-0 items-center border-b border-onyx-20 bg-onyx-10 px-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-onyx-70">
          Coordinator
        </h2>
      </div>

      <div className="border-b border-onyx-20 p-3">
        <button
          type="button"
          onClick={createNewChat}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sapphire-60 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sapphire-70"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div className="flex flex-col gap-1.5">
          {chats.length > 0 ? (
            chats.map((chat) => {
              const active = chat.id === activeChatId;

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => router.push(`/coordinator/${chat.id}`)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-sapphire-30 bg-sapphire-10"
                      : "border-transparent bg-white hover:border-onyx-20 hover:bg-onyx-10",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-onyx-100">
                        {chat.title}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-onyx-50">
                        {chat.preview ?? "New chat"}
                      </div>
                    </div>
                    <div className="shrink-0 text-[11px] text-onyx-40">
                      {formatLastMessageAt(chat.lastMessageAt)}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-2 py-3 text-sm text-onyx-50">No saved chats yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CoordinatorShell({
  chats,
  children,
}: {
  chats: FileChatSummary[];
  children: React.ReactNode;
}) {
  const params = useParams<{ chatId?: string }>();
  const activeChatId = params.chatId ?? null;
  const hasChats = chats.length > 0;

  // No saved chats and no active chat — full-width draft view (no rail)
  if (!hasChats && !activeChatId) {
    return <div className="h-full bg-onyx-5">{children}</div>;
  }

  return (
    <div className="flex h-full bg-onyx-5">
      <div className="w-[280px] shrink-0">
        <CoordinatorRail activeChatId={activeChatId} chats={chats} />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
