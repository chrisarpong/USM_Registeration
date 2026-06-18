/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminAuth from "../adminAuth.js";
import type * as attendanceLogs from "../attendanceLogs.js";
import type * as auth from "../auth.js";
import type * as branches from "../branches.js";
import type * as clearAll from "../clearAll.js";
import type * as clearUsers from "../clearUsers.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as importData from "../importData.js";
import type * as sendEmail from "../sendEmail.js";
import type * as storage from "../storage.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminAuth: typeof adminAuth;
  attendanceLogs: typeof attendanceLogs;
  auth: typeof auth;
  branches: typeof branches;
  clearAll: typeof clearAll;
  clearUsers: typeof clearUsers;
  events: typeof events;
  http: typeof http;
  importData: typeof importData;
  sendEmail: typeof sendEmail;
  storage: typeof storage;
  users: typeof users;
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
