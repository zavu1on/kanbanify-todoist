import { Group, Stack } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { type ReactNode, type Ref, useImperativeHandle, useRef } from "react";
import type { LabelDTO } from "@/main/labels";
import type { ProjectDTO } from "@/main/projects";
import { RESERVED_LABELS } from "../model/reservedLabels";
import type { TaskFormValues } from "../model/taskFormSchema";
import { useTaskFieldTokenHandlers } from "../model/useTaskFieldTokenHandlers";
import { DescriptionField } from "./fields/DescriptionField";
import { DueDateTimeField } from "./fields/DueDateTimeField";
import { KanbanStatusField } from "./fields/KanbanStatusField";
import { LabelsField } from "./fields/LabelsField";
import { PriorityField } from "./fields/PriorityField";
import { ProjectField } from "./fields/ProjectField";
import {
  QuickAddTitleField,
  type QuickAddTitleFieldHandle,
} from "./fields/QuickAddTitleField";

export type TaskFormFieldsHandle = {
  getRawTitle: () => string;
};

type TaskFormFieldsProps = {
  ref: Ref<TaskFormFieldsHandle>;
  form: UseFormReturnType<TaskFormValues>;
  projects: ProjectDTO[];
  knownLabels: LabelDTO[];
  /** Seeds the quick-add title text — the task's plain title on edit, blank
   * on create (see `TaskFormFrame`). */
  initialRawTitle: string;
  onTitleSubmit: () => void;
  // Hidden for a subtask's own form (SPECIFICATION.md domain model, per
  // product decision: subtasks don't carry a kanban status at all).
  hideKanbanStatus?: boolean;
  // Disabled for a subtask's own form — a subtask's project is inherited
  // from its parent and not independently editable (SPECIFICATION.md:
  // "созданная подзадача наследует проект родителя"; see `UpdateTaskUseCase`
  // for why sending a different project for a subtask would silently detach
  // it from its parent on Todoist's side).
  disableProject?: boolean;
  // The subtasks block (rendered by the caller) goes at the bottom of the
  // left column, below the title/description — passed in rather than owned
  // here so this stays about form fields, not IPC-backed data.
  subtasksSection?: ReactNode;
  // The comments block — below the subtasks block (SPECIFICATION.md-adjacent
  // COMMENTS.md: "Форма расположена под подзадачами"), same reasoning as
  // `subtasksSection` for why it's passed in rather than owned here.
  commentsSection?: ReactNode;
  // The task-completion checkbox (SPECIFICATION.md "Детальное отображение
  // задачи": "слева от названия") — owned by the caller since it drives a
  // mutation, this component only reserves the slot next to the title.
  titleLeftSection?: ReactNode;
};

/**
 * Lays out every task field as its own leaf component (`ui/fields/*`), each
 * subscribed only to its own `form` path — so picking a value in one field
 * re-renders just that field, not its siblings, `TaskFormFrame`, or
 * `SubtasksSection`/`CommentsSection`. This orchestrator itself carries no
 * field-level state, so it only re-renders when its own props change
 * (`projects`/`knownLabels` refetching), not on every keystroke or pick.
 * `getRawTitle` forwards `QuickAddTitleField`'s own handle for
 * `TaskFormFrame`'s submit and dirty-check.
 */
export const TaskFormFields = ({
  ref,
  form,
  projects,
  knownLabels,
  initialRawTitle,
  onTitleSubmit,
  hideKanbanStatus,
  disableProject,
  subtasksSection,
  commentsSection,
  titleLeftSection,
}: TaskFormFieldsProps) => {
  const titleFieldRef = useRef<QuickAddTitleFieldHandle>(null);
  useImperativeHandle(ref, () => ({
    getRawTitle: () => titleFieldRef.current?.getRawTitle() ?? initialRawTitle,
  }));

  const projectSummaries = projects.map((p) => ({ id: p.id, name: p.name }));
  const quickAddContext = {
    projects: projectSummaries,
    reservedLabels: RESERVED_LABELS,
  };

  const {
    handlePriorityChange,
    handleProjectChange,
    handleDueDateChange,
    handleDueTimeChange,
    handleKanbanStatusChange,
  } = useTaskFieldTokenHandlers({
    form,
    projects: projectSummaries,
    resyncTitleToken: (type, tokenText) =>
      titleFieldRef.current?.resyncTitleToken(type, tokenText),
  });

  const projectOptions = projectSummaries.map((p) => ({
    value: p.id,
    label: p.name,
  }));
  const labelOptions = knownLabels
    .filter(
      (l) =>
        !(RESERVED_LABELS as readonly string[]).includes(l.name.toLowerCase()),
    )
    .map((l) => l.name);

  return (
    <Stack gap="md">
      <Group align="center" wrap="nowrap" gap="xs">
        {titleLeftSection}
        <QuickAddTitleField
          ref={titleFieldRef}
          form={form}
          projects={projectSummaries}
          quickAddContext={quickAddContext}
          initialRawTitle={initialRawTitle}
          onSubmit={onTitleSubmit}
        />
      </Group>

      <Group gap={8} wrap="wrap">
        <ProjectField
          form={form}
          projectOptions={projectOptions}
          disabled={disableProject}
          onChange={handleProjectChange}
        />

        <DueDateTimeField
          form={form}
          onDueDateChange={handleDueDateChange}
          onDueTimeChange={handleDueTimeChange}
        />

        <PriorityField form={form} onChange={handlePriorityChange} />

        {!hideKanbanStatus && (
          <KanbanStatusField form={form} onChange={handleKanbanStatusChange} />
        )}

        <LabelsField
          form={form}
          labelOptions={labelOptions}
          quickAddContext={quickAddContext}
          initialRawTitle={initialRawTitle}
          titleFieldRef={titleFieldRef}
        />
      </Group>

      <DescriptionField form={form} />

      {subtasksSection}
      {commentsSection}
    </Stack>
  );
};
