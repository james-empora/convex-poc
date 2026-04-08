import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

const INTERNAL_DOMAIN = "@emporatitle.com";

export const InternalPermission = {
  EMPLOYEE: "employee",
  ADMIN: "admin",
} as const;

export const ExternalPermission = {
  PARTY: "party",
  SIGNER: "signer",
  VIEWER: "viewer",
  COORDINATOR: "coordinator",
} as const;

export const UserType = {
  INTERNAL: "internal",
  EXTERNAL: "external",
} as const;

export type InternalPermission =
  (typeof InternalPermission)[keyof typeof InternalPermission];
export type ExternalPermission =
  (typeof ExternalPermission)[keyof typeof ExternalPermission];
export type Permission = InternalPermission | ExternalPermission;
export type AppUser = Doc<"users">;

export function inferUserType(email: string) {
  return email.toLowerCase().endsWith(INTERNAL_DOMAIN)
    ? UserType.INTERNAL
    : UserType.EXTERNAL;
}

export function defaultPermissionsForEmail(email: string): Permission[] {
  return inferUserType(email) === UserType.INTERNAL
    ? [InternalPermission.EMPLOYEE]
    : [ExternalPermission.PARTY];
}

export function hasPermission(user: AppUser, permission: Permission): boolean {
  return user.permissions.includes(permission);
}

export function hasAnyPermission(
  user: AppUser,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => user.permissions.includes(permission));
}

export function isInternal(user: AppUser): boolean {
  return user.userType === UserType.INTERNAL;
}

export function isAdmin(user: AppUser): boolean {
  return isInternal(user) && hasPermission(user, InternalPermission.ADMIN);
}

export async function canAccessFile(
  ctx: QueryCtx,
  user: AppUser,
  fileId: Id<"files">,
) {
  if (isInternal(user)) {
    return true;
  }

  if (!user.entity) {
    return false;
  }

  const party = await ctx.db
    .query("file_parties")
    .withIndex("by_entity", (q) =>
      q.eq("entity.type", user.entity!.type).eq("entity.id", user.entity!.id),
    )
    .filter((q) =>
      q.and(
        q.eq(q.field("fileId"), fileId),
        q.eq(q.field("active"), true),
      ),
    )
    .first();

  return !!party;
}
