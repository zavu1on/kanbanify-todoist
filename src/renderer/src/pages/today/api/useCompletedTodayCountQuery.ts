import { useQuery } from "@tanstack/react-query";
import { countCompletedToday } from "./countCompletedToday";

/** Only queried for the "На сегодня всё" empty state (SPECIFICATION.md
 * "Сегодня") — disabled while the task list itself isn't known to be empty,
 * so a normal (non-empty) visit never pays for this extra IPC round trip. */
export const useCompletedTodayCountQuery = (enabled: boolean) =>
  useQuery({
    queryKey: ["tasks", "count", "completedToday"],
    queryFn: countCompletedToday,
    enabled,
  });
