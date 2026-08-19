import { SunIcon } from "lucide-animated";
import type { FC } from "react";
import { useTodayCountQuery } from "../api/useTodayCountQuery";
import { SidebarNavLink } from "./SidebarNavLink";

export const SidebarTodayNavLink: FC = () => {
  const todayCountQuery = useTodayCountQuery();
  const todayCount = todayCountQuery.data?.ok
    ? todayCountQuery.data.count
    : undefined;

  return (
    <SidebarNavLink
      label="Today"
      icon={SunIcon}
      to="/today"
      badge={todayCount}
      badgeColor="red"
      isBadgeLoading={todayCountQuery.isPending}
    />
  );
};
