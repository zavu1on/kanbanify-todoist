import type { AuthenticatedUser } from "../../domain/entities/AuthenticatedUser";

export interface ITodoistUserGateway {
  /** @throws {import("../../domain/errors/AuthError").AuthError} */
  fetchCurrentUser(accessToken: string): Promise<AuthenticatedUser>;
}
