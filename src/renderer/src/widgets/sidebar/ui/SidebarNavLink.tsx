import { NavLink } from "@mantine/core";
import {
  type ComponentType,
  type FC,
  type HTMLAttributes,
  type RefAttributes,
  useRef,
} from "react";
import { Link } from "react-router";

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
};

export const SidebarNavLink: FC<SidebarNavLinkProps> = ({
  label,
  icon: Icon,
  to,
}) => {
  const iconRef = useRef<AnimatedIconHandle>(null);

  return (
    <NavLink
      label={label}
      leftSection={<Icon ref={iconRef} size={18} animateOnHover={false} />}
      active={label === "Dashboard"}
      component={Link}
      to={to}
      onClick={to === "#" ? (e) => e.preventDefault() : undefined}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
    />
  );
};
