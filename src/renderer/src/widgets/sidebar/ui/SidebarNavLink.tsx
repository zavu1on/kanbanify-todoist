import { Badge, NavLink, Skeleton, Text } from "@mantine/core";
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
  // Red-tinted pill instead of the default plain tabular-nums count — used
  // where the number itself signals urgency (Today's today-or-overdue
  // count).
  badgeColor?: "red";
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
  badgeColor,
  onClick,
}) => {
  const iconRef = useRef<AnimatedIconHandle>(null);
  const location = useLocation();

  return (
    <NavLink
      h={38}
      bdrs={0}
      label={label}
      leftSection={
        // `lucide-animated` icons render a plain <div> wrapping an inline
        // <svg>; without `display: flex` the wrapper's height follows the
        // font's line-height metrics (not the SVG's intrinsic size), which
        // differ enough between OSes that Windows renders the icon flush to
        // the top of the row instead of centered.
        <Icon
          ref={iconRef}
          size={18}
          animateOnHover={false}
          style={{ display: "flex" }}
        />
      }
      rightSection={
        isBadgeLoading ? (
          <Skeleton
            height={20}
            width={20}
            circle
            role="status"
            aria-label={`Loading ${label} count`}
          />
        ) : badge === undefined ? undefined : badgeColor ? (
          <Badge variant="light" color={badgeColor} circle>
            {badge}
          </Badge>
        ) : (
          <Text
            size="xs"
            c="dimmed"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {badge}
          </Text>
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
