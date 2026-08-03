import { Stack, Text, Title } from "@mantine/core";
import type { FC } from "react";

export const DashboardPage: FC = () => {
  return (
    <Stack gap="xs">
      <Title order={2}>Dashboard Page</Title>
      <Text c="dimmed">This screen is a placeholder — not built yet.</Text>
    </Stack>
  );
};
