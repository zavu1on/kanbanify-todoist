import { Box, Group, Text } from "@mantine/core";
import type { ScheduleEventData } from "@mantine/schedule";
import dayjs from "dayjs";
import type { FC } from "react";
import { PRIORITY_MARKER_COLORS } from "@/entities/task";
import type { TaskEventPayload } from "../model/toScheduleEvents";

type CalendarChipProps = {
  event: ScheduleEventData;
};

// `@mantine/schedule` shrinks event text via a container query once a day's
// event row gets short, regardless of `theme.scale` — rendering the title in
// a `Text` with an explicit size sidesteps that. The event row is a fixed
// ~22px tall, so `lh={1}` keeps the line inside it instead of clipping
// against the pill's padding. Text color is left to inherit `--event-color`
// (set by `ScheduleEvent` from `event.color`/`variant`, see
// `toScheduleEvents.ts`) — only the priority marker and time are this
// component's own addition.
export const CalendarChip: FC<CalendarChipProps> = ({ event }) => {
  const task = (event.payload as TaskEventPayload | undefined)?.task;
  const priorityColor = task && PRIORITY_MARKER_COLORS[task.priority];
  const time = task?.due?.datetime
    ? dayjs(task.due.datetime).format("HH:mm")
    : null;

  return (
    <Group gap={5} wrap="nowrap" style={{ overflow: "hidden" }}>
      {priorityColor && (
        <Box
          w={3}
          h={13}
          bdrs={999}
          bg={priorityColor}
          style={{ flexShrink: 0 }}
        />
      )}
      {time && (
        <Text
          size="xs"
          fw={500}
          c="inherit"
          lh={1}
          style={{ fontVariantNumeric: "tabular-nums", flexShrink: 0 }}
        >
          {time}
        </Text>
      )}
      <Text size="xs" fw={500} c="inherit" lh={1} truncate>
        {event.title}
      </Text>
    </Group>
  );
};
