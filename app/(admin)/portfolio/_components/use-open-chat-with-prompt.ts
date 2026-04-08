"use client";

import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import {
  activeFileIdAtom,
  chatTabCounterAtom,
  dynamicFileTabsAtom,
  pendingChatPromptAtom,
  pendingChatResourceAtom,
  pendingChatAutoSendAtom,
  pendingChatSkillAtom,
  pendingChatDomainAtom,
} from "@/app/(admin)/portfolio/_lib/atoms";
import type { ChatResource } from "@/lib/chat/types";
import type { SkillContext, SkillDomain } from "@/lib/skills/domains";

/**
 * Returns a function that opens a new chat tab and auto-submits the given prompt.
 * Requires a file to be selected (`activeFileIdAtom`).
 */
export function useOpenChatWithPrompt() {
  const router = useRouter();
  const activeFileId = useAtomValue(activeFileIdAtom);
  const setDynamicTabs = useSetAtom(dynamicFileTabsAtom);
  const setChatCounter = useSetAtom(chatTabCounterAtom);
  const setPendingPrompt = useSetAtom(pendingChatPromptAtom);
  const setPendingResource = useSetAtom(pendingChatResourceAtom);
  const setPendingAutoSend = useSetAtom(pendingChatAutoSendAtom);
  const setPendingSkill = useSetAtom(pendingChatSkillAtom);
  const setPendingDomain = useSetAtom(pendingChatDomainAtom);

  const openChat = useCallback(
    (prompt: string, resource?: ChatResource, opts?: { autoSend?: boolean; skill?: SkillContext; domain?: SkillDomain }) => {
      if (!activeFileId) return;

      const chatId = `${Date.now()}`;
      const tabId = `chat-${chatId}`;

      // Increment counter for the tab label
      setChatCounter((prev) => prev + 1);

      setDynamicTabs((prev) => [
        ...prev,
        { id: tabId, label: opts?.skill?.label ?? (prompt.slice(0, 30) || "Chat"), closable: true },
      ]);

      // Store the prompt so ChatContent can auto-submit on mount
      setPendingPrompt((prev) => {
        const next = new Map(prev);
        next.set(chatId, prompt);
        return next;
      });

      // Store whether to auto-send or pre-fill only
      const autoSend = opts?.autoSend ?? true;
      setPendingAutoSend((prev) => {
        const next = new Map(prev);
        next.set(chatId, autoSend);
        return next;
      });

      // Store skill context for the two-part compose UX (non-autoSend only)
      if (opts?.skill) {
        setPendingSkill((prev) => {
          const next = new Map(prev);
          next.set(chatId, opts.skill!);
          return next;
        });
      }

      // Store domain scope for the in-chat skill picker
      if (opts?.domain) {
        setPendingDomain((prev) => {
          const next = new Map(prev);
          next.set(chatId, opts.domain!);
          return next;
        });
      }

      // Store the resource context so ChatSession includes it in every message
      if (resource) {
        setPendingResource((prev) => {
          const next = new Map(prev);
          next.set(chatId, resource);
          return next;
        });
      }

      router.push(`/portfolio/${activeFileId}/chat/${chatId}`);
    },
    [activeFileId, setDynamicTabs, setChatCounter, setPendingPrompt, setPendingAutoSend, setPendingSkill, setPendingDomain, setPendingResource, router],
  );

  return openChat;
}
