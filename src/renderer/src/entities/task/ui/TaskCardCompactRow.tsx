import { Group, ScrollArea, Text } from "@mantine/core";
import type { FC } from "react";
import type { TaskCardBodyProps } from "./TaskCardBodyProps";

export const TaskCardCompactRow: FC<TaskCardBodyProps> = ({
  checkbox,
  priorityDot,
  title,
  hasMeta,
  metaBadges,
}) => (
  <Group gap={6} wrap="nowrap" align="center">
    {checkbox}
    {priorityDot}
    <Text size="sm" fw={500} truncate="end" style={{ flexShrink: 0 }}>
      {title}
    </Text>
    {hasMeta && (
      <ScrollArea scrollbars="x" type="hover" style={{ flex: 1, minWidth: 0 }}>
        <Group gap={6} wrap="nowrap">
          {metaBadges}
        </Group>
      </ScrollArea>
    )}
  </Group>
);
