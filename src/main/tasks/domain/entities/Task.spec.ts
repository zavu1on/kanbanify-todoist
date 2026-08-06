import { describe, expect, it } from "vitest";
import { Priority } from "../value-objects/Priority";
import { Task } from "./Task";

const buildTask = (rawLabels: string[]) =>
  Task.reconstitute({
    id: "1",
    title: "Write report",
    projectId: "project-1",
    priority: Priority.fromApiValue(4),
    due: null,
    rawLabels,
  });

describe("Task.reconstitute", () => {
  it("resolves no status and keeps ordinary labels when no reserved label is present", () => {
    const task = buildTask(["errand"]);

    expect(task.kanbanStatus.level).toBe("none");
    expect(task.kanbanStatus.hasConflict).toBe(false);
    expect(task.labels).toEqual(["errand"]);
  });

  it("resolves the single reserved label as status and strips it from labels", () => {
    const task = buildTask(["errand", "in-progress"]);

    expect(task.kanbanStatus.level).toBe("in-progress");
    expect(task.kanbanStatus.hasConflict).toBe(false);
    expect(task.labels).toEqual(["errand"]);
  });

  it("picks the rightmost column and flags a conflict when several reserved labels are present", () => {
    const task = buildTask(["todo", "completed", "in-progress"]);

    expect(task.kanbanStatus.level).toBe("completed");
    expect(task.kanbanStatus.hasConflict).toBe(true);
    expect(task.labels).toEqual([]);
  });
});

describe("Task#changeStatus", () => {
  it("updates kanbanStatus and clears any prior conflict", () => {
    const task = buildTask(["todo", "in-progress"]);

    task.changeStatus("completed");

    expect(task.kanbanStatus.level).toBe("completed");
    expect(task.kanbanStatus.hasConflict).toBe(false);
  });

  it("reflects the new status in rawLabels, dropping the previous reserved label", () => {
    const task = buildTask(["errand", "todo"]);

    task.changeStatus("completed");

    expect(task.rawLabels).toEqual(["errand", "completed"]);
  });

  it("drops the reserved label from rawLabels entirely when moved to none", () => {
    const task = buildTask(["errand", "in-progress"]);

    task.changeStatus("none");

    expect(task.rawLabels).toEqual(["errand"]);
  });
});
