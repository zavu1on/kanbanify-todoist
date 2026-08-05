import { TodoistRequestError } from "@doist/todoist-sdk";
import { TasksErrorMapper } from "../domain/errors/TasksErrorMapper";

/** Classifies Todoist SDK failures — the only place that reads `TodoistRequestError` —
 * and hands the classified kind to the domain `TasksErrorMapper` to build the
 * concrete `TasksError`, so gateways stay focused on the API call itself. */
export class TodoistTasksErrorClassifier {
  private readonly errorMapper = new TasksErrorMapper();

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
