import type { TaskDTO } from "@/main/tasks";
import { toScheduleEvents } from "./toScheduleEvents";

// Fixed "now": 2026-08-05 14:00, matching this session's currentDate context.
const NOW = "2026-08-05T14:00:00.000Z";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
  vi.useRealTimers();
});

const buildTask = (overrides: Partial<TaskDTO>): TaskDTO => ({
  id: "1",
  title: "Write report",
  description: "",
  projectId: "project-1",
  priority: "p4",
  due: null,
  kanbanStatus: { level: "none", hasConflict: false },
  labels: [],
  checked: false,
  parentId: null,
  ...overrides,
});

describe("toScheduleEvents", () => {
  it("drops tasks without a due date", () => {
    const events = toScheduleEvents([buildTask({ due: null })]);
    expect(events).toEqual([]);
  });

  it("uses the due datetime as a zero-length instant when a time is set", () => {
    const task = buildTask({
      due: { date: "2026-08-10", datetime: "2026-08-10T14:00:00.000Z" },
    });

    const [event] = toScheduleEvents([task]);

    expect(event).toMatchObject({
      id: "1",
      title: "Write report",
      start: "2026-08-10T14:00:00.000Z",
      end: "2026-08-10T14:00:00.000Z",
      payload: { task },
    });
  });

  // The package's own all-day convention (see its MonthView docs): end at
  // the *next* day's midnight, not the same day's — an equal start/end both
  // at midnight gets misread as an inverted range and vanishes from the
  // month grid (see `toScheduleEvents`'s doc comment).
  it("encodes a date-only due as a full day: midnight to next midnight", () => {
    const task = buildTask({ due: { date: "2026-08-10", datetime: null } });

    const [event] = toScheduleEvents([task]);

    expect(event).toMatchObject({
      start: "2026-08-10 00:00:00",
      end: "2026-08-11 00:00:00",
    });
  });

  it("colors an overdue task red regardless of status or priority", () => {
    const task = buildTask({
      due: { date: "2026-08-01", datetime: null },
      priority: "p1",
      kanbanStatus: { level: "in-progress", hasConflict: false },
    });

    const [event] = toScheduleEvents([task]);

    expect(event.color).toBe("red");
  });

  it("colors by kanban status when not overdue and a status is set", () => {
    const task = buildTask({
      due: { date: "2026-08-10", datetime: null },
      priority: "p1",
      kanbanStatus: { level: "in-progress", hasConflict: false },
    });

    const [event] = toScheduleEvents([task]);

    expect(event.color).toBe("blue");
  });

  it("falls back to the priority color when there is no status", () => {
    const task = buildTask({
      due: { date: "2026-08-10", datetime: null },
      priority: "p1",
    });

    const [event] = toScheduleEvents([task]);

    expect(event.color).toBe("red");
  });

  it("falls back to gray for a default-priority, unstatused, not-overdue task", () => {
    const task = buildTask({ due: { date: "2026-08-10", datetime: null } });

    const [event] = toScheduleEvents([task]);

    expect(event.color).toBe("gray");
  });
});
