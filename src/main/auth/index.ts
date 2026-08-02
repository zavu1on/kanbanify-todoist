/**
 * Public API of the `auth` module — the only surface other processes
 */
export type {
  AuthErrorType,
  LoginResult,
} from "./domain/contracts/LoginResult";
export { accessTokenSchema } from "./domain/value-objects/AccessToken";
