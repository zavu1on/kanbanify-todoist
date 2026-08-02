import type { AuthenticatedUser } from "../../domain/entities/AuthenticatedUser";

export interface LoginOutput {
  user: AuthenticatedUser;
  tokenStorageWarning?: string;
}
