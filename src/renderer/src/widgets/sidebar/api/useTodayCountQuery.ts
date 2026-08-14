import { useQuery } from "@tanstack/react-query";
import { todayCountQueryKey } from "@/entities/task";
import { getTodayCount } from "./getTodayCount";

export const useTodayCountQuery = () =>
  useQuery({
    queryKey: todayCountQueryKey,
    queryFn: getTodayCount,
  });
