import type { QueryKey } from "@tanstack/react-query";
import { useLocation, useParams } from "react-router";
import {
  calendarTasksListQueryKey,
  projectTasksListQueryKey,
  tasksListQueryKey,
  todayTasksListQueryKey,
} from "@/entities/task";

/** The list cache visible on whatever page the sidebar is currently
 * rendered on top of (`Router.tsx`'s routes), so the sidebar's own "New
 * task" button can write its optimistic insert into the cache actually on
 * screen instead of always the unscoped "Tasks" list — mirrors the
 * `queryKey` every in-page "Add task" button already gets from its
 * surrounding page. */
export const useActiveTasksListQueryKey = (): QueryKey => {
  const location = useLocation();
  const { projectId } = useParams<{ projectId?: string }>();

  if (location.pathname === "/today") return todayTasksListQueryKey;
  if (location.pathname === "/calendar") return calendarTasksListQueryKey;
  if (projectId) return projectTasksListQueryKey(projectId);
  return tasksListQueryKey;
};
