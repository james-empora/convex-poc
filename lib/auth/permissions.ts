import {
  ExternalPermission as ConvexExternalPermission,
  InternalPermission as ConvexInternalPermission,
  UserType as ConvexUserType,
  hasAnyPermission,
  hasPermission,
  isAdmin,
  isInternal,
  type Permission,
} from "@/convex/lib/permissions";

export const InternalPermission = ConvexInternalPermission;
export const ExternalPermission = ConvexExternalPermission;
export const UserType = ConvexUserType;

export type AppUser = {
  id: string;
  auth0Sub: string;
  email: string;
  displayName: string | null;
  userType: "internal" | "external";
  entityType: "individual" | "organization" | "brokerage" | "lender" | null;
  entityId: string | null;
  permissions: Permission[];
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toAppUser(user: {
  _id: string;
  legacyId?: string;
  auth0Sub: string;
  email: string;
  displayName?: string;
  userType: "internal" | "external";
  entity?: { type: "individual" | "organization" | "brokerage" | "lender"; id: string };
  permissions: string[];
  active: boolean;
  lastLoginAt?: number;
  createdAt: number;
  updatedAt: number;
}): AppUser {
  return {
    id: user.legacyId ?? user._id,
    auth0Sub: user.auth0Sub,
    email: user.email,
    displayName: user.displayName ?? null,
    userType: user.userType,
    entityType: user.entity?.type ?? null,
    entityId: user.entity?.id ?? null,
    permissions: user.permissions as Permission[],
    active: user.active,
    lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  };
}

export {
  hasAnyPermission,
  hasPermission,
  isAdmin,
  isInternal,
  type Permission,
};
