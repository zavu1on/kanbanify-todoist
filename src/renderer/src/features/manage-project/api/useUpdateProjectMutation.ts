import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsListQueryKey } from "@/entities/project";
import type { UpdateProjectRequest } from "@/main/projects";
import { updateProject } from "./updateProject";

export const useUpdateProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProjectRequest }) =>
      updateProject(id, input),
    onSuccess: (result) => {
      if (!result.ok) return;
      queryClient.invalidateQueries({ queryKey: projectsListQueryKey });
    },
  });
};
