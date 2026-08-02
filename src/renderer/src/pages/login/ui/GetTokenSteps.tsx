import { List, Stack, Text } from "@mantine/core";
import type { FC } from "react";

export const GetTokenSteps: FC = () => (
  <Stack gap={4} mb="lg">
    <Text size="sm" fw={500}>
      How to get your access token
    </Text>
    <List size="sm" type="ordered" c="dimmed" spacing={2}>
      <List.Item>Open Todoist</List.Item>
      <List.Item>Click your avatar in the top-left corner</List.Item>
      <List.Item>
        Go to{" "}
        <Text component="span" fw={500} inherit>
          Settings
        </Text>{" "}
        →{" "}
        <Text component="span" fw={500} inherit>
          Integrations
        </Text>{" "}
        →{" "}
        <Text component="span" fw={500} inherit>
          Developer
        </Text>
      </List.Item>
      <List.Item>Click Copy API token</List.Item>
    </List>
  </Stack>
);
