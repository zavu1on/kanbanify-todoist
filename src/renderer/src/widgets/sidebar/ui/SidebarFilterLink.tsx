import { Badge, Group, NavLink, Paper } from "@mantine/core";
import type { FC } from "react";
import { Link, useLocation } from "react-router";
import { getProjectColorHex } from "@/entities/project";
import { FilterActionsMenu } from "@/features/manage-filter";
import type { FilterDTO } from "@/main/filters";

type SidebarFilterLinkProps = {
  filter: FilterDTO;
};

/** Mirrors `SidebarProjectLink` — same `NavLink` + actions-menu + count-badge
 * shape (filters "визуально отображаются так же, как и проекты"). Unlike a
 * project's `activeTaskCount`, a filter's `taskCount` has no cheap
 * server-side field to read — `ListFiltersUseCase` walks every Todoist page
 * matching the filter's query, same as `countActiveTasksInProject` does per
 * project — but the two DTOs end up shaped the same way here regardless. */
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
      rightSection={
        <Group gap={4} wrap="nowrap">
          {filter.taskCount > 0 && (
            <Badge variant="light" circle>
              {filter.taskCount}
            </Badge>
          )}
          <FilterActionsMenu filter={filter} />
        </Group>
      }
      active={location.pathname === to}
      component={Link}
      to={to}
    />
  );
};
