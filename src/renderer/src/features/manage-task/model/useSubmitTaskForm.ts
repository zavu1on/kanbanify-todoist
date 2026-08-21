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
  // A getter, not the value itself — `rawTitle` lives in `TaskFormFields`
  // (kept out of `TaskFormFrame`'s state so typing doesn't re-render the
  // frame), so this reads it imperatively at submit-time instead of
  // subscribing to every change.
  getRawTitle: () => string;
  quickAddContext: QuickAddContext;
  createTaskMutation: ReturnType<typeof useCreateTaskMutation>;
  updateTaskMutation: ReturnType<typeof useUpdateTaskMutation>;
  onClose: () => void;
  /** `null` for a top-level task — a subtask frame passes its parent task's id. */
  parentId: string | null;
};

/** Builds the create/update payload and dispatches the right mutation for
 * the mode this modal is in — the title comes from the quick-add text (with
 * its tokens stripped), not a separate form field. */
export const useSubmitTaskForm = ({
  form,
  isEditMode,
  task,
  getRawTitle,
  quickAddContext,
  createTaskMutation,
  updateTaskMutation,
  onClose,
  parentId,
}: UseSubmitTaskFormParams) =>
  form.onSubmit(
    (values) => {
      const title = parseQuickAdd(getRawTitle(), quickAddContext).cleanTitle;

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
          task,
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
          parentId,
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
