import { Button, Checkbox, Divider, Group, Stack } from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import type { QueryKey } from "@tanstack/react-query";
import dayjs from "dayjs";
import { type FC, useEffect, useRef, useState } from "react";
import { useLabelsQuery } from "@/entities/label";
import { useProjectsQuery } from "@/entities/project";
import { useCompleteTaskMutation } from "@/features/complete-task";
import {
  DeleteTaskConfirmModal,
  useDeleteTaskMutation,
} from "@/features/delete-task";
import { CommentsSection } from "@/features/manage-comment";
import type {
  KanbanStatusLevel as KanbanStatusLevelType,
  PriorityLevel,
  TaskDTO,
} from "@/main/tasks";
import { KANBAN_STATUS_LEVELS } from "@/main/tasks";
import { useCreateLabelMutation } from "../api/useCreateLabelMutation";
import { useCreateTaskMutation } from "../api/useCreateTaskMutation";
import { useUpdateTaskMutation } from "../api/useUpdateTaskMutation";
import type { QuickAddContext } from "../lib/parseQuickAdd";
import { taskFormSchema } from "../model/taskFormSchema";
import { useDiscardConfirmation } from "../model/useDiscardConfirmation";
import { useInboxProjectDefault } from "../model/useInboxProjectDefault";
import { useLabelsFieldHandler } from "../model/useLabelsFieldHandler";
import { useProjectMentionSuggestions } from "../model/useProjectMentionSuggestions";
import { useQuickAddTitleSync } from "../model/useQuickAddTitleSync";
import { useSubmitTaskForm } from "../model/useSubmitTaskForm";
import { useTaskFieldTokenHandlers } from "../model/useTaskFieldTokenHandlers";
import { DiscardChangesModal } from "./DiscardChangesModal";
import { ReservedLabelModal } from "./ReservedLabelModal";
import { SubtasksSection } from "./SubtasksSection";
import { TaskFormFields } from "./TaskFormFields";

/** Reserved kanban labels (see `KANBAN_STATUS_LEVELS`) never go through the
 * Labels field or an `@label` quick-add token — they're only ever set via
 * the Kanban status control (SPECIFICATION.md "Детальное отображение задачи"). */
const RESERVED_LABELS = KANBAN_STATUS_LEVELS.filter(
  (level): level is Exclude<typeof level, "none"> => level !== "none",
);

export type TaskFormDefaults = {
  projectId?: string;
  kanbanStatus?: KanbanStatusLevelType;
  due?: { date: string; datetime: string | null } | null;
};

type TaskFormFrameProps = {
  /** The list cache this frame's own create/update/complete/delete writes
   * land in — the modal's own `queryKey` prop for the root task, or the
   * parent's subtasks list for a subtask frame (see `TaskFormModal`). */
  queryKey: QueryKey;
  /** Absent in create mode. */
  task?: TaskDTO;
  defaults?: TaskFormDefaults;
  /** Present only for a subtask frame — drives the "back to parent" link,
   * hides the Kanban status field, and scopes the new-subtask project
   * default (SPECIFICATION.md domain model: subtasks don't carry a kanban
   * status; a new subtask inherits its parent's project). */
  parentTask?: TaskDTO;
  onOpenSubtask: (subtask: TaskDTO) => void;
  onAddSubtask: () => void;
  /** Pops this frame back to its parent — undefined for the root frame,
   * where "leaving" means closing the whole modal instead. */
  onBack?: () => void;
  onCloseModal: () => void;
  /** Lets the modal shell route its own close affordances (backdrop click,
   * the breadcrumb link) through this frame's own dirty-check, without the
   * shell reaching into `useDiscardConfirmation`'s internals itself. */
  registerLeave: (fn: () => void) => void;
};

export const TaskFormFrame: FC<TaskFormFrameProps> = ({
  queryKey,
  task,
  defaults,
  parentTask,
  onOpenSubtask,
  onAddSubtask,
  onBack,
  onCloseModal,
  registerLeave,
}) => {
  const isEditMode = task !== undefined;
  // Leaving this frame: pop back to the parent frame if there is one,
  // otherwise close the whole modal (SPECIFICATION.md: Cancel/Escape/the
  // breadcrumb link on a subtask return to its parent, not close the modal).
  const leave = onBack ?? onCloseModal;

  const projectsQuery = useProjectsQuery();
  const projects = projectsQuery.data?.ok ? projectsQuery.data.projects : [];
  const inboxProject = projects.find((p) => p.isInboxProject);
  const baselineProjectId = defaults?.projectId ?? inboxProject?.id ?? "";

  const labelsQuery = useLabelsQuery();
  const knownLabels = labelsQuery.data?.ok ? labelsQuery.data.labels : [];

  const createTaskMutation = useCreateTaskMutation(queryKey);
  const updateTaskMutation = useUpdateTaskMutation(queryKey);
  const createLabelMutation = useCreateLabelMutation();
  const deleteTaskMutation = useDeleteTaskMutation(queryKey);
  const completeTaskMutation = useCompleteTaskMutation(queryKey);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  // Plays a brief press animation before closing — the actual completion
  // (and the task's disappearance from whichever list it's in) happens once
  // the modal is already gone, same reasoning as `TaskCard`'s checkbox.
  const [isCompleting, setIsCompleting] = useState(false);

  const quickAddContext: QuickAddContext = {
    projects: projects.map((p) => ({ id: p.id, name: p.name })),
    reservedLabels: RESERVED_LABELS,
  };

  // Seeded from the task's plain title on edit, same as create mode starting
  // blank — everything else stays in its own field until a recognized token
  // shows up in this text (see `useQuickAddTitleSync`).
  const initialRawTitle = task?.title ?? "";
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm({
    initialValues: {
      description: task?.description ?? "",
      projectId: task?.projectId ?? baselineProjectId,
      priority: task?.priority ?? ("p4" as PriorityLevel),
      dueDate: task?.due?.date ?? defaults?.due?.date ?? null,
      dueTime: task?.due?.datetime
        ? dayjs(task.due.datetime).format("HH:mm")
        : defaults?.due?.datetime
          ? dayjs(defaults.due.datetime).format("HH:mm")
          : null,
      kanbanStatus:
        task?.kanbanStatus.level ?? defaults?.kanbanStatus ?? "none",
      labels: task?.labels ?? [],
    },
    validate: schemaResolver(taskFormSchema, { sync: true }),
  });

  useInboxProjectDefault({
    form,
    isEditMode,
    defaultProjectId: defaults?.projectId,
    inboxProject,
  });

  const {
    rawTitle,
    quickAddSegments,
    handleTitleTextChange,
    resyncTitleToken,
    applyRawTitle,
  } = useQuickAddTitleSync({
    initialRawTitle,
    quickAddContext,
    form,
    knownLabels,
    onUnknownLabel: (name) => createLabelMutation.mutate(name),
  });

  const {
    handlePriorityChange,
    handleProjectChange,
    handleDueDateChange,
    handleDueTimeChange,
    handleKanbanStatusChange,
  } = useTaskFieldTokenHandlers({ form, projects, resyncTitleToken });

  const {
    handleLabelsChange,
    pendingReservedLabel,
    confirmReservedLabel,
    cancelReservedLabel,
  } = useLabelsFieldHandler({
    form,
    rawTitle,
    quickAddContext,
    reservedLabels: RESERVED_LABELS,
    knownLabels,
    onUnknownLabel: (name) => createLabelMutation.mutate(name),
    applyRawTitle,
    resyncTitleToken,
  });

  const { projectSuggestions, selectProjectSuggestion } =
    useProjectMentionSuggestions({ rawTitle, projects, form, applyRawTitle });

  const {
    isDiscardConfirmOpen,
    cancelDiscard,
    requestClose,
    handleFormKeyDown,
  } = useDiscardConfirmation({
    form,
    rawTitle,
    initialRawTitle,
    onClose: leave,
  });

  useEffect(() => {
    registerLeave(requestClose);
  });

  // The root frame gets Mantine's own `data-autofocus` handling on the
  // modal's initial open — but a subtask frame is pushed onto an already-open
  // modal, which that mechanism never re-triggers for. Focus its title field
  // ourselves, once, right when this frame is created (mount = navigated in).
  // biome-ignore lint/correctness/useExhaustiveDependencies: fires once on mount, not on every parentTask identity change
  useEffect(() => {
    if (!parentTask) return;
    formRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, []);

  const handleSubmit = useSubmitTaskForm({
    form,
    isEditMode,
    task,
    rawTitle,
    quickAddContext,
    createTaskMutation,
    updateTaskMutation,
    onClose: leave,
    parentId: parentTask?.id ?? null,
  });

  // Closes this frame first (pop or close the modal, see `leave`), then
  // deletes optimistically — the mutation's cache write no longer needs to
  // be reconciled with this frame being on screen for the task it just removed.
  const handleConfirmDelete = () => {
    setIsDeleteConfirmOpen(false);
    leave();
    if (task) deleteTaskMutation.mutate({ taskId: task.id });
  };

  const handleCompletePress = () => {
    setIsCompleting(true);
    // Long enough to register as a deliberate press, short enough not to
    // feel like a stall before the frame goes away. Completing a subtask
    // returns to its parent (`leave`), same as Save/Cancel — only the root
    // task's own completion closes the whole modal.
    setTimeout(() => {
      leave();
      if (task) completeTaskMutation.mutate({ taskId: task.id });
    }, 250);
  };

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));
  const labelOptions = knownLabels
    .filter(
      (l) =>
        !(RESERVED_LABELS as readonly string[]).includes(l.name.toLowerCase()),
    )
    .map((l) => l.name);

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
        <Stack gap="md">
          <TaskFormFields
            form={form}
            quickAddSegments={quickAddSegments}
            onTitleTextChange={handleTitleTextChange}
            onTitleSubmit={() => formRef.current?.requestSubmit()}
            projectSuggestions={projectSuggestions}
            onSelectProjectSuggestion={selectProjectSuggestion}
            projectOptions={projectOptions}
            onProjectChange={handleProjectChange}
            onDueDateChange={handleDueDateChange}
            onDueTimeChange={handleDueTimeChange}
            onPriorityChange={handlePriorityChange}
            onKanbanStatusChange={handleKanbanStatusChange}
            labelOptions={labelOptions}
            onLabelsChange={handleLabelsChange}
            hideKanbanStatus={parentTask !== undefined}
            disableProject={parentTask !== undefined}
            titleLeftSection={
              isEditMode && (
                <Checkbox
                  checked={isCompleting}
                  disabled={isCompleting}
                  aria-label={`Complete "${task.title}"`}
                  onChange={handleCompletePress}
                />
              )
            }
            subtasksSection={
              <SubtasksSection
                parentTask={task}
                onOpenSubtask={onOpenSubtask}
                onAddSubtask={onAddSubtask}
              />
            }
            commentsSection={task && <CommentsSection taskId={task.id} />}
          />

          <Group justify="flex-end">
            <Button type="button" variant="default" onClick={requestClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={(event) => event.currentTarget.form?.requestSubmit()}
            >
              {isEditMode ? "Save" : "Add"}
            </Button>
          </Group>

          {isEditMode && (
            <>
              <Divider />
              <Group justify="flex-end">
                <Button
                  type="button"
                  color="red"
                  variant="subtle"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                >
                  Delete
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </form>

      <DiscardChangesModal
        opened={isDiscardConfirmOpen}
        onCancel={cancelDiscard}
        onDiscard={leave}
      />

      <ReservedLabelModal
        pendingLabel={pendingReservedLabel}
        onCancel={cancelReservedLabel}
        onConfirm={confirmReservedLabel}
      />

      <DeleteTaskConfirmModal
        opened={isDeleteConfirmOpen}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};
