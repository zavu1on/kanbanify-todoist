import { useHotkeys } from "@mantine/hooks";
import { type QueryKey, useQueryClient } from "@tanstack/react-query";

/** Shared "Refetch" (Ctrl+R) handler for every screen showing a tasks list
 * (`pages/tasks`, `pages/calendar`) — "Refetch" means reload, not "fetch one
 * more page on top of what's cached", so it goes through `resetQueries`
 * (drops every already-loaded page) rather than `refetch()` (would re-fetch
 * all of them). Subtasks and comments aren't part of the list itself but are
 * shown in each card's detail modal, so they'd otherwise go stale silently
 * until that modal is reopened later — callers pass every cache prefix that
 * "Refetch" should cover (the list itself, plus subtasks/comments), reset by
 * shared key prefix rather than the one card a user happens to have open. */
export const useRefetchTasksHandler = (queryKeys: QueryKey[]) => {
  const queryClient = useQueryClient();

  const handleRefetch = () => {
    for (const queryKey of queryKeys) {
      queryClient.resetQueries({ queryKey });
    }
  };

  useHotkeys([["mod+R", handleRefetch]]);

  return handleRefetch;
};
