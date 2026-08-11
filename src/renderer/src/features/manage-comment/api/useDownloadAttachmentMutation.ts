import { notifications } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";
import { downloadAttachment } from "./downloadAttachment";

/** No cache to touch — downloading doesn't change any comment's state, it
 * just moves bytes to a user-picked path via the native save dialog. */
export const useDownloadAttachmentMutation = () =>
  useMutation({
    mutationFn: downloadAttachment,

    onSuccess: (result) => {
      // `saved: false` means the user canceled the native save dialog — a
      // normal outcome, nothing to show.
      if (!result.ok) {
        notifications.show({
          color: "red",
          title: "Couldn't download file",
          message: result.error.message,
        });
      }
    },

    onError: () => {
      notifications.show({
        color: "red",
        title: "Couldn't download file",
        message: "Something went wrong. Please try again.",
      });
    },
  });
