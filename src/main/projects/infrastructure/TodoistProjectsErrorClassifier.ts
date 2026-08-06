import { TodoistRequestError } from "@doist/todoist-sdk";
import {
  ProjectsErrorMapper,
  type ProjectsErrorKind,
} from "../domain/errors/ProjectsErrorMapper";

/** Classifies Todoist SDK failures — the only place that reads `TodoistRequestError` —
 * and hands the classified kind to the domain `ProjectsErrorMapper` to build the
 * concrete `ProjectsError`, so gateways stay focused on the API call itself. */
export class TodoistProjectsErrorClassifier {
  private readonly errorMapper = new ProjectsErrorMapper();

  async wrap<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof TodoistRequestError) {
        throw this.errorMapper.toDomainError(this.classify(error));
      }

      throw this.errorMapper.toDomainError(
        "unknown",
        error instanceof Error ? error.message : undefined,
      );
    }
  }

  private classify(error: TodoistRequestError): ProjectsErrorKind {
    if (error.httpStatusCode === 404) return "not_found";
    if (error.isAuthenticationError()) return "auth";
    return "network";
  }
}
