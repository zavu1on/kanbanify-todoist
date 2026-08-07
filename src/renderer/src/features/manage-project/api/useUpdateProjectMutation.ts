import { notifications } from "@mantine/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsListQueryKey } from "@/entities/project";
import type { ProjectsListResult, UpdateProjectRequest } from "@/main/projects";
import { getProjectErrorMessage } from "../model/getProjectErrorMessage";
import { updateProject } from "./updateProject";

/** Patches the edited project in place immediately, rolled back on
 * failure/error (see `useChangeTaskStatusMutation` for the same pattern on
 * tasks). The form modal closes as soon as it fires this mutation (see
 * `ProjectFormModal`), so the failure notification lives here, not in the
 * component that triggered the call — success is silent, the optimistic
 * write is the only feedback. */
export const useUpdateProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProjectRequest }) =>
      updateProject(id, input),

    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: projectsListQueryKey });
      const previous =
        queryClient.getQueryData<ProjectsListResult>(projectsListQueryKey);

      queryClient.setQueryData<ProjectsListResult>(
        projectsListQueryKey,
        (data) =>
          data?.ok
            ? {
                ...data,
                projects: data.projects.map((project) =>
                  project.id === id ? { ...project, ...input } : project,
                ),
              }
            : data,
      );

      return { previous };
    },

    onSuccess: (result, _variables, context) => {
      if (!result.ok) {
        if (context?.previous) {
          queryClient.setQueryData(projectsListQueryKey, context.previous);
        }
        notifications.show({
          color: "red",
          title: "Couldn't save project",
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
                  project.id === result.project.id ? result.project : project,
                ),
              }
            : data,
      );
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectsListQueryKey, context.previous);
      }
      notifications.show({
        color: "red",
        title: "Couldn't save project",
        message: "Something went wrong. Please try again.",
      });
    },
  });
};
