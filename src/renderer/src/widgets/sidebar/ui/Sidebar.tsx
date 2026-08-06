import { AppShell, Divider, Group, Stack, Text } from "@mantine/core";
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
import { useProjectsQuery } from "@/entities/project";
import logo from "@/shared/ui/kanbanify-logo.svg";
import { useTaskCountQuery } from "../api/useTaskCountQuery";
import { type AnimatedIcon, SidebarNavLink } from "./SidebarNavLink";
import { SidebarProjectLink } from "./SidebarProjectLink";
import { SidebarProjectsSkeleton } from "./SidebarProjectsSkeleton";
import { UserCard } from "./UserCard";

type NavItem = { label: string; icon: AnimatedIcon; to: string };

const NAV_ITEMS: NavItem[] = [
  { label: "New task", icon: PlusIcon, to: "#" },
  { label: "Search", icon: SearchIcon, to: "#" },
  { label: "Dashboard", icon: LayoutGridIcon, to: "/" },
  { label: "Tasks", icon: ListIcon, to: "/tasks" },
  { label: "Today", icon: SunIcon, to: "#" },
  { label: "Calendar", icon: CalendarDaysIcon, to: "#" },
];

export const Sidebar: FC = () => {
  const session = useSession();
  const taskCountQuery = useTaskCountQuery();
  const taskCount = taskCountQuery.data?.ok
    ? taskCountQuery.data.count
    : undefined;
  const projectsQuery = useProjectsQuery();
  const projects = projectsQuery.data?.ok ? projectsQuery.data.projects : [];

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
          {NAV_ITEMS.map((item) => (
            <SidebarNavLink
              key={item.label}
              {...item}
              badge={item.label === "Tasks" ? taskCount : undefined}
              isBadgeLoading={
                item.label === "Tasks" && taskCountQuery.isPending
              }
            />
          ))}
        </Stack>

        {projectsQuery.isPending ? (
          <SidebarProjectsSkeleton />
        ) : (
          projects.length > 0 && (
            <>
              <Divider my="sm" />
              <Stack gap={2}>
                {projects.map((project) => (
                  <SidebarProjectLink
                    key={project.id}
                    id={project.id}
                    name={project.name}
                    color={project.color}
                    activeTaskCount={project.activeTaskCount}
                  />
                ))}
              </Stack>
            </>
          )
        )}
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
