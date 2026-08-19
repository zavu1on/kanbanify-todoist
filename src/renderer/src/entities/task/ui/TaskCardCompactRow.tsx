import { Box, Group, ScrollArea, Text } from "@mantine/core";
import { ChevronRightIcon } from "lucide-animated";
import type { FC } from "react";
import type { TaskCardBodyProps } from "./TaskCardBodyProps";

// Plain list-row layout for subtask rows inside the detail modal — no
// priority rail (subtasks don't carry one in this view), a chevron hints
// the row opens the subtask on click.
export const TaskCardCompactRow: FC<TaskCardBodyProps> = ({
  checkbox,
  title,
  hasMeta,
  dueMeta,
  projectMeta,
  kanbanPill,
  labelPills,
  hovered,
}) => (
  <Group gap={6} wrap="nowrap" align="center">
    {checkbox}
    <Text size="sm" fw={500} truncate="end" style={{ flexShrink: 0 }}>
      {title}
    </Text>
    {hasMeta && (
      <ScrollArea scrollbars="x" type="hover" style={{ flex: 1, minWidth: 0 }}>
        <Group gap={6} wrap="nowrap">
          {dueMeta}
          {projectMeta}
          {kanbanPill}
          {labelPills}
        </Group>
      </ScrollArea>
    )}
    <Box
      style={{ visibility: hovered ? "visible" : "hidden", flex: "0 0 auto" }}
    >
      <ChevronRightIcon size={15} animateOnHover={false} color="#c3c9d3" />
    </Box>
  </Group>
);
