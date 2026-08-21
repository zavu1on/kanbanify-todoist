import type { QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * Snapshots `queryKey`'s current cache value, applies `updater` to it, and
 * returns the snapshot so the caller can roll back later via
 * `queryClient.setQueryData(queryKey, snapshot)` — the same
 * read-before-write shape every optimistic mutation already repeats for its
 * own list cache, factored out for the count caches (`taskCountQueryKey`,
 * `todayCountQueryKey`, `projectsListQueryKey`) that a single mutation can
 * touch more than one of.
 */
export const snapshotAndUpdate = <T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  updater: (data: T | undefined) => T | undefined,
): T | undefined => {
  const previous = queryClient.getQueryData<T>(queryKey);
  queryClient.setQueryData<T>(queryKey, updater);
  return previous;
};
