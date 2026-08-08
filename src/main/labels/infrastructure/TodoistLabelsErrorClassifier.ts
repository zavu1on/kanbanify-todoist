import { TodoistRequestError } from "@doist/todoist-sdk";
import { LabelsErrorMapper } from "../domain/errors/LabelsErrorMapper";

/** Classifies Todoist SDK failures — the only place that reads `TodoistRequestError` —
 * and hands the classified kind to the domain `LabelsErrorMapper` to build the
 * concrete `LabelsError`, so the gateway stays focused on the API call itself. */
export class TodoistLabelsErrorClassifier {
  private readonly errorMapper = new LabelsErrorMapper();

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
