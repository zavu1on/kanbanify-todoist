/** Shared between `entities/label` (the query) and `features/manage-task`
 * (label creation) — kept in `entities` so both layers can import it without
 * reaching into each other's slice. */
export const labelsListQueryKey = ["labels", "list"] as const;
