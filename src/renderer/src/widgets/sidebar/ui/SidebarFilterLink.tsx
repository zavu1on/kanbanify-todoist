import { NavLink } from "@mantine/core";
import type { FC } from "react";
import { Link, useLocation } from "react-router";
import { FilterActionsMenu } from "@/features/manage-filter";
import type { FilterDTO } from "@/main/filters";

type SidebarFilterLinkProps = {
  filter: FilterDTO;
};

/** Mirrors `SidebarProjectLink` — same `NavLink` + actions-menu shape
 * (filters "визуально отображаются так же, как и проекты"), minus the
 * colored dot (a filter's `color` has no visual meaning here) and the count
 * badge — a filter has no cheap server-side count the way a project's
 * `activeTaskCount` does. */
export const SidebarFilterLink: FC<SidebarFilterLinkProps> = ({ filter }) => {
  const location = useLocation();
  const to = `/filters/${filter.id}`;

  return (
    <NavLink
      bdrs={0}
      label={filter.title}
      rightSection={<FilterActionsMenu filter={filter} />}
      active={location.pathname === to}
      component={Link}
      to={to}
    />
  );
};
