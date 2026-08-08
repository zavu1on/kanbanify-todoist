import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { labelsListQueryKey } from "@/entities/label";
import type { LabelsListResult } from "@/main/labels";
import { createLabel } from "./createLabel";

/**
 * Creates a new label from the task form's label multiselect (SPECIFICATION.md
 * "Детальное отображение задачи": "мультивыбор с поиском и созданием нового").
 * Not optimistic like the task mutations — label creation is infrequent and
 * low-risk, so this just waits for the real id and writes it into the cache,
 * rather than juggling a temp-id placeholder for a control that needs the
 * real id back immediately to select it.
 */
export const useCreateLabelMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLabel,

    onSuccess: (result) => {
      if (!result.ok) {
        notifications.show({
          color: "red",
          title: "Couldn't create label",
          message: result.error.message,
        });
        return;
      }

      queryClient.setQueryData<LabelsListResult>(labelsListQueryKey, (data) =>
        data?.ok ? { ...data, labels: [...data.labels, result.label] } : data,
      );
    },

    onError: () => {
      notifications.show({
        color: "red",
        title: "Couldn't create label",
        message: "Something went wrong. Please try again.",
      });
    },
  });
};
