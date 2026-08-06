import {
  ActionIcon,
  Divider,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { PlusIcon, RefreshCwIcon } from "lucide-animated";
import type { FC } from "react";
import type { ProjectDTO } from "@/main/projects";
import { SidebarProjectLink } from "./SidebarProjectLink";

type SidebarProjectsSectionProps = {
  projects: ProjectDTO[];
  isRefetching: boolean;
  onRefetch: () => void;
  onAddProject: () => void;
};

export const SidebarProjectsSection: FC<SidebarProjectsSectionProps> = ({
  projects,
  isRefetching,
  onRefetch,
  onAddProject,
}) => (
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
            loading={isRefetching}
            aria-label="Refresh projects"
            onClick={onRefetch}
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
            onClick={onAddProject}
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
);
