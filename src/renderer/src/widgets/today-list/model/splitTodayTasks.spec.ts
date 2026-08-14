import dayjs from "dayjs";
import type { TaskDTO } from "@/main/tasks";
import { splitTodayTasks } from "./splitTodayTasks";

const buildTask = (id: string, due: TaskDTO["due"]): TaskDTO => ({
  id,
  title: `task-${id}`,
  description: "",
  projectId: "project-1",
  priority: "p4",
  due,
  kanbanStatus: { level: "none", hasConflict: false },
  labels: [],
  checked: false,
  parentId: null,
});

describe("splitTodayTasks", () => {
  it("puts a past-due task in overdue", () => {
    const task = buildTask("1", {
      date: dayjs().subtract(2, "day").format("YYYY-MM-DD"),
      datetime: null,
    });

    expect(splitTodayTasks([task])).toEqual({ overdue: [task], today: [] });
  });

  it("puts a plain today-dated task in today", () => {
    const task = buildTask("1", {
      date: dayjs().format("YYYY-MM-DD"),
      datetime: null,
    });

    expect(splitTodayTasks([task])).toEqual({ overdue: [], today: [task] });
  });

  it("puts a today-dated task with an already-past time in overdue, not both", () => {
    const task = buildTask("1", {
      date: dayjs().format("YYYY-MM-DD"),
      datetime: dayjs().subtract(1, "hour").toISOString(),
    });

    expect(splitTodayTasks([task])).toEqual({ overdue: [task], today: [] });
  });
});
