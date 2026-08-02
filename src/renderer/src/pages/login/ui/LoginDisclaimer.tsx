import { Text } from "@mantine/core";
import type { FC } from "react";

export const LoginDisclaimer: FC = () => (
  <Text size="xs" c="dimmed" ta="center" mt="lg">
    Your access token is only used to call the Todoist API from this app. It is
    stored locally on this device (encrypted where the OS supports it) and never
    shared with third parties. To confirm the login, the app fetches your name
    and email from Todoist once.
  </Text>
);
