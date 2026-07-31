# Labels

Labels (`Label`: `id`, `name`, `order: number | null`, `color: string`, `isFavorite`) are the mechanism this project uses to implement kanban statuses, since Todoist's community-tier API doesn't expose a native status field (see the root `CLAUDE.md`: "reserved Todoist tag"). In practice: the reserved label names (`todo`, `in-progress`, `completed` — the exact values are pinned elsewhere, in an ADR or in code, not part of the SDK) are read/written through `Task.labels: string[]` and `updateTask({ labels })`, not through a per-task labels endpoint.

Label entities themselves (creation/renaming/color) are managed by this domain.

## Reading

### `getLabel(id: string): Promise<Label>`

### `getLabels(args?: GetLabelsArgs): Promise<GetLabelsResponse>`
```typescript
type GetLabelsArgs = { cursor?: string | null; limit?: number }
type GetLabelsResponse = { results: Label[]; nextCursor: string | null }
```
No name filter — if you need a specific reserved label, either search the result by `name` or use `searchLabels`.

### `searchLabels(args: { query: string; cursor?; limit? }): Promise<GetLabelsResponse>`

### `getSharedLabels` / `renameSharedLabel` / `removeSharedLabel`
"Shared labels" are labels-as-strings that show up on other people's tasks without a formal entity (relevant for collaboration/workspaces). Likely not needed for a personal-use case.

## Creating and updating

### `addLabel(args: AddLabelArgs, requestId?): Promise<Label>`
```typescript
type AddLabelArgs = { name: string; order?: number | null; color?: ColorKey; isFavorite?: boolean }
```

### `updateLabel(id: string, args: UpdateLabelArgs, requestId?): Promise<Label>`
Same fields, all optional.

### `deleteLabel(id: string, requestId?): Promise<boolean>`
Careful: deletes the label entity globally (from every task it was on) — if it's a reserved kanban label, deleting it breaks kanban status on every task at once.

## `ColorKey` — available colors

Same set is used for both labels and projects (`color?: ColorKey`). Keys (pass as-is, snake_case strings):

```
berry_red, red, orange, yellow, olive_green, lime_green, green, mint_green,
teal, sky_blue, light_blue, blue, grape, violet, lavender, magenta,
salmon, charcoal, grey, taupe
```

Full list with hex values and display names — `src/utils/colors.ts` in the SDK source, if you need an exact cross-check (e.g. for a label color picker UI).
