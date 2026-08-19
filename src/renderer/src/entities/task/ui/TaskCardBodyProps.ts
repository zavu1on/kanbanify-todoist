import type { ReactNode } from "react";

export type TaskCardVariant = "list" | "board" | "compact";

export type TaskCardBodyProps = {
  checkbox: ReactNode;
  title: string;
  hasMeta: boolean;
  dueMeta: ReactNode;
  projectMeta: ReactNode;
  kanbanPill: ReactNode;
  labelPills: ReactNode;
  hovered: boolean;
};
