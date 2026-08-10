import {
  Box,
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
import type { FC } from "react";
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
}) => (
  <>
    <Box pos="relative">
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

    <TagsInput
      label="Labels"
      placeholder="Search or create a label"
      data={labelOptions}
      value={form.values.labels}
      onChange={onLabelsChange}
    />
  </>
);
