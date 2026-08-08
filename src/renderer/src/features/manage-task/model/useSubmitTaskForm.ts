import type { UseFormReturnType } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import type { TaskDTO } from "@/main/tasks";
import type { useCreateTaskMutation } from "../api/useCreateTaskMutation";
import type { useUpdateTaskMutation } from "../api/useUpdateTaskMutation";
import { parseQuickAdd, type QuickAddContext } from "../lib/parseQuickAdd";
import type { TaskFormValues } from "./taskFormSchema";

type UseSubmitTaskFormParams = {
  form: UseFormReturnType<TaskFormValues>;
  isEditMode: boolean;
  task: TaskDTO | undefined;
  rawTitle: string;
  quickAddContext: QuickAddContext;
  createTaskMutation: ReturnType<typeof useCreateTaskMutation>;
  updateTaskMutation: ReturnType<typeof useUpdateTaskMutation>;
  onClose: () => void;
};

/** Builds the create/update payload and dispatches the right mutation for
 * the mode this modal is in — the title comes from the quick-add text (with
 * its tokens stripped), not a separate form field. */
export const useSubmitTaskForm = ({
  form,
  isEditMode,
  task,
  rawTitle,
  quickAddContext,
  createTaskMutation,
  updateTaskMutation,
  onClose,
}: UseSubmitTaskFormParams) =>
  form.onSubmit(
    (values) => {
      const title = parseQuickAdd(rawTitle, quickAddContext).cleanTitle;

      if (title.length === 0) {
        notifications.show({
          color: "red",
          title: isEditMode ? "Couldn't save task" : "Couldn't add task",
          message: "Title is required.",
        });
        return;
      }

      const due = values.dueDate
        ? {
            date: values.dueDate,
            datetime: values.dueTime
              ? dayjs(`${values.dueDate} ${values.dueTime}`).toISOString()
              : null,
          }
        : null;

      if (isEditMode && task) {
        updateTaskMutation.mutate({
          taskId: task.id,
          input: {
            title,
            description: values.description,
            projectId: values.projectId,
            priority: values.priority,
            due,
            kanbanStatus: values.kanbanStatus,
            labels: values.labels,
          },
        });
      } else {
        createTaskMutation.mutate({
          title,
          description: values.description,
          projectId: values.projectId,
          priority: values.priority,
          due,
          kanbanStatus: values.kanbanStatus,
          labels: values.labels,
        });
      }
      onClose();
    },
    () => {
      notifications.show({
        color: "red",
        title: isEditMode ? "Couldn't save task" : "Couldn't add task",
        message: "Please check the form for errors.",
      });
    },
  );
