import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { filtersListQueryKey } from "@/entities/filter";
import { projectsListQueryKey } from "@/entities/project";
import type { FiltersListResult } from "@/main/filters";
import type { TaskDTO } from "@/main/tasks";
import { applyFilterTaskCountDelta } from "./applyFilterTaskCountDelta";

const task: TaskDTO = {
  id: "1",
  title: "Task",
  description: "",
  projectId: "p1",
  priority: "p4",
  due: null,
  kanbanStatus: { level: "todo", hasConflict: false },
  labels: ["waiting"],
  checked: false,
  parentId: null,
};

const seedClient = () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(filtersListQueryKey, {
    ok: true,
    filters: [
      {
        id: 1,
        title: "Waiting on",
        color: "red",
        query: "@waiting",
        taskCount: 3,
      },
      { id: 2, title: "Work", color: "blue", query: "#Work", taskCount: 5 },
    ],
  } satisfies FiltersListResult);
  queryClient.setQueryData(projectsListQueryKey, { ok: true, projects: [] });
  return queryClient;
};

describe("applyFilterTaskCountDelta", () => {
  it("increments only the filters a newly-created task matches", () => {
    const queryClient = seedClient();

    applyFilterTaskCountDelta(queryClient, null, task);

    const data =
      queryClient.getQueryData<FiltersListResult>(filtersListQueryKey);
    expect(data?.ok && data.filters.map((f) => f.taskCount)).toEqual([4, 5]);
  });

  it("decrements only the filters a completed/deleted task used to match", () => {
    const queryClient = seedClient();

    applyFilterTaskCountDelta(queryClient, task, null);

    const data =
      queryClient.getQueryData<FiltersListResult>(filtersListQueryKey);
    expect(data?.ok && data.filters.map((f) => f.taskCount)).toEqual([2, 5]);
  });

  it("shifts the count between filters when an edit changes which ones match", () => {
    const queryClient = seedClient();
    const edited: TaskDTO = { ...task, labels: [] };

    applyFilterTaskCountDelta(queryClient, task, edited);

    const data =
      queryClient.getQueryData<FiltersListResult>(filtersListQueryKey);
    expect(data?.ok && data.filters.map((f) => f.taskCount)).toEqual([2, 5]);
  });

  it("leaves counts untouched when membership doesn't change", () => {
    const queryClient = seedClient();
    const renamed: TaskDTO = { ...task, title: "Renamed" };

    applyFilterTaskCountDelta(queryClient, task, renamed);

    const data =
      queryClient.getQueryData<FiltersListResult>(filtersListQueryKey);
    expect(data?.ok && data.filters.map((f) => f.taskCount)).toEqual([3, 5]);
  });
});
