import { Badge, Group, NavLink, Paper } from "@mantine/core";
import type { FC } from "react";
import { Link, useLocation } from "react-router";
import { getProjectColorHex } from "@/entities/project";
import { ProjectActionsMenu } from "@/features/manage-project";
import type { ProjectDTO } from "@/main/projects";

type SidebarProjectLinkProps = {
  project: ProjectDTO;
};

export const SidebarProjectLink: FC<SidebarProjectLinkProps> = ({
  project,
}) => {
  const location = useLocation();
  const to = `/projects/${project.id}`;

  return (
    <NavLink
      bdrs={0}
      label={project.name}
      leftSection={
        <Paper radius="xl" w={8} h={8} bg={getProjectColorHex(project.color)} />
      }
      rightSection={
        <Group gap={4} wrap="nowrap">
          {project.activeTaskCount > 0 && (
            <Badge variant="light" circle>
              {project.activeTaskCount}
            </Badge>
          )}
          <ProjectActionsMenu project={project} />
        </Group>
      }
      active={location.pathname === to}
      component={Link}
      to={to}
    />
  );
};
