import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { filtersListQueryKey } from "@/entities/filter";
import type { FiltersListResult, UpdateFilterRequest } from "@/main/filters";
import { getFilterErrorMessage } from "../model/getFilterErrorMessage";
import { updateFilter } from "./updateFilter";

/** Patches the edited filter in place immediately, rolled back on
 * failure/error — see `useUpdateProjectMutation` for the same pattern on
 * projects. */
export const useUpdateFilterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateFilterRequest }) =>
      updateFilter(id, input),

    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: filtersListQueryKey });
      const previous =
        queryClient.getQueryData<FiltersListResult>(filtersListQueryKey);

      queryClient.setQueryData<FiltersListResult>(
        filtersListQueryKey,
        (data) =>
          data?.ok
            ? {
                ...data,
                filters: data.filters.map((filter) =>
                  filter.id === id ? { ...filter, ...input } : filter,
                ),
              }
            : data,
      );

      return { previous };
    },

    onSuccess: (result, _variables, context) => {
      if (!result.ok) {
        if (context?.previous) {
          queryClient.setQueryData(filtersListQueryKey, context.previous);
        }
        notifications.show({
          color: "red",
          title: "Couldn't save filter",
          message: getFilterErrorMessage(result.error.type),
        });
        return;
      }

      queryClient.setQueryData<FiltersListResult>(
        filtersListQueryKey,
        (data) =>
          data?.ok
            ? {
                ...data,
                filters: data.filters.map((filter) =>
                  filter.id === result.filter.id ? result.filter : filter,
                ),
              }
            : data,
      );
      // The server response carries `taskCount: 0` (see `FiltersIpcController`)
      // — refetch to replace it with the real count.
      queryClient.invalidateQueries({ queryKey: filtersListQueryKey });
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(filtersListQueryKey, context.previous);
      }
      notifications.show({
        color: "red",
        title: "Couldn't save filter",
        message: "Something went wrong. Please try again.",
      });
    },
  });
};
