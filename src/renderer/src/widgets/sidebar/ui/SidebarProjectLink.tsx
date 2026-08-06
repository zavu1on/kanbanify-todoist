import { Badge, NavLink, Paper } from "@mantine/core";
import type { FC } from "react";
import { Link, useLocation } from "react-router";
import { getProjectColorHex } from "@/entities/project";

type SidebarProjectLinkProps = {
  id: string;
  name: string;
  color: string;
  activeTaskCount: number;
};

export const SidebarProjectLink: FC<SidebarProjectLinkProps> = ({
  id,
  name,
  color,
  activeTaskCount,
}) => {
  const location = useLocation();
  const to = `/projects/${id}`;

  return (
    <NavLink
      label={name}
      leftSection={
        <Paper radius="xl" w={8} h={8} bg={getProjectColorHex(color)} />
      }
      rightSection={
        activeTaskCount > 0 && (
          <Badge variant="light" circle>
            {activeTaskCount}
          </Badge>
        )
      }
      active={location.pathname === to}
      component={Link}
      to={to}
    />
  );
};
