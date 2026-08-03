import {
  Avatar,
  Button,
  Group,
  Menu,
  Modal,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import type { FC } from "react";
import { useState } from "react";
import { useSession } from "@/app/SessionContext";

type UserCardProps = {
  fullName: string;
  email: string;
  avatarUrl: string | null;
};

export const UserCard: FC<UserCardProps> = ({ fullName, email, avatarUrl }) => {
  const { logout } = useSession();
  const [isConfirmOpen, { open: openConfirm, close: closeConfirm }] =
    useDisclosure(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      closeConfirm();
    } catch {
      notifications.show({
        color: "red",
        title: "Log out failed",
        message: "Could not clear the stored access token. Please try again.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <Menu position="top-start" width={220} withArrow>
        <Menu.Target>
          <UnstyledButton
            p="xs"
            w="100%"
            style={{ borderRadius: "var(--mantine-radius-sm)" }}
          >
            <Group gap="sm" wrap="nowrap">
              <Avatar src={avatarUrl} name={fullName} color="initials" />
              <Stack gap={0} style={{ minWidth: 0 }}>
                <Text size="sm" fw={500} truncate>
                  {fullName}
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  {email}
                </Text>
              </Stack>
            </Group>
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item color="red" onClick={openConfirm}>
            Log out
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Modal opened={isConfirmOpen} onClose={closeConfirm} title="Log out?">
        <Stack gap="md">
          <Text size="sm">
            You will need to paste your Todoist access token again to sign back
            in.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeConfirm}>
              Cancel
            </Button>
            <Button color="red" loading={isLoggingOut} onClick={handleLogout}>
              Log out
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
