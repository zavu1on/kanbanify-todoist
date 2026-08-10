import {
  Box,
  Grid,
  Group,
  Paper,
  Select,
  Stack,
  TagsInput,
  Textarea,
  UnstyledButton,
} from "@mantine/core";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import type { UseFormReturnType } from "@mantine/form";
import type { FC, ReactNode } from "react";
import { KANBAN_COLUMN_LABELS } from "@/entities/task";
import { KANBAN_STATUS_LEVELS, PRIORITY_LEVELS } from "@/main/tasks";
import type { QuickAddSegment } from "../lib/parseQuickAdd";
import type { TaskFormValues } from "../model/taskFormSchema";
import { QuickAddTitleInput } from "./QuickAddTitleInput";

type ProjectOption = { id: string; name: string };

type TaskFormFieldsProps = {
  form: UseFormReturnType<TaskFormValues>;
  quickAddSegments: QuickAddSegment[];
  onTitleTextChange: (text: string) => void;
  onTitleSubmit: () => void;
  projectSuggestions: ProjectOption[];
  onSelectProjectSuggestion: (project: ProjectOption) => void;
  projectOptions: { value: string; label: string }[];
  onProjectChange: (value: string | null) => void;
  onDueDateChange: (value: string | null) => void;
  onDueTimeChange: (value: string) => void;
  onPriorityChange: (value: string | null) => void;
  onKanbanStatusChange: (value: string | null) => void;
  labelOptions: string[];
  onLabelsChange: (value: string[]) => void;
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
  // here so `TaskFormFields` stays about form fields, not IPC-backed data.
  subtasksSection?: ReactNode;
  // The task-completion checkbox (SPECIFICATION.md "Детальное отображение
  // задачи": "слева от названия") — owned by the caller since it drives a
  // mutation, `TaskFormFields` only reserves the slot next to the title.
  titleLeftSection?: ReactNode;
};

export const TaskFormFields: FC<TaskFormFieldsProps> = ({
  form,
  quickAddSegments,
  onTitleTextChange,
  onTitleSubmit,
  projectSuggestions,
  onSelectProjectSuggestion,
  projectOptions,
  onProjectChange,
  onDueDateChange,
  onDueTimeChange,
  onPriorityChange,
  onKanbanStatusChange,
  labelOptions,
  onLabelsChange,
  hideKanbanStatus,
  disableProject,
  subtasksSection,
  titleLeftSection,
}) => (
  <Grid gap="lg">
    <Grid.Col span={{ base: 12, sm: 7 }}>
      <Stack gap="md">
        <Group align="flex-start" wrap="nowrap" gap="xs">
          {titleLeftSection}
          <Box pos="relative" style={{ flex: 1 }}>
            <QuickAddTitleInput
              segments={quickAddSegments}
              onTextChange={onTitleTextChange}
              onSubmit={onTitleSubmit}
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
                      onClick={() => onSelectProjectSuggestion(project)}
                    >
                      {project.name}
                    </UnstyledButton>
                  ))}
                </Stack>
              </Paper>
            )}
          </Box>
        </Group>

        <Textarea
          label="Description"
          placeholder="Add a description"
          minRows={3}
          {...form.getInputProps("description")}
        />

        {subtasksSection}
      </Stack>
    </Grid.Col>

    <Grid.Col span={{ base: 12, sm: 5 }}>
      <Stack gap="md">
        <Select
          label="Project"
          data={projectOptions}
          searchable
          allowDeselect={false}
          disabled={disableProject}
          value={form.values.projectId}
          onChange={onProjectChange}
        />

        <Group grow align="flex-start">
          <DatePickerInput
            label="Date"
            placeholder="No date"
            clearable
            value={form.values.dueDate}
            onChange={(value) =>
              onDueDateChange(typeof value === "string" ? value : null)
            }
          />
          <TimeInput
            label="Time"
            disabled={!form.values.dueDate}
            value={form.values.dueTime ?? ""}
            onChange={(event) => onDueTimeChange(event.currentTarget.value)}
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
          onChange={onPriorityChange}
        />

        {!hideKanbanStatus && (
          <Select
            label="Kanban status"
            data={KANBAN_STATUS_LEVELS.map((level) => ({
              value: level,
              label: KANBAN_COLUMN_LABELS[level],
            }))}
            allowDeselect={false}
            value={form.values.kanbanStatus}
            onChange={onKanbanStatusChange}
          />
        )}

        <TagsInput
          label="Labels"
          placeholder="Search or create a label"
          data={labelOptions}
          value={form.values.labels}
          onChange={onLabelsChange}
        />
      </Stack>
    </Grid.Col>
  </Grid>
);
