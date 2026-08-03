import type { AuthenticatedUser } from "../../domain/entities/AuthenticatedUser";

export type SessionCheckOutput =
  | { status: "authenticated"; user: AuthenticatedUser }
  | { status: "no_token" };
