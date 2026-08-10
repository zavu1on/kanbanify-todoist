import { Button, Divider, Group, Modal, Stack } from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import type { QueryKey } from "@tanstack/react-query";
import dayjs from "dayjs";
import { type FC, useRef, useState } from "react";
import { useLabelsQuery } from "@/entities/label";
import { useProjectsQuery } from "@/entities/project";
import {
  DeleteTaskConfirmModal,
  useDeleteTaskMutation,
} from "@/features/delete-task";
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

type TaskFormModalProps = {
  opened: boolean;
  onClose: () => void;
  /** The list cache this modal was opened from — optimistic writes land here,
   * see `useCreateTaskMutation`/`useUpdateTaskMutation`. */
  queryKey: QueryKey;
  /** Absent in create mode. */
  task?: TaskDTO;
  /** Only used in create mode — pre-fills the form from the calling context
   * (kanban column, project page, ...), see SPECIFICATION.md "Добавление задачи". */
  defaults?: TaskFormDefaults;
};

export const TaskFormModal: FC<TaskFormModalProps> = ({
  opened,
  onClose,
  queryKey,
  task,
  defaults,
}) => {
  const isEditMode = task !== undefined;

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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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
  } = useDiscardConfirmation({ form, rawTitle, initialRawTitle, onClose });

  const handleSubmit = useSubmitTaskForm({
    form,
    isEditMode,
    task,
    rawTitle,
    quickAddContext,
    createTaskMutation,
    updateTaskMutation,
    onClose,
  });

  // Closes the detail modal first, then deletes optimistically — the delete
  // mutation's cache write no longer needs to be reconciled with this modal
  // being open on the task it just removed.
  const handleConfirmDelete = () => {
    setIsDeleteConfirmOpen(false);
    onClose();
    if (task) deleteTaskMutation.mutate({ taskId: task.id });
  };

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));
  const labelOptions = knownLabels
    .filter(
      (l) =>
        !(RESERVED_LABELS as readonly string[]).includes(l.name.toLowerCase()),
    )
    .map((l) => l.name);

  return (
    <Modal
      opened={opened}
      onClose={requestClose}
      closeOnEscape={false}
      title={isEditMode ? "Edit task" : "New task"}
      size="lg"
    >
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
        onDiscard={onClose}
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
    </Modal>
  );
};
