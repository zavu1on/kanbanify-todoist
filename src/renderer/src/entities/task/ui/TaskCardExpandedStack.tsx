import { Group, Stack, Text } from "@mantine/core";
import type { FC } from "react";
import type { TaskCardBodyProps } from "./TaskCardBodyProps";

// Two-row layout for the kanban board, where columns are too narrow for the
// single-row list layout — title on its own line, then a wrapping meta row.
export const TaskCardExpandedStack: FC<TaskCardBodyProps> = ({
  checkbox,
  title,
  hasMeta,
  dueMeta,
  projectMeta,
  kanbanPill,
  labelPills,
}) => (
  <Stack gap={8}>
    <Group gap={10} wrap="nowrap" align="flex-start">
      {checkbox}
      <Text size="sm" fw={500} style={{ flex: 1 }}>
        {title}
      </Text>
    </Group>

    {hasMeta && (
      <Group gap={8} wrap="wrap" pl={checkbox ? 28 : 0}>
        {dueMeta}
        {kanbanPill}
        {projectMeta}
        {labelPills}
      </Group>
    )}
  </Stack>
);
