import { describe, expect, it } from "vitest";
import type { Task } from "@/main/tasks";
import { buildColumns } from "./buildColumns";

const buildTask = (id: string, level: Task["kanbanStatus"]["level"]): Task =>
  ({ id, kanbanStatus: { level, hasConflict: false } }) as Task;

describe("buildColumns", () => {
  it("creates one entry per kanban status, even when empty", () => {
    const columns = buildColumns([]);

    expect([...columns.keys()]).toEqual([
      "none",
      "todo",
      "in-progress",
      "completed",
    ]);
    expect(columns.get("todo")).toEqual([]);
  });

  it("groups tasks under their resolved kanban status", () => {
    const todoTask = buildTask("1", "todo");
    const inProgressTask = buildTask("2", "in-progress");
    const anotherTodoTask = buildTask("3", "todo");

    const columns = buildColumns([todoTask, inProgressTask, anotherTodoTask]);

    expect(columns.get("todo")).toEqual([todoTask, anotherTodoTask]);
    expect(columns.get("in-progress")).toEqual([inProgressTask]);
    expect(columns.get("completed")).toEqual([]);
  });
});
