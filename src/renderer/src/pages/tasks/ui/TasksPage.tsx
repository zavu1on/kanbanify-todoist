import { Stack, Text, Title } from "@mantine/core";
import type { FC } from "react";
import { useParams } from "react-router";
import { useProjectQuery } from "@/entities/project";
import { TasksPageContent } from "./TasksPageContent";

/** Renders both the all-tasks "Tasks" screen (`/tasks`) and a project's page
 * (`/projects/:projectId`) — SPECIFICATION.md "Сайдбар": a project page
 * "полностью повторяет страницу Задачи", just scoped to one project. */
export const TasksPage: FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const projectQuery = useProjectQuery(projectId);
  const project = projectQuery.data?.ok ? projectQuery.data.project : undefined;

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
