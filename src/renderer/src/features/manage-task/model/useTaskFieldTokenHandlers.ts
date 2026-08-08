import type { UseFormReturnType } from "@mantine/form";
import dayjs from "dayjs";
import type {
  KanbanStatusLevel as KanbanStatusLevelType,
  PriorityLevel,
} from "@/main/tasks";
import {
  buildDueToken,
  buildKanbanStatusToken,
  buildPriorityToken,
  buildProjectToken,
} from "../lib/parseQuickAdd";
import type { TaskFormValues } from "./taskFormSchema";

type UseTaskFieldTokenHandlersParams = {
  form: UseFormReturnType<TaskFormValues>;
  projects: { id: string; name: string }[];
  resyncTitleToken: (
    type: "priority" | "due" | "project" | "kanbanStatus",
    tokenText: string | null,
  ) => void;
};

/**
 * Single-value fields (priority, due date/time, project, kanban status) each
 * update the form and rewrite their quick-add token in the title the same
 * way — one handler per field, sharing that pattern (SPECIFICATION.md
 * "Добавление задачи": a manual field edit updates the corresponding
 * keyword in the input).
 */
export const useTaskFieldTokenHandlers = ({
  form,
  projects,
  resyncTitleToken,
}: UseTaskFieldTokenHandlersParams) => {
  const handlePriorityChange = (value: string | null) => {
    const priority = (value ?? "p4") as PriorityLevel;
    form.setFieldValue("priority", priority);
    resyncTitleToken("priority", buildPriorityToken(priority));
  };

  const handleProjectChange = (value: string | null) => {
    const projectId = value ?? form.getInitialValues().projectId;
    form.setFieldValue("projectId", projectId);
    const project = projects.find((p) => p.id === projectId);
    const token = project ? buildProjectToken(project.name) : null;
    resyncTitleToken(
      "project",
      projectId === form.getInitialValues().projectId ? null : token,
    );
  };

  const handleDueDateChange = (value: string | null) => {
    form.setFieldValue("dueDate", value);
    if (!value) form.setFieldValue("dueTime", null);
    const token = value ? buildDueToken({ date: value, datetime: null }) : null;
    resyncTitleToken("due", token);
  };

  const handleDueTimeChange = (value: string) => {
    form.setFieldValue("dueTime", value || null);
    if (form.values.dueDate) {
      const datetime = value
        ? dayjs(`${form.values.dueDate} ${value}`).toISOString()
        : null;
      const token = buildDueToken({ date: form.values.dueDate, datetime });
      resyncTitleToken("due", token);
    }
  };

  const handleKanbanStatusChange = (value: string | null) => {
    const kanbanStatus = (value ?? "none") as KanbanStatusLevelType;
    form.setFieldValue("kanbanStatus", kanbanStatus);
    const token =
      kanbanStatus === "none" ? null : buildKanbanStatusToken(kanbanStatus);
    resyncTitleToken("kanbanStatus", token);
  };

  return {
    handlePriorityChange,
    handleProjectChange,
    handleDueDateChange,
    handleDueTimeChange,
    handleKanbanStatusChange,
  };
};
