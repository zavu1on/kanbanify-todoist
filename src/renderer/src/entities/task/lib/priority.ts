import type { PriorityLevel } from "@/main/tasks";

/** Only priorities above the default get a color marker on the card, per
 * SPECIFICATION.md ("приоритет — цветовой меткой, если он выше обычного") —
 * `p4` is the default and stays unmarked. */
export const PRIORITY_MARKER_COLORS: Partial<Record<PriorityLevel, string>> = {
  p1: "red",
  p2: "orange",
  p3: "yellow",
};
