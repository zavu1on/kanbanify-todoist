import {
  ActionIcon,
  AppShell,
  Divider,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  CalendarDaysIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SunIcon,
} from "lucide-animated";
import type { FC } from "react";
import { useSession } from "@/app/SessionContext";
import { useProjectsQuery } from "@/entities/project";
import { ProjectFormModal } from "@/features/manage-project";
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
  const [isAddProjectOpen, { open: openAddProject, close: closeAddProject }] =
    useDisclosure(false);
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
          <>
            <Divider my="sm" />
            <Group justify="space-between" px="md" mb={4}>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                Projects
              </Text>
              <Group gap={4}>
                <Tooltip label="Refresh projects">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    loading={projectsQuery.isRefetching}
                    aria-label="Refresh projects"
                    onClick={() => projectsQuery.refetch()}
                  >
                    <RefreshCwIcon size={14} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Add project">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    aria-label="Add project"
                    onClick={openAddProject}
                  >
                    <PlusIcon size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
            <Stack gap={2}>
              {projects.map((project) => (
                <SidebarProjectLink key={project.id} project={project} />
              ))}
            </Stack>
          </>
        )}
      </AppShell.Section>

      {/* Mounted only while open — a fresh instance each time means the form
          always starts blank (see `ProjectActionsMenu`'s edit modal). */}
      {isAddProjectOpen && (
        <ProjectFormModal opened={isAddProjectOpen} onClose={closeAddProject} />
      )}

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
