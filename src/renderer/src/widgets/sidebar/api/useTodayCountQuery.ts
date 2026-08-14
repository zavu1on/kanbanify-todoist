import { useQuery } from "@tanstack/react-query";
import { getTodayCount } from "./getTodayCount";

export const useTodayCountQuery = () =>
  useQuery({
    queryKey: ["tasks", "count", "today"],
    queryFn: getTodayCount,
  });
