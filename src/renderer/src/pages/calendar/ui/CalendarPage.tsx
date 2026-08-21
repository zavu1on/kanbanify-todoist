import { Alert, Stack, Title } from "@mantine/core";
import type { DayOfWeek } from "@mantine/schedule";
import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { useSession } from "@/app/SessionContext";
import {
  calendarTasksListQueryKey,
  flattenTaskPages,
  useLoadMoreTasksHandler,
} from "@/entities/task";
import { CalendarAgendaView } from "@/widgets/calendar-agenda-list";
import { CalendarMonthView } from "@/widgets/calendar-month-view";
import { useCalendarTasksQuery } from "../api/useCalendarTasksQuery";
import { loadViewMode, saveViewMode, type ViewMode } from "../model/viewMode";
import { CalendarPageToolbar } from "./CalendarPageToolbar";
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

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    saveViewMode(mode);
  }, []);

  // `flattenTaskPages` rebuilds the array via `flatMap` on every call, which
  // would hand `CalendarMonthView`/`CalendarAgendaView` a "new" `tasks`
  // reference on every render regardless of whether the data actually
  // changed — memoized on `tasksQuery.data` (kept referentially stable by
  // TanStack Query's structural sharing when a refetch returns the same
  // content) so their own memoization downstream can actually bail out.
  const { tasks, initialLoadError } = useMemo(
    () => flattenTaskPages(tasksQuery),
    [tasksQuery.data],
  );

  return (
    <Stack gap="md">
      <Title order={2}>Calendar</Title>

      <CalendarPageToolbar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        queryKey={calendarTasksListQueryKey}
        isRefetching={tasksQuery.isRefetching || tasksQuery.isLoading}
        onLoadMore={handleLoadMore}
        hasNextPage={tasksQuery.hasNextPage}
        isFetchingNextPage={tasksQuery.isFetchingNextPage}
      />

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
        <CalendarAgendaView
          tasks={tasks}
          queryKey={calendarTasksListQueryKey}
        />
      )}
    </Stack>
  );
};
