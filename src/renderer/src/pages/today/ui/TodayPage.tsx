import { Stack, Title } from "@mantine/core";
import type { FC } from "react";
import { TodayPageContent } from "./TodayPageContent";

/** SPECIFICATION.md "Сегодня": "Страница повторяет Задачи ... но ограничена
 * задачами, срок которых наступил". */
export const TodayPage: FC = () => (
  <Stack gap="md">
    <Title order={2}>Today</Title>
    <TodayPageContent />
  </Stack>
);
