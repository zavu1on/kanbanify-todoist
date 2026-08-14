import { useQuery } from "@tanstack/react-query";
import { taskCountQueryKey } from "@/entities/task";
import { getTaskCount } from "./getTaskCount";

export const useTaskCountQuery = () =>
  useQuery({
    queryKey: taskCountQueryKey,
    queryFn: getTaskCount,
  });
