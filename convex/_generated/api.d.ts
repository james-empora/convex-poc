/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actionItems from "../actionItems.js";
import type * as audit from "../audit.js";
import type * as chat from "../chat.js";
import type * as dev from "../dev.js";
import type * as documents from "../documents.js";
import type * as entities from "../entities.js";
import type * as files from "../files.js";
import type * as finances from "../finances.js";
import type * as findings from "../findings.js";
import type * as legacyImports from "../legacyImports.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as oauth from "../oauth.js";
import type * as skills from "../skills.js";
import type * as users from "../users.js";
import type * as workflows from "../workflows.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actionItems: typeof actionItems;
  audit: typeof audit;
  chat: typeof chat;
  dev: typeof dev;
  documents: typeof documents;
  entities: typeof entities;
  files: typeof files;
  finances: typeof finances;
  findings: typeof findings;
  legacyImports: typeof legacyImports;
  "lib/audit": typeof lib_audit;
  "lib/permissions": typeof lib_permissions;
  oauth: typeof oauth;
  skills: typeof skills;
  users: typeof users;
  workflows: typeof workflows;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
