import { Box, Group, Stack, Text } from "@mantine/core";
import type { FC } from "react";
import type { TaskCardBodyProps } from "./TaskCardBodyProps";

export const TaskCardExpandedStack: FC<TaskCardBodyProps> = ({
  checkbox,
  priorityDot,
  title,
  hasMeta,
  metaBadges,
}) => (
  <Stack gap={6}>
    <Group gap={6} wrap="nowrap" align="flex-start">
      {checkbox}
      {priorityDot && <Box mt={6}>{priorityDot}</Box>}
      <Text size="sm" fw={500} style={{ flex: 1 }}>
        {title}
      </Text>
    </Group>

    {hasMeta && (
      <Group gap={6} wrap="wrap">
        {metaBadges}
      </Group>
    )}
  </Stack>
);
