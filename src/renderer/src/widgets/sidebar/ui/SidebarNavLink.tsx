import { Badge, NavLink, Skeleton } from "@mantine/core";
import {
  type ComponentType,
  type FC,
  type HTMLAttributes,
  type RefAttributes,
  useRef,
} from "react";
import { Link, useLocation } from "react-router";

type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

export type AnimatedIcon = ComponentType<
  HTMLAttributes<HTMLDivElement> &
    RefAttributes<AnimatedIconHandle> & {
      size?: number;
      animateOnHover?: boolean;
    }
>;

type SidebarNavLinkProps = {
  label: string;
  icon: AnimatedIcon;
  to: string;
  badge?: number;
  isBadgeLoading?: boolean;
  // Overrides the "#" placeholder's no-op click — used for items that open a
  // modal instead of navigating (e.g. "New task", see `Sidebar`).
  onClick?: () => void;
};

export const SidebarNavLink: FC<SidebarNavLinkProps> = ({
  label,
  icon: Icon,
  to,
  badge,
  isBadgeLoading,
  onClick,
}) => {
  const iconRef = useRef<AnimatedIconHandle>(null);
  const location = useLocation();

  return (
    <NavLink
      label={label}
      leftSection={<Icon ref={iconRef} size={18} animateOnHover={false} />}
      rightSection={
        isBadgeLoading ? (
          <Skeleton
            height={20}
            width={20}
            circle
            role="status"
            aria-label={`Loading ${label} count`}
          />
        ) : badge === undefined ? undefined : (
          <Badge variant="light" circle>
            {badge}
          </Badge>
        )
      }
      active={location.pathname === to}
      component={Link}
      to={to}
      onClick={
        to === "#"
          ? (e) => {
              e.preventDefault();
              onClick?.();
            }
          : undefined
      }
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
    />
  );
};
