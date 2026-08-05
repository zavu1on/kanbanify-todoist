import { describe, expect, it } from "vitest";
import type { Task } from "@/main/tasks";
import { buildColumns } from "./buildColumns";
import { findContainer } from "./findContainer";

const buildTask = (id: string, level: Task["kanbanStatus"]["level"]): Task =>
  ({ id, kanbanStatus: { level, hasConflict: false } }) as Task;

describe("findContainer", () => {
  it("resolves a column id directly to itself", () => {
    const columns = buildColumns([]);

    expect(findContainer("in-progress", columns)).toBe("in-progress");
  });

  it("resolves a task id to the column that holds it", () => {
    const task = buildTask("task-1", "completed");
    const columns = buildColumns([task]);

    expect(findContainer("task-1", columns)).toBe("completed");
  });

  it("returns undefined for an id present in no column", () => {
    const columns = buildColumns([]);

    expect(findContainer("unknown-id", columns)).toBeUndefined();
  });
});
