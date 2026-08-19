import { Box, Group, Text } from "@mantine/core";
import type { FC } from "react";
import type { TaskCardBodyProps } from "./TaskCardBodyProps";

// Default layout for flat lists (Tasks list, Today, Overdue, Agenda) — one
// row: checkbox, title + meta line, then labels/kanban pill on the right.
// The priority rail is rendered by `TaskCard` itself (see its comment) so it
// sits at the card's true edge regardless of this row's padding.
export const TaskCardSingleRow: FC<TaskCardBodyProps> = ({
  checkbox,
  title,
  hasMeta,
  dueMeta,
  projectMeta,
  kanbanPill,
  labelPills,
}) => (
  <Group gap={12} wrap="nowrap" align="center">
    {checkbox}

    <Box style={{ flex: 1, minWidth: 0 }}>
      <Text size="sm" fw={500}>
        {title}
      </Text>

      {hasMeta && (
        <Group gap={9} wrap="wrap" mt={4}>
          {dueMeta}
          {projectMeta}
        </Group>
      )}
    </Box>

    <Group gap={6} wrap="nowrap">
      {labelPills}
      {kanbanPill}
    </Group>
  </Group>
);
