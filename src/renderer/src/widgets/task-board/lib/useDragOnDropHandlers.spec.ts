import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "@/main/tasks";
import { useDragOnDropHandlers } from "./useDragOnDropHandlers";

const mutate = vi.fn();
vi.mock("@/features/change-task-status", () => ({
  useChangeTaskStatusMutation: () => ({ mutate }),
}));

const buildTask = (id: string, level: Task["kanbanStatus"]["level"]): Task =>
  ({ id, kanbanStatus: { level, hasConflict: false } }) as Task;

describe("useDragOnDropHandlers", () => {
  beforeEach(() => {
    mutate.mockClear();
  });

  it("tracks the dragged task on drag start", () => {
    const todoTask = buildTask("1", "todo");
    const tasks = [todoTask];
    const { result } = renderHook(() => useDragOnDropHandlers(tasks));

    act(() => {
      result.current.handleDragStart({ active: { id: "1" } } as never);
    });

    expect(result.current.activeTask).toBe(todoTask);
  });

  it("moves the drag preview into the hovered column, but not back into its own origin", () => {
    const todoTask = buildTask("1", "todo");
    const tasks = [todoTask];
    const { result } = renderHook(() => useDragOnDropHandlers(tasks));

    act(() => {
      result.current.handleDragStart({ active: { id: "1" } } as never);
    });
    act(() => {
      result.current.handleDragOver({
        active: { id: "1" },
        over: { id: "in-progress" },
      } as never);
    });

    expect(result.current.columns.get("todo")).toEqual([]);
    expect(result.current.columns.get("in-progress")).toEqual([todoTask]);
    expect(result.current.dropTargetStatus).toBe("in-progress");

    act(() => {
      result.current.handleDragOver({
        active: { id: "1" },
        over: { id: "todo" },
      } as never);
    });

    // Card moved back over its own starting column: no longer a genuine drop target.
    expect(result.current.dropTargetStatus).toBeNull();
  });

  it("commits a status change mutation when dropped on a different column", () => {
    const todoTask = buildTask("1", "todo");
    const tasks = [todoTask];
    const { result } = renderHook(() => useDragOnDropHandlers(tasks));

    act(() => {
      result.current.handleDragEnd({
        active: { id: "1" },
        over: { id: "in-progress" },
      } as never);
    });

    expect(mutate).toHaveBeenCalledWith({
      taskId: "1",
      status: "in-progress",
    });
    expect(result.current.activeTask).toBeNull();
  });

  it("does not mutate when dropped back on its own column", () => {
    const todoTask = buildTask("1", "todo");
    const tasks = [todoTask];
    const { result } = renderHook(() => useDragOnDropHandlers(tasks));

    act(() => {
      result.current.handleDragEnd({
        active: { id: "1" },
        over: { id: "todo" },
      } as never);
    });

    expect(mutate).not.toHaveBeenCalled();
  });

  it("does not mutate when dropped outside any droppable", () => {
    const todoTask = buildTask("1", "todo");
    const tasks = [todoTask];
    const { result } = renderHook(() => useDragOnDropHandlers(tasks));

    act(() => {
      result.current.handleDragEnd({
        active: { id: "1" },
        over: null,
      } as never);
    });

    expect(mutate).not.toHaveBeenCalled();
  });

  it("restores the original columns on drag cancel", () => {
    const todoTask = buildTask("1", "todo");
    const tasks = [todoTask];
    const { result } = renderHook(() => useDragOnDropHandlers(tasks));

    act(() => {
      result.current.handleDragStart({ active: { id: "1" } } as never);
    });
    act(() => {
      result.current.handleDragOver({
        active: { id: "1" },
        over: { id: "in-progress" },
      } as never);
    });
    act(() => {
      result.current.handleDragCancel();
    });

    expect(result.current.activeTask).toBeNull();
    expect(result.current.columns.get("todo")).toEqual([todoTask]);
    expect(result.current.columns.get("in-progress")).toEqual([]);
  });
});
