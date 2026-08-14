import { AppShell, Group, Stack, Text } from "@mantine/core";
import { CalendarDaysIcon, SunIcon } from "lucide-animated";
import { type FC, memo } from "react";
import { useSession } from "@/app/SessionContext";
import logo from "@/shared/ui/kanbanify-logo.svg";
import { SidebarNavLink } from "./SidebarNavLink";
import { SidebarNewTaskNavLink } from "./SidebarNewTaskNavLink";
import { SidebarProjects } from "./SidebarProjects";
import { SidebarTasksNavLink } from "./SidebarTasksNavLink";
import { UserCard } from "./UserCard";

// Memoized: `AppLayout` re-renders on every route change (its `Outlet`
// child swaps), and without this the whole sidebar — nav list, task count
// badge, projects list — would re-render (and visibly flicker) on every
// navigation even though none of its own data changed. Sidebar takes no
// props, so this bails out on every parent re-render except the ones driven
// by its own `useSession()` call.
export const Sidebar: FC = memo(() => {
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

      <AppShell.Section grow py="sm" style={{ overflowY: "auto" }}>
        <Stack gap={2}>
          <SidebarNewTaskNavLink />
          <SidebarTasksNavLink />
          <SidebarNavLink label="Today" icon={SunIcon} to="#" />
          <SidebarNavLink
            label="Calendar"
            icon={CalendarDaysIcon}
            to="/calendar"
          />
        </Stack>

        <SidebarProjects />
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
});
