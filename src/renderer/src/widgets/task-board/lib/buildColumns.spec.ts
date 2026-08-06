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

  it("keeps existing card order when a `previous` map is given, even if `tasks` order changed", () => {
    const first = buildTask("1", "todo");
    const second = buildTask("2", "todo");
    const previous = buildColumns([first, second]);

    // `tasks` now lists them in the opposite order (e.g. a resort elsewhere).
    const columns = buildColumns([second, first], previous);

    expect(columns.get("todo")).toEqual([first, second]);
  });

  it("places a task that changed column at the end of its new column, keeping others in place", () => {
    const first = buildTask("1", "todo");
    const second = buildTask("2", "todo");
    const previous = buildColumns([first, second]);

    const movedSecond = buildTask("2", "in-progress");
    const columns = buildColumns([first, movedSecond], previous);

    expect(columns.get("todo")).toEqual([first]);
    expect(columns.get("in-progress")).toEqual([movedSecond]);
  });

  it("appends a genuinely new task using `tasks` order", () => {
    const first = buildTask("1", "todo");
    const previous = buildColumns([first]);

    const second = buildTask("2", "todo");
    const columns = buildColumns([first, second], previous);

    expect(columns.get("todo")).toEqual([first, second]);
  });
});
