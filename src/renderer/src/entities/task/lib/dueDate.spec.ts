import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDueDisplay } from "./dueDate";

// Fixed "now": 2026-08-05 14:00, matching this session's currentDate context.
const NOW = "2026-08-05T14:00:00.000Z";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getDueDisplay", () => {
  it("is not overdue for a date-only due today", () => {
    const display = getDueDisplay({ date: "2026-08-05", datetime: null });
    expect(display).toMatchObject({ isOverdue: false, isDueToday: true });
  });

  it("is overdue for a date-only due yesterday", () => {
    const display = getDueDisplay({ date: "2026-08-04", datetime: null });
    expect(display).toMatchObject({
      isOverdue: true,
      isDueToday: false,
      daysOverdue: 1,
    });
  });

  it("counts multiple days overdue for a date-only due further in the past", () => {
    const display = getDueDisplay({ date: "2026-08-02", datetime: null });
    expect(display).toMatchObject({ isOverdue: true, daysOverdue: 3 });
  });

  it("is not overdue for a today due with a time later than now", () => {
    const display = getDueDisplay({
      date: "2026-08-05",
      datetime: "2026-08-05T18:00:00.000Z",
    });
    expect(display).toMatchObject({ isOverdue: false, isDueToday: true });
  });

  // The SPEC-defined edge case: due today at a past time is BOTH overdue and
  // "today" at once — this app doesn't dedupe that in getDueDisplay itself.
  it("is both overdue and due today for a today due with a time earlier than now", () => {
    const display = getDueDisplay({
      date: "2026-08-05",
      datetime: "2026-08-05T10:00:00.000Z",
    });
    expect(display).toMatchObject({
      isOverdue: true,
      isDueToday: true,
      daysOverdue: 0,
    });
  });

  it("is not overdue or due today for a date-only due in the future", () => {
    const display = getDueDisplay({ date: "2026-08-10", datetime: null });
    expect(display).toMatchObject({ isOverdue: false, isDueToday: false });
  });
});
