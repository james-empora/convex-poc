import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { TabDefinition } from "@/components/composite/tab-panel";
import type { FileDocument } from "@/types/title-file";
import type { ChatResource } from "@/lib/chat/types";
import type { SkillContext, SkillDomain } from "@/lib/skills/domains";

/** ID of the currently selected file — syncs left rail, center tab, and right rail */
export const activeFileIdAtom = atom<string | null>(null);

/** Fixed content tabs that always appear (non-closable) */
export const CONTENT_TABS: TabDefinition[] = [
  { id: "overview", label: "Overview", closable: false },
  { id: "finances", label: "Finances", closable: false },
];

const dynamicFileTabsByFileAtom = atomWithStorage<Record<string, TabDefinition[]>>(
  "portfolio:dynamicFileTabsByFile",
  {},
);

/** Additional dynamic tabs scoped to the current file (closable). */
export const dynamicFileTabsAtom = atom(
  (get) => {
    const fileId = get(activeFileIdAtom);
    if (!fileId) return [];
    return get(dynamicFileTabsByFileAtom)[fileId] ?? [];
  },
  (get, set, update: TabDefinition[] | ((prev: TabDefinition[]) => TabDefinition[])) => {
    const fileId = get(activeFileIdAtom);
    if (!fileId) return;

    const current = get(dynamicFileTabsByFileAtom);
    const prevTabs = current[fileId] ?? [];
    const nextTabs = typeof update === "function" ? update(prevTabs) : update;

    set(dynamicFileTabsByFileAtom, {
      ...current,
      [fileId]: nextTabs,
    });
  },
);

/** Current grouping mode for the portfolio list (persisted to localStorage) */
export const portfolioGroupByAtom = atomWithStorage<string>(
  "portfolio:portfolioGroupBy",
  "status",
);

/** Counter for generating unique chat tab names */
export const chatTabCounterAtom = atom(0);

/** Documents uploaded during this session, keyed by file ID */
export const recentUploadsAtom = atom<Map<string, FileDocument[]>>(new Map());

/** Pending auto-submit prompts for new chat tabs, keyed by chatId */
export const pendingChatPromptAtom = atom<Map<string, string>>(new Map());

/** Resource context for pending chat tabs, keyed by chatId */
export const pendingChatResourceAtom = atom<Map<string, ChatResource>>(new Map());

/** Whether to auto-send the pending prompt (true) or pre-fill only (false), keyed by chatId */
export const pendingChatAutoSendAtom = atom<Map<string, boolean>>(new Map());

/** Pending skill context for non-autoSend skills, keyed by chatId */
export const pendingChatSkillAtom = atom<Map<string, SkillContext>>(new Map());

/** Pending domain scope for skill picker in chat, keyed by chatId */
export const pendingChatDomainAtom = atom<Map<string, SkillDomain>>(new Map());
