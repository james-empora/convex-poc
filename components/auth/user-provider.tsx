'use client';

import { useHydrateAtoms } from 'jotai/utils';
import { userNameAtom, userPermissionsAtom, userTypeAtom, userEntityTypeAtom, userEntityIdAtom } from '@/lib/auth/atoms';

interface UserHydrationProps {
  userName: string | null;
  userPermissions: string[];
  userType: string | null;
  userEntityType: string | null;
  userEntityId: string | null;
  children: React.ReactNode;
}

/**
 * Hydrates user atoms from server-fetched data.
 * Uses Jotai's useHydrateAtoms so atoms are set before children render.
 */
export function UserProvider({
  userName,
  userPermissions,
  userType,
  userEntityType,
  userEntityId,
  children,
}: UserHydrationProps) {
  useHydrateAtoms([
    [userNameAtom, userName],
    [userPermissionsAtom, userPermissions],
    [userTypeAtom, userType],
    [userEntityTypeAtom, userEntityType],
    [userEntityIdAtom, userEntityId],
  ]);

  return children;
}
