import type { PriorityLevel } from "@/main/tasks";

/** Only priorities above the default get a color marker on the card, per
 * SPECIFICATION.md ("приоритет — цветовой меткой, если он выше обычного") —
 * `p4` is the default and stays unmarked. */
export const PRIORITY_MARKER_COLORS: Partial<Record<PriorityLevel, string>> = {
  p1: "#e5484d",
  p2: "#ef8c43",
  p3: "#e0b341",
};
