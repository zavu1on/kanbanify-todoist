import { TodoistRequestError } from "@doist/todoist-sdk";
import { CommentsErrorMapper } from "../domain/errors/CommentsErrorMapper";

/** Classifies Todoist SDK failures — the only place that reads `TodoistRequestError` —
 * and hands the classified kind to the domain `CommentsErrorMapper` to build the
 * concrete `CommentsError`, so the gateway stays focused on the API call itself. */
export class TodoistCommentsErrorClassifier {
  private readonly errorMapper = new CommentsErrorMapper();

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
