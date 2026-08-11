import { Text } from "@mantine/core";
import type { ScheduleEventData } from "@mantine/schedule";
import type { FC } from "react";

type CalendarChipProps = {
  event: ScheduleEventData;
};

export const CalendarChip: FC<CalendarChipProps> = ({ event }) => (
  <Text size="xs" fw={500} lh={1} truncate>
    {event.title}
  </Text>
);
