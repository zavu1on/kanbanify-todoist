# Uploads (file attachments)

File attachments aren't a standalone entity — an upload produces `Attachment` metadata that only becomes visible on a task once referenced by a `Comment` (`addComment({ attachment })`). There's no dedicated "task attachments" endpoint; attachments live on comments.

## Uploading — `uploadFile(args: UploadFileArgs, requestId?): Promise<Attachment>`

```typescript
type UploadFileArgs = {
    file: Buffer | NodeJS.ReadableStream | string | Blob
    fileName?: string   // required for Buffer/Stream, inferred for path strings and File objects
    projectId?: string | null
}
```

POSTs `multipart/form-data` to the uploads endpoint. Node vs. browser input is auto-detected (`file instanceof Blob` → native `FormData`; otherwise Node's `form-data` package, dynamically imported). 30s request timeout.

```typescript
// From a file path
const upload = await api.uploadFile({ file: '/path/to/document.pdf', projectId })

// From a Buffer — fileName is mandatory here
const upload = await api.uploadFile({
    file: fs.readFileSync('/path/to/document.pdf'),
    fileName: 'document.pdf',
})

// Attach it to a task via a comment — this is the step that makes it visible
await api.addComment({
    content: 'See attached document',
    taskId,
    attachment: {
        fileUrl: upload.fileUrl,
        fileName: upload.fileName,
        fileType: upload.fileType,
        resourceType: upload.resourceType,
    },
})
```

`Attachment` fields: `resourceType`, `fileName?`, `fileSize?`, `fileType?`, `fileUrl?`, `fileDuration?`, `uploadState?` (`'pending' | 'completed'`), `image?`, `imageWidth?`, `imageHeight?`, `url?`, `title?`.

## Deleting — `deleteUpload(args: { fileUrl: string }, requestId?): Promise<boolean>`

Deletes the uploaded file itself. Deleting the file doesn't retract a comment already pointing at it — remove/edit the comment separately if needed.

## Downloading — `viewAttachment(commentOrUrl: Comment | string): Promise<FileResponse>`

```typescript
const comments = await api.getComments({ taskId })
const response = await api.viewAttachment(comments.results[0]) // reads comment.fileAttachment.fileUrl
// or directly:
const response = await api.viewAttachment('https://files.todoist.com/...')

const bytes = await response.arrayBuffer() // also: .text(), .json()
```

`FileResponse` mirrors `Response` (`ok`, `status`, `statusText`, `headers`, `text()`, `json()`, `arrayBuffer()`) but works uniformly whether the request went through native `fetch` or a `customFetch`.

**Auth allowlist — don't bypass this by hand-rolling a fetch instead of `viewAttachment`:**

- Only two kinds of host are accepted: `files.todoist.com` (first-party, gets the Bearer token) and the CDN hosts it redirects to (`todoist.b-cdn.net`, `d1ysz50cxb9zwl.cloudfront.net`, token-less). Any other host throws.
- `files.todoist.com` 302s to the CDN. Native `fetch` drops `Authorization` on that cross-origin hop per spec, so the token never reaches the CDN.
- If the client was built with a `customFetch` (Electron's net stack, older `node-fetch`, etc. — see the `TodoistApi` constructor's second argument in the root `SKILL.md`), the SDK follows the redirect chain itself (`redirect: 'manual'`, capped at 5 hops) and strips the auth header the moment the origin changes, since not every `customFetch` implementation honors the standard's stripping rule.

This project uses the default `fetch` (no `customFetch` configured — see `client init` in the root `SKILL.md`), so the manual-redirect path doesn't apply today; it only matters if that changes.

## Where this fits in the project

Not yet part of `docs/SPECIFICATION.md` — Kanbanify Todoist has Comments (`addComment`, `getComments`, ...) but no attachment UI. If a feature needs one, `uploadFile` + `addComment({ attachment })` + `viewAttachment` is the full round trip; no other endpoints are involved.
