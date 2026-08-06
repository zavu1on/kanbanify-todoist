import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsListQueryKey } from "@/entities/project";
import { archiveProject } from "./archiveProject";

export const useArchiveProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveProject,
    onSuccess: (result) => {
      if (!result.ok) return;
      queryClient.invalidateQueries({ queryKey: projectsListQueryKey });
    },
  });
};
