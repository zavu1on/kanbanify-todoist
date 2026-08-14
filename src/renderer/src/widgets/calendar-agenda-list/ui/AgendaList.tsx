import { Stack, Text } from "@mantine/core";
import dayjs from "dayjs";
import { type FC, memo } from "react";
import { TaskCard } from "@/entities/task";
import type { TaskDTO } from "@/main/tasks";

type AgendaListProps = {
  groups: [string, TaskDTO[]][];
  onComplete: (taskId: string) => void;
  onCardClick: (taskId: string) => void;
};

// Own `memo`-ed component (not just inline JSX in `CalendarAgendaView`) so
// that `editingTask`/`completing`-driven re-renders of the view (e.g. opening
// the edit modal) don't rebuild `Stack`/`Text`/`TaskCard` elements from
// scratch — only `groups`/the handlers should invalidate this list, not
// unrelated local state.
export const AgendaList: FC<AgendaListProps> = memo(function AgendaList({
  groups,
  onComplete,
  onCardClick,
}) {
  return (
    <Stack gap="lg">
      {groups.map(([date, dayTasks]) => (
        <Stack key={date} gap="xs">
          <Text fw={600} size="sm">
            {dayjs(date).format("dddd, MMMM D")}
          </Text>

          <Stack gap="xs">
            {dayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={onComplete}
                onClick={onCardClick}
              />
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
});
