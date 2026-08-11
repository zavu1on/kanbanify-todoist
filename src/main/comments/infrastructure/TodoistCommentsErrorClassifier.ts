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
        if (error.isAuthenticationError()) {
          throw this.errorMapper.toDomainError("auth");
        }
        // `httpStatusCode` is only set when Todoist actually answered (see
        // `getTodoistRequestError` in `@doist/todoist-sdk`'s http-client.ts) —
        // undefined means the request never reached them (DNS, timeout,
        // offline), which is the only case "network" (and its generic
        // "check your connection" message) is accurate for. A real non-2xx
        // response (400, 404, ...) is Todoist rejecting the request, not a
        // connectivity problem, so it's classified as "unknown" with the
        // response body folded in — otherwise the true reason is lost behind
        // a misleading "Could not connect to Todoist".
        if (error.httpStatusCode === undefined) {
          throw this.errorMapper.toDomainError("network");
        }
        throw this.errorMapper.toDomainError(
          "unknown",
          this.describeTodoistRequestError(error),
        );
      }

      throw this.errorMapper.toDomainError(
        "unknown",
        error instanceof Error ? error.message : undefined,
      );
    }
  }

  private describeTodoistRequestError(error: TodoistRequestError): string {
    const data = error.responseData;
    if (data === undefined) return error.message;
    const detail = typeof data === "string" ? data : JSON.stringify(data);
    return `${error.message} — ${detail}`;
  }
}
