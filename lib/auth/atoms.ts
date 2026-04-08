import { atom } from "jotai";

/** Display name of the authenticated user (from Auth0 profile or email) */
export const userNameAtom = atom<string | null>(null);

/** Flat permission array — e.g. ['employee', 'admin'] or ['party', 'signer'] */
export const userPermissionsAtom = atom<string[]>([]);

/** 'internal' or 'external' — determines permission set and data scoping */
export const userTypeAtom = atom<string | null>(null);

/** Entity type linked to this user (individual, organization, etc.) */
export const userEntityTypeAtom = atom<string | null>(null);

/** Entity ID linked to this user */
export const userEntityIdAtom = atom<string | null>(null);
