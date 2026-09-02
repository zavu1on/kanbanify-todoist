import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { filtersListQueryKey } from "@/entities/filter";
import type { FilterDTO, FiltersListResult } from "@/main/filters";
import { getFilterErrorMessage } from "../model/getFilterErrorMessage";
import { createFilter } from "./createFilter";

/** Adds the new filter to the sidebar immediately, under a temporary id —
 * replaced with the real one on success, or rolled back on failure/error
 * (see `useCreateProjectMutation` for the same pattern on projects). Negative,
 * since real ids are `sqlite` `AUTOINCREMENT` values starting at 1. The
 * form modal closes as soon as it fires this mutation (see
 * `FilterFormModal`), so the failure notification lives here, not in the
 * component that triggered the call. */
export const useCreateFilterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFilter,

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: filtersListQueryKey });
      const previous =
        queryClient.getQueryData<FiltersListResult>(filtersListQueryKey);
      const tempId = -Date.now();

      queryClient.setQueryData<FiltersListResult>(
        filtersListQueryKey,
        (data) =>
          data?.ok
            ? {
                ...data,
                filters: [
                  ...data.filters,
                  {
                    id: tempId,
                    title: input.title,
                    color: input.color,
                    query: input.query,
                  } satisfies FilterDTO,
                ],
              }
            : data,
      );

      return { previous, tempId };
    },

    onSuccess: (result, _input, context) => {
      if (!result.ok) {
        if (context?.previous) {
          queryClient.setQueryData(filtersListQueryKey, context.previous);
        }
        notifications.show({
          color: "red",
          title: "Couldn't add filter",
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
                  filter.id === context.tempId ? result.filter : filter,
                ),
              }
            : data,
      );
    },

    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(filtersListQueryKey, context.previous);
      }
      notifications.show({
        color: "red",
        title: "Couldn't add filter",
        message: "Something went wrong. Please try again.",
      });
    },
  });
};
