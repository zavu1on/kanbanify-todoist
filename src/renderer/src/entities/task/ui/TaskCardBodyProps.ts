import type { ReactNode } from "react";

export type TaskCardBodyProps = {
  checkbox: ReactNode;
  priorityDot: ReactNode;
  title: string;
  hasMeta: boolean;
  metaBadges: ReactNode;
};
