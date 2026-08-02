import { Image, Stack, Title } from "@mantine/core";
import type { FC } from "react";
import kanbanifyLogo from "@/shared/ui/kanbanify-logo.svg";

export const LoginHeader: FC = () => (
  <Stack align="center" gap={4} mb="lg">
    <Image src={kanbanifyLogo} alt="Kanbanify Todoist logo" w={56} h={56} />
    <Title order={2} ta="center">
      Kanbanify Todoist
    </Title>
  </Stack>
);
