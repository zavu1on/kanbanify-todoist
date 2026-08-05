import { useQuery } from "@tanstack/react-query";
import { getTaskCount } from "./getTaskCount";

export const useTaskCountQuery = () =>
  useQuery({
    queryKey: ["tasks", "count"],
    queryFn: getTaskCount,
  });
