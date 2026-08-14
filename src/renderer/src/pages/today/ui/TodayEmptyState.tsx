import { Stack, Text, Title } from "@mantine/core";
import type { FC } from "react";
import { useCompletedTodayCountQuery } from "../api/useCompletedTodayCountQuery";

/** SPECIFICATION.md "Сегодня": "«На сегодня всё» с количеством задач,
 * выполненных за день" — only mounted once the task list is known to be
 * empty, so the completed-count query only ever fires then. */
export const TodayEmptyState: FC = () => {
  const completedTodayCountQuery = useCompletedTodayCountQuery(true);
  const completedCount = completedTodayCountQuery.data?.ok
    ? completedTodayCountQuery.data.count
    : undefined;

  return (
    <Stack align="center" gap={4} py="xl">
      <Title order={3}>All done for today</Title>
      <Text c="dimmed" size="sm">
        {completedCount === undefined
          ? "Nothing due today or overdue."
          : `${completedCount} task${completedCount === 1 ? "" : "s"} completed today.`}
      </Text>
    </Stack>
  );
};
