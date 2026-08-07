import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsListQueryKey } from "@/entities/project";
import type { ProjectDTO, ProjectsListResult } from "@/main/projects";
import { getProjectErrorMessage } from "../model/getProjectErrorMessage";
import { createProject } from "./createProject";

/** Adds the new project to the sidebar immediately, under a temporary id —
 * replaced with the real one on success, or rolled back on failure/error
 * (see `useChangeTaskStatusMutation` for the same pattern on tasks). The
 * form modal closes as soon as it fires this mutation (see
 * `ProjectFormModal`), so the failure notification lives here, not in the
 * component that triggered the call — success is silent, the optimistic
 * write is the only feedback. */
export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: projectsListQueryKey });
      const previous =
        queryClient.getQueryData<ProjectsListResult>(projectsListQueryKey);
      const tempId = `temp-${crypto.randomUUID()}`;

      queryClient.setQueryData<ProjectsListResult>(
        projectsListQueryKey,
        (data) =>
          data?.ok
            ? {
                ...data,
                projects: [
                  ...data.projects,
                  {
                    id: tempId,
                    name: input.name,
                    description: input.description,
                    color: input.color,
                    parentId: input.parentId,
                    isInboxProject: false,
                    isArchived: false,
                    activeTaskCount: 0,
                  } satisfies ProjectDTO,
                ],
              }
            : data,
      );

      return { previous, tempId };
    },

    onSuccess: (result, _input, context) => {
      if (!result.ok) {
        if (context?.previous) {
          queryClient.setQueryData(projectsListQueryKey, context.previous);
        }
        notifications.show({
          color: "red",
          title: "Couldn't add project",
          message: getProjectErrorMessage(result.error.type),
        });
        return;
      }

      queryClient.setQueryData<ProjectsListResult>(
        projectsListQueryKey,
        (data) =>
          data?.ok
            ? {
                ...data,
                projects: data.projects.map((project) =>
                  project.id === context.tempId ? result.project : project,
                ),
              }
            : data,
      );
    },

    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectsListQueryKey, context.previous);
      }
      notifications.show({
        color: "red",
        title: "Couldn't add project",
        message: "Something went wrong. Please try again.",
      });
    },
  });
};
