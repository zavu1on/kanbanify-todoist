import { NavLink, Paper } from "@mantine/core";
import type { FC } from "react";
import { Link, useLocation } from "react-router";
import { getProjectColorHex } from "@/entities/project";
import { FilterActionsMenu } from "@/features/manage-filter";
import type { FilterDTO } from "@/main/filters";

type SidebarFilterLinkProps = {
  filter: FilterDTO;
};

/** Mirrors `SidebarProjectLink` — same `NavLink` + colored dot + actions-menu
 * shape (filters "визуально отображаются так же, как и проекты"). No count
 * badge — a filter has no cheap server-side count the
 * way a project's `activeTaskCount` does. */
export const SidebarFilterLink: FC<SidebarFilterLinkProps> = ({ filter }) => {
  const location = useLocation();
  const to = `/filters/${filter.id}`;

  return (
    <NavLink
      bdrs={0}
      label={filter.title}
      leftSection={
        <Paper
          radius="xl"
          w={8}
          h={8}
          mt={1.5}
          bg={getProjectColorHex(filter.color)}
        />
      }
      rightSection={<FilterActionsMenu filter={filter} />}
      active={location.pathname === to}
      component={Link}
      to={to}
    />
  );
};
