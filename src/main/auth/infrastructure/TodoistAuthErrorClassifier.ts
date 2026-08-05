import { TodoistRequestError } from "@doist/todoist-sdk";
import { AuthErrorMapper } from "../domain/errors/AuthErrorMapper";

/** Classifies Todoist SDK failures — the only place that reads `TodoistRequestError` —
 * and hands the classified kind to the domain `AuthErrorMapper` to build the
 * concrete `AuthError`, so gateways stay focused on the API call itself. */
export class TodoistAuthErrorClassifier {
  private readonly errorMapper = new AuthErrorMapper();

  async wrap<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof TodoistRequestError) {
        throw this.errorMapper.toDomainError(
          error.isAuthenticationError() ? "auth" : "network",
        );
      }

      throw this.errorMapper.toDomainError(
        "unknown",
        error instanceof Error ? error.message : undefined,
      );
    }
  }
}
