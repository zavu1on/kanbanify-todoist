import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AutoLaunchStatusResult } from "@/main/startup";
import { autoLaunchQueryKey } from "../model/autoLaunchQueryKey";
import { setAutoLaunchStatus } from "./setAutoLaunchStatus";

export const useSetAutoLaunchMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setAutoLaunchStatus,

    onMutate: async (enabled: boolean) => {
      await queryClient.cancelQueries({ queryKey: autoLaunchQueryKey });
      const previous = queryClient.getQueryData<AutoLaunchStatusResult>(
        autoLaunchQueryKey,
      );

      const optimistic: AutoLaunchStatusResult = { ok: true, enabled };
      queryClient.setQueryData(autoLaunchQueryKey, optimistic);

      return { previous };
    },

    // The API result is a discriminated union, not a throw (see
    // BACKEND_CODE_STYLE_GUIDE.md "IPC-контракт") — a failed toggle surfaces
    // here as `result.ok === false`, not `onError`.
    onSuccess: (result, _enabled, context) => {
      if (result.ok) {
        queryClient.setQueryData(autoLaunchQueryKey, result);
        return;
      }

      if (context?.previous) {
        queryClient.setQueryData(autoLaunchQueryKey, context.previous);
      }
      notifications.show({
        color: "red",
        title: "Couldn't update startup setting",
        message: result.error.message,
      });
    },
  });
};
