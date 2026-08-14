import { ListIcon } from "lucide-animated";
import type { FC } from "react";
import { useTaskCountQuery } from "../api/useTaskCountQuery";
import { SidebarNavLink } from "./SidebarNavLink";

export const SidebarTasksNavLink: FC = () => {
  const taskCountQuery = useTaskCountQuery();
  const taskCount = taskCountQuery.data?.ok
    ? taskCountQuery.data.count
    : undefined;

  return (
    <SidebarNavLink
      label="Tasks"
      icon={ListIcon}
      to="/tasks"
      badge={taskCount}
      isBadgeLoading={taskCountQuery.isPending}
    />
  );
};
