import { AppShell, Group, Stack, Text } from "@mantine/core";
import {
  CalendarDaysIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
} from "lucide-animated";
import type { FC } from "react";
import { useSession } from "@/app/SessionContext";
import logo from "@/shared/ui/kanbanify-logo.svg";
import { type AnimatedIcon, SidebarNavLink } from "./SidebarNavLink";
import { UserCard } from "./UserCard";

type NavItem = { label: string; icon: AnimatedIcon; to: string };

const NAV_ITEMS: NavItem[] = [
  { label: "New task", icon: PlusIcon, to: "#" },
  { label: "Search", icon: SearchIcon, to: "#" },
  { label: "Dashboard", icon: LayoutGridIcon, to: "/" },
  { label: "Tasks", icon: ListIcon, to: "#" },
  { label: "Today", icon: SunIcon, to: "#" },
  { label: "Calendar", icon: CalendarDaysIcon, to: "#" },
];

export const Sidebar: FC = () => {
  const session = useSession();

  return (
    <AppShell.Navbar>
      <AppShell.Section p="md">
        <Group gap="xs">
          <img src={logo} alt="" width={28} height={28} />
          <Text fw={700} size="lg">
            Kanbanify Todoist
          </Text>
        </Group>
      </AppShell.Section>

      <AppShell.Section grow p="sm">
        <Stack gap={2}>
          {NAV_ITEMS.map((item) => (
            <SidebarNavLink key={item.label} {...item} />
          ))}
        </Stack>
      </AppShell.Section>

      <AppShell.Section p="sm">
        {session.status === "authenticated" && (
          <UserCard
            fullName={session.user.fullName}
            email={session.user.email}
            avatarUrl={session.user.avatarUrl}
          />
        )}
      </AppShell.Section>
    </AppShell.Navbar>
  );
};
