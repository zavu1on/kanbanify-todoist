export const PRIORITY_LEVELS = ["p1", "p2", "p3", "p4"] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

/**
 * Todoist's API numbers priority 1 (lowest) to 4 (highest), the exact opposite
 * of the interface labels this app shows (`p1` highest, `p4` — the default —
 * lowest). Every read/write of priority must go through this mapping, never
 * compare the raw API number directly, since `priority === 4` reads as "highest"
 * but means `p1`.
 */
export class Priority {
  private constructor(readonly level: PriorityLevel) {}

  static fromApiValue(apiValue: number): Priority {
    const index = PRIORITY_LEVELS.length - apiValue;
    return new Priority(PRIORITY_LEVELS[index] ?? "p4");
  }

  /** Trusted constructor from an already-validated interface-facing level
   * (form input) — the counterpart of `fromApiValue` for the write direction. */
  static of(level: PriorityLevel): Priority {
    return new Priority(level);
  }

  /** Inverts back to Todoist's API numbering — see this class's doc comment;
   * every write of priority must go through this, never hardcode the number. */
  toApiValue(): number {
    return PRIORITY_LEVELS.length - PRIORITY_LEVELS.indexOf(this.level);
  }
}
