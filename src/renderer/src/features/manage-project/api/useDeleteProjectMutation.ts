import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsListQueryKey } from "@/entities/project";
import { deleteProject } from "./deleteProject";

export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (result) => {
      if (!result.ok) return;
      queryClient.invalidateQueries({ queryKey: projectsListQueryKey });
    },
  });
};
