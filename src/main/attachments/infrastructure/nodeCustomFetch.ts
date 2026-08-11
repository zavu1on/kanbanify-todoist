import type { CustomFetch } from "@doist/todoist-sdk";

/**
 * Without this, `TodoistApi` picks its own `fetch` from a dynamically
 * `import('undici')`'d dispatcher (see `@doist/todoist-sdk`'s
 * `getDefaultTransport`) — a *different* module instance than Node/Electron's
 * built-in global `fetch`/`FormData`/`Blob`. Every other call in this app
 * sends a plain JSON string body, so the mismatch is invisible. File uploads
 * don't: the SDK builds the multipart body with the *global* `FormData` (see
 * `multipart-upload.js`'s `file instanceof Blob` branch) and hands it to that
 * *other* `fetch`, which doesn't recognize the global `FormData` as its own
 * and silently stringifies it to `"[object FormData]"` — Todoist then
 * rejects the (empty) upload with "File name not found". Passing this
 * `customFetch` makes `TodoistApi` use the global `fetch` throughout, so the
 * `FormData` it builds and the `fetch` that sends it are always the same
 * realm.
 */
export const nodeCustomFetch: CustomFetch = async (url, options) => {
  const { url: finalUrl, options: finalOptions } = withDeleteBodyAsQuery(
    url,
    options,
  );
  const response = await fetch(finalUrl, finalOptions as RequestInit);
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    text: () => response.text(),
    json: () => response.json(),
    arrayBuffer: () => response.arrayBuffer(),
  };
};

/**
 * `TodoistApi.deleteUpload` sends `file_url` as a JSON body on a `DELETE`
 * request — the SDK's shared `request()` helper treats every non-`GET`
 * method the same way (body, snake_cased). But Todoist's own OpenAPI spec
 * declares `file_url` as a *query* parameter for `DELETE /api/v1/uploads`,
 * and the server only reads it from there; the body is ignored. The result
 * is a 404 `"File not found"` (`error_code: 26`) for a file that does exist —
 * the delete request just never told the server which one. Moving a DELETE
 * request's JSON body onto the query string here is what actually reaches
 * the endpoint Todoist implemented.
 */
function withDeleteBodyAsQuery(
  url: string,
  options?: Parameters<CustomFetch>[1],
): { url: string; options?: Parameters<CustomFetch>[1] } {
  if (options?.method !== "DELETE" || typeof options.body !== "string") {
    return { url, options };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(options.body);
  } catch {
    return { url, options };
  }
  if (typeof payload !== "object" || payload === null) {
    return { url, options };
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null) query.set(key, String(value));
  }

  const separator = url.includes("?") ? "&" : "?";
  const { body: _body, ...rest } = options;
  return { url: `${url}${separator}${query.toString()}`, options: rest };
}
