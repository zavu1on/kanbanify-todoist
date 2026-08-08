import {
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  TagsInput,
  Textarea,
  UnstyledButton,
} from "@mantine/core";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import { schemaResolver, useForm } from "@mantine/form";
import type { QueryKey } from "@tanstack/react-query";
import dayjs from "dayjs";
import { type FC, useRef } from "react";
import { useLabelsQuery } from "@/entities/label";
import { useProjectsQuery } from "@/entities/project";
import { KANBAN_COLUMN_LABELS } from "@/entities/task";
import type {
  KanbanStatusLevel as KanbanStatusLevelType,
  PriorityLevel,
  TaskDTO,
} from "@/main/tasks";
import { KANBAN_STATUS_LEVELS, PRIORITY_LEVELS } from "@/main/tasks";
import { useCreateLabelMutation } from "../api/useCreateLabelMutation";
import { useCreateTaskMutation } from "../api/useCreateTaskMutation";
import { useUpdateTaskMutation } from "../api/useUpdateTaskMutation";
import type { QuickAddContext } from "../lib/parseQuickAdd";
import { useDiscardConfirmation } from "../model/useDiscardConfirmation";
import { useInboxProjectDefault } from "../model/useInboxProjectDefault";
import { useLabelsFieldHandler } from "../model/useLabelsFieldHandler";
import { useProjectMentionSuggestions } from "../model/useProjectMentionSuggestions";
import { useQuickAddTitleSync } from "../model/useQuickAddTitleSync";
import { useSubmitTaskForm } from "../model/useSubmitTaskForm";
import { useTaskFieldTokenHandlers } from "../model/useTaskFieldTokenHandlers";
import { taskFormSchema } from "../model/taskFormSchema";
import { DiscardChangesModal } from "./DiscardChangesModal";
import { QuickAddTitleInput } from "./QuickAddTitleInput";
import { ReservedLabelModal } from "./ReservedLabelModal";

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
          <Box pos="relative">
            <QuickAddTitleInput
              segments={quickAddSegments}
              onTextChange={handleTitleTextChange}
              onSubmit={() => formRef.current?.requestSubmit()}
              placeholder="Task name — try 'tomorrow at 18:00 p1 @errand #Work @todo'"
            />
            {projectSuggestions.length > 0 && (
              <Paper
                withBorder
                shadow="sm"
                pos="absolute"
                top="100%"
                left={0}
                right={0}
                style={{ zIndex: 200 }}
              >
                <Stack gap={0}>
                  {projectSuggestions.map((project) => (
                    <UnstyledButton
                      key={project.id}
                      px="sm"
                      py={6}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectProjectSuggestion(project)}
                    >
                      {project.name}
                    </UnstyledButton>
                  ))}
                </Stack>
              </Paper>
            )}
          </Box>

          <Textarea
            label="Description"
            placeholder="Add a description"
            minRows={3}
            {...form.getInputProps("description")}
          />

          <Select
            label="Project"
            data={projectOptions}
            searchable
            allowDeselect={false}
            value={form.values.projectId}
            onChange={handleProjectChange}
          />

          <Group grow align="flex-start">
            <DatePickerInput
              label="Date"
              placeholder="No date"
              clearable
              value={form.values.dueDate}
              onChange={(value) =>
                handleDueDateChange(typeof value === "string" ? value : null)
              }
            />
            <TimeInput
              label="Time"
              disabled={!form.values.dueDate}
              value={form.values.dueTime ?? ""}
              onChange={(event) =>
                handleDueTimeChange(event.currentTarget.value)
              }
            />
          </Group>

          <Select
            label="Priority"
            data={[...PRIORITY_LEVELS].map((level) => ({
              value: level,
              label: level.toUpperCase(),
            }))}
            allowDeselect={false}
            value={form.values.priority}
            onChange={handlePriorityChange}
          />

          <Select
            label="Kanban status"
            data={KANBAN_STATUS_LEVELS.map((level) => ({
              value: level,
              label: KANBAN_COLUMN_LABELS[level],
            }))}
            allowDeselect={false}
            value={form.values.kanbanStatus}
            onChange={handleKanbanStatusChange}
          />

          <TagsInput
            label="Labels"
            placeholder="Search or create a label"
            data={labelOptions}
            value={form.values.labels}
            onChange={handleLabelsChange}
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
    </Modal>
  );
};
