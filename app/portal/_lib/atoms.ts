import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

/** The currently active file in the portal (set on navigation) */
export const activePortalFileIdAtom = atom<string | null>(null);

/** Whether the user has completed onboarding (persisted to localStorage) */
export const portalOnboardedAtom = atomWithStorage("portal-onboarded", false);

/** DOM element for rendering the chat input bar via createPortal */
export const chatBarPortalAtom = atom<HTMLElement | null>(null);

/** Onboarding profile data (persisted to localStorage until we wire up DB) */
export const portalProfileAtom = atomWithStorage("portal-profile", {
  displayName: "",
  phone: "",
  communicationPref: "important" as "important" | "all" | "digest",
});
