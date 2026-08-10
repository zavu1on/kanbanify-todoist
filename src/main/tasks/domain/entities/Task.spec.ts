import { describe, expect, it } from "vitest";
import { InvalidTaskTitleError } from "../errors/InvalidTaskTitleError";
import { TaskAlreadyCompletedError } from "../errors/TaskAlreadyCompletedError";
import { Priority } from "../value-objects/Priority";
import { Task } from "./Task";

const buildTask = (rawLabels: string[], checked = false) =>
  Task.reconstitute({
    id: "1",
    title: "Write report",
    description: "",
    projectId: "project-1",
    priority: Priority.fromApiValue(4),
    due: null,
    rawLabels,
    checked,
    parentId: null,
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

describe("Task#complete", () => {
  it("marks the task checked without touching kanbanStatus", () => {
    const task = buildTask(["todo"], false);

    task.complete();

    expect(task.checked).toBe(true);
    expect(task.kanbanStatus.level).toBe("todo");
  });

  it("throws TaskAlreadyCompletedError when the task is already checked", () => {
    const task = buildTask(["todo"], true);

    expect(() => task.complete()).toThrow(TaskAlreadyCompletedError);
  });
});

describe("Task.create", () => {
  it("builds a new task with an empty id and the given kanban status applied to labels", () => {
    const task = Task.create({
      title: "Write report",
      description: "Quarterly numbers",
      projectId: "project-1",
      priority: "p1",
      due: { date: "2026-08-10", datetime: null },
      kanbanStatus: "todo",
      labels: ["errand"],
      parentId: null,
    });

    expect(task.id).toBe("");
    expect(task.title).toBe("Write report");
    expect(task.description).toBe("Quarterly numbers");
    expect(task.priority.level).toBe("p1");
    expect(task.due).toEqual({ date: "2026-08-10", datetime: null });
    expect(task.kanbanStatus.level).toBe("todo");
    expect(task.labels).toEqual(["errand"]);
    expect(task.rawLabels).toEqual(["errand", "todo"]);
    expect(task.parentId).toBeNull();
  });

  it("carries the given parentId for a subtask", () => {
    const task = Task.create({
      title: "Sub-step",
      description: "",
      projectId: "project-1",
      priority: "p4",
      due: null,
      kanbanStatus: "none",
      labels: [],
      parentId: "parent-1",
    });

    expect(task.parentId).toBe("parent-1");
  });

  it("strips a reserved label passed in `labels` instead of deriving status from it", () => {
    const task = Task.create({
      title: "Write report",
      description: "",
      projectId: "project-1",
      priority: "p4",
      due: null,
      kanbanStatus: "in-progress",
      labels: ["completed"],
      parentId: null,
    });

    expect(task.labels).toEqual([]);
    expect(task.rawLabels).toEqual(["in-progress"]);
  });

  it("throws InvalidTaskTitleError for an empty title", () => {
    expect(() =>
      Task.create({
        title: "   ",
        description: "",
        projectId: "project-1",
        priority: "p4",
        due: null,
        kanbanStatus: "none",
        labels: [],
        parentId: null,
      }),
    ).toThrow(InvalidTaskTitleError);
  });
});

describe("Task#update", () => {
  it("mutates title, description, priority, due and labels without touching status or project", () => {
    const task = buildTask(["errand", "todo"]);

    task.update({
      title: "Write final report",
      description: "Updated",
      priority: "p2",
      due: { date: "2026-09-01", datetime: "2026-09-01T10:00:00" },
      labels: ["errand", "urgent"],
    });

    expect(task.title).toBe("Write final report");
    expect(task.description).toBe("Updated");
    expect(task.priority.level).toBe("p2");
    expect(task.due).toEqual({
      date: "2026-09-01",
      datetime: "2026-09-01T10:00:00",
    });
    expect(task.labels).toEqual(["errand", "urgent"]);
    expect(task.kanbanStatus.level).toBe("todo");
    expect(task.projectId).toBe("project-1");
  });

  it("throws InvalidTaskTitleError for an empty title", () => {
    const task = buildTask([]);

    expect(() =>
      task.update({
        title: "",
        description: "",
        priority: "p4",
        due: null,
        labels: [],
      }),
    ).toThrow(InvalidTaskTitleError);
  });
});

describe("Task#moveToProject", () => {
  it("updates projectId without touching other fields", () => {
    const task = buildTask(["todo"]);

    task.moveToProject("project-2");

    expect(task.projectId).toBe("project-2");
    expect(task.kanbanStatus.level).toBe("todo");
  });
});
