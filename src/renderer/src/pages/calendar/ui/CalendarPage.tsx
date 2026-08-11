import { Alert, Stack, Title } from "@mantine/core";
import type { DayOfWeek } from "@mantine/schedule";
import { CalendarDaysIcon, ListIcon } from "lucide-animated";
import type { FC } from "react";
import { useState } from "react";
import { useSession } from "@/app/SessionContext";
import {
  flattenTaskPages,
  useLoadMoreTasksHandler,
  useToolbar,
} from "@/entities/task";
import { CalendarAgendaList } from "@/widgets/calendar-agenda-list";
import { CalendarMonthView } from "@/widgets/calendar-month-view";
import { useCalendarTasksQuery } from "../api/useCalendarTasksQuery";
import { calendarTasksListQueryKey } from "../model/queryKeys";
import { loadViewMode, saveViewMode, type ViewMode } from "../model/viewMode";
import { CalendarSkeleton } from "./CalendarSkeleton";

/** Shows every unfinished task with a due date (SPECIFICATION.md "Календарь").
 * The month grid and the list mode are self-contained widgets
 * (`widgets/calendar-month-view`, `widgets/calendar-agenda-list`) — this page
 * only fetches the data and switches between them. */
export const CalendarPage: FC = () => {
  const session = useSession();
  // Falls back to Monday if the session hasn't resolved yet — CalendarPage
  // only ever renders inside the authenticated router, so this is defensive,
  // not a real branch (see `Router.tsx`).
  const weekStartsOn: DayOfWeek =
    session.status === "authenticated"
      ? (session.user.weekStartsOn as DayOfWeek)
      : 1;

  const [viewMode, setViewMode] = useState<ViewMode>(loadViewMode);
  const tasksQuery = useCalendarTasksQuery();
  const handleLoadMore = useLoadMoreTasksHandler(tasksQuery);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    saveViewMode(mode);
  };

  const { tasks, initialLoadError } = flattenTaskPages(tasksQuery);

  const toolbar = useToolbar<ViewMode>({
    viewMode,
    onViewModeChange: handleViewModeChange,
    segments: [
      {
        value: "month",
        label: <CalendarDaysIcon size={16} animateOnHover={false} />,
      },
      { value: "agenda", label: <ListIcon size={16} animateOnHover={false} /> },
    ],
    refetchQueryKeys: [
      calendarTasksListQueryKey,
      ["tasks", "list", "subtasks"],
      ["comments", "list"],
    ],
    isRefetching: tasksQuery.isRefetching || tasksQuery.isLoading,
    onLoadMore: handleLoadMore,
    hasNextPage: tasksQuery.hasNextPage,
    isFetchingNextPage: tasksQuery.isFetchingNextPage,
  });

  return (
    <Stack gap="md">
      <Title order={2}>Calendar</Title>

      {toolbar}

      {tasksQuery.isPending ? (
        <CalendarSkeleton />
      ) : initialLoadError ? (
        <Alert color="red" title="Couldn't load tasks">
          {initialLoadError.message}
        </Alert>
      ) : viewMode === "month" ? (
        <CalendarMonthView
          tasks={tasks}
          queryKey={calendarTasksListQueryKey}
          weekStartsOn={weekStartsOn}
        />
      ) : (
        <CalendarAgendaList
          tasks={tasks}
          queryKey={calendarTasksListQueryKey}
        />
      )}
    </Stack>
  );
};
