import dayjs from "dayjs";
import type { TaskDTO } from "@/main/tasks";
import { dueAfterDrop } from "./dueAfterDrop";

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

describe("dueAfterDrop", () => {
  it("moves a date-only due to the dropped day, staying date-only", () => {
    const task = buildTask({ due: { date: "2026-08-10", datetime: null } });

    expect(dueAfterDrop(task, "2026-08-12 00:00:00")).toEqual({
      date: "2026-08-12",
      datetime: null,
    });
  });

  it("keeps a timed due's time-of-day, moved to the dropped day", () => {
    const task = buildTask({
      due: { date: "2026-08-10", datetime: "2026-08-10T14:00:00.000Z" },
    });

    // @mantine/schedule preserves the original hour/minute/second and only
    // changes the date when an event is dropped on a new day.
    expect(dueAfterDrop(task, "2026-08-12 14:00:00")).toEqual({
      date: "2026-08-12",
      datetime: dayjs("2026-08-12 14:00:00").toISOString(),
    });
  });
});
