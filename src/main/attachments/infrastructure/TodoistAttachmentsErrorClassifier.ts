import { TodoistRequestError } from "@doist/todoist-sdk";
import { AttachmentsErrorMapper } from "../domain/errors/AttachmentsErrorMapper";

/** Classifies Todoist SDK failures — the only place that reads `TodoistRequestError` —
 * and hands the classified kind to the domain `AttachmentsErrorMapper` to build the
 * concrete `AttachmentsError`, so the gateway stays focused on the API call itself. */
export class TodoistAttachmentsErrorClassifier {
  private readonly errorMapper = new AttachmentsErrorMapper();

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
        this.describeError(error),
      );
    }
  }

  /** Unlike `TodoistCommentsErrorClassifier` (which folds the same detail in
   * for symmetry but rarely needs it), uploads/downloads go through native
   * plumbing (`nodeCustomFetch`, `FormData` vs. `form-data` streams, redirect
   * handling in `viewAttachment`) with more ways to fail non-obviously — a
   * bare domain error with its default message isn't enough to tell "file
   * too large", "unsupported type", or a redirect/auth quirk apart. Folding
   * in Todoist's actual response is what makes that diagnosable. */
  private describeTodoistRequestError(error: TodoistRequestError): string {
    const data = error.responseData;
    if (data === undefined) return error.message;
    const detail = typeof data === "string" ? data : JSON.stringify(data);
    return `${error.message} — ${detail}`;
  }

  /** `uploadFile`/`deleteUpload`/`viewAttachment` go through `UploadClient`,
   * which — unlike the rest of the SDK — doesn't route through the shared
   * `request()` helper, so their failures never become `TodoistRequestError`:
   * they're a plain `Error` with `.status`/`.data` attached by
   * `fetchWithRetry` (see `@doist/todoist-sdk`'s `fetch-with-retry.ts`).
   * Folding the response body into the message is what turns a dead-end
   * "HTTP 400: Bad Request" into Todoist's actual rejection reason. */
  private describeError(error: unknown): string | undefined {
    if (!(error instanceof Error)) return undefined;
    const data = (error as { data?: unknown }).data;
    if (data === undefined) return error.message;
    const detail = typeof data === "string" ? data : JSON.stringify(data);
    return `${error.message} — ${detail}`;
  }
}
