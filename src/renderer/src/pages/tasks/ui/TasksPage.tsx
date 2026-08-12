import { Stack, Text, Title } from "@mantine/core";
import type { FC } from "react";
import { useParams } from "react-router";
import { useProjectsQuery } from "@/entities/project";
import { TasksPageContent } from "./TasksPageContent";

/** Renders both the all-tasks "Tasks" screen (`/tasks`) and a project's page
 * (`/projects/:projectId`) — SPECIFICATION.md "Сайдбар": a project page
 * "полностью повторяет страницу Задачи", just scoped to one project. */
export const TasksPage: FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const projectsQuery = useProjectsQuery();
  const project =
    projectId && projectsQuery.data?.ok
      ? projectsQuery.data.projects.find((p) => p.id === projectId)
      : undefined;

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Title order={2}>
          {projectId ? (project?.name ?? "Project") : "Tasks"}
        </Title>
        {projectId && project?.description && (
          <Text size="sm" c="dimmed">
            {project.description}
          </Text>
        )}
      </Stack>

      <TasksPageContent projectId={projectId} />
    </Stack>
  );
};
