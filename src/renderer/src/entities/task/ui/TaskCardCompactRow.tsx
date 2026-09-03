import { Box, Group, ScrollArea, Text } from "@mantine/core";
import { ChevronRightIcon } from "lucide-animated";
import type { FC } from "react";
import type { TaskCardBodyProps } from "./TaskCardBodyProps";
import styles from "./TaskCardCompactRow.module.css";

// Plain list-row layout for subtask rows inside the detail modal — no
// priority rail (subtasks don't carry one in this view), a chevron hints
// the row opens the subtask on click. Hover feedback (background + chevron
// visibility) is pure CSS (`:hover` in TaskCardCompactRow.module.css, keyed
// off `.card` set on the Card in TaskCard.tsx) — no re-render on hover.
export const TaskCardCompactRow: FC<TaskCardBodyProps> = ({
  checkbox,
  title,
  hasMeta,
  dueMeta,
  projectMeta,
  kanbanPill,
  labelPills,
}) => (
  <Group gap={6} wrap="nowrap" align="center">
    {checkbox}
    <Text size="sm" fw={500} truncate="end" style={{ minWidth: 0 }}>
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
    <Box className={styles.chevron} style={{ flex: "0 0 auto" }}>
      <ChevronRightIcon
        size={15}
        animateOnHover={false}
        color="#c3c9d3"
        style={{ display: "flex" }}
      />
    </Box>
  </Group>
);
