import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsListQueryKey } from "@/entities/project";
import { createProject } from "./createProject";

export const useCreateProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: (result) => {
      if (!result.ok) return;
      queryClient.invalidateQueries({ queryKey: projectsListQueryKey });
    },
  });
};
