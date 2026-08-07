import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsListQueryKey } from "@/entities/project";
import type { ProjectsListResult } from "@/main/projects";
import { deleteProject } from "./deleteProject";

/** Removes the project from the sidebar immediately, put back on
 * failure/error (see `useChangeTaskStatusMutation` for the same pattern on
 * tasks). */
export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: projectsListQueryKey });
      const previous =
        queryClient.getQueryData<ProjectsListResult>(projectsListQueryKey);

      queryClient.setQueryData<ProjectsListResult>(
        projectsListQueryKey,
        (data) =>
          data?.ok
            ? {
                ...data,
                projects: data.projects.filter((project) => project.id !== id),
              }
            : data,
      );

      return { previous };
    },

    onSuccess: (result, _id, context) => {
      if (!result.ok && context?.previous) {
        queryClient.setQueryData(projectsListQueryKey, context.previous);
      }
    },

    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectsListQueryKey, context.previous);
      }
    },
  });
};
