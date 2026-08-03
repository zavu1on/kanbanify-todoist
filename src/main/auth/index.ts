/**
 * Public API of the `auth` module — the only surface other processes
 */
export type {
  AuthErrorType,
  LoginResult,
} from "./domain/contracts/LoginResult";
export type { LogoutResult } from "./domain/contracts/LogoutResult";
export type { SessionCheckResult } from "./domain/contracts/SessionCheckResult";
export { accessTokenSchema } from "./domain/value-objects/AccessToken";
