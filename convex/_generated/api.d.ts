/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as attendanceLogs from "../attendanceLogs.js";
import type * as auditLogs from "../auditLogs.js";
import type * as auth from "../auth.js";
import type * as branches from "../branches.js";
import type * as clearAll from "../clearAll.js";
import type * as clearUsers from "../clearUsers.js";
import type * as crons from "../crons.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as importData from "../importData.js";
import type * as sendEmail from "../sendEmail.js";
import type * as storage from "../storage.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  attendanceLogs: typeof attendanceLogs;
  auditLogs: typeof auditLogs;
  auth: typeof auth;
  branches: typeof branches;
  clearAll: typeof clearAll;
  clearUsers: typeof clearUsers;
  crons: typeof crons;
  events: typeof events;
  http: typeof http;
  importData: typeof importData;
  sendEmail: typeof sendEmail;
  storage: typeof storage;
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
