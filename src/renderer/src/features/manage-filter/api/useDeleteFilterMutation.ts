import { useMutation, useQueryClient } from "@tanstack/react-query";
import { filtersListQueryKey } from "@/entities/filter";
import type { FiltersListResult } from "@/main/filters";
import { deleteFilter } from "./deleteFilter";

/** Removes the filter from the sidebar immediately, put back on
 * failure/error. Unlike deleting a project, this has no cascading effect on
 * any cached tasks list — a filter is a local, read-only lens over tasks
 * that still exist, not their owner. */
export const useDeleteFilterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFilter,

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: filtersListQueryKey });
      const previous =
        queryClient.getQueryData<FiltersListResult>(filtersListQueryKey);

      queryClient.setQueryData<FiltersListResult>(
        filtersListQueryKey,
        (data) =>
          data?.ok
            ? {
                ...data,
                filters: data.filters.filter((filter) => filter.id !== id),
              }
            : data,
      );

      return { previous };
    },

    onSuccess: (result, _id, context) => {
      if (!result.ok && context?.previous) {
        queryClient.setQueryData(filtersListQueryKey, context.previous);
      }
    },

    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(filtersListQueryKey, context.previous);
      }
    },
  });
};
