import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { filtersListQueryKey } from "@/entities/filter";
import { projectsListQueryKey } from "@/entities/project";
import type { TaskDTO } from "@/main/tasks";
import { filterTasksListQueryKey } from "../../filter/model/queryKeys";
import { reconcileTaskInLists } from "./reconcileTaskInLists";

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

const seed = () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(filtersListQueryKey, {
    ok: true,
    filters: [{ id: 1, title: "Waiting on", color: "red", query: "@waiting" }],
  });
  queryClient.setQueryData(projectsListQueryKey, { ok: true, projects: [] });

  const queryKey = filterTasksListQueryKey(1);
  queryClient.setQueryData(queryKey, {
    pages: [{ ok: true, tasks: [task], nextCursor: null }],
    pageParams: [null],
  });
  return { queryClient, queryKey };
};

describe("reconcileTaskInLists - filter lists", () => {
  it("drops a task from a cached filter list the instant it stops matching (no waiting for refetch)", async () => {
    const { queryClient, queryKey } = seed();
    const edited: TaskDTO = { ...task, labels: [] };

    await reconcileTaskInLists(queryClient, edited);

    const data = queryClient.getQueryData<{
      pages: { ok: boolean; tasks: TaskDTO[] }[];
    }>(queryKey);
    expect(data?.pages[0].tasks).toEqual([]);
  });

  it("keeps a task in a cached filter list it still matches after an edit", async () => {
    const { queryClient, queryKey } = seed();
    const edited: TaskDTO = { ...task, title: "Renamed" };

    await reconcileTaskInLists(queryClient, edited);

    const data = queryClient.getQueryData<{
      pages: { ok: boolean; tasks: TaskDTO[] }[];
    }>(queryKey);
    expect(data?.pages[0].tasks).toEqual([edited]);
  });

  it("inserts a task into a cached filter list the instant it starts matching", async () => {
    const { queryClient, queryKey } = seed();
    queryClient.setQueryData(queryKey, {
      pages: [{ ok: true, tasks: [], nextCursor: null }],
      pageParams: [null],
    });
    const newlyMatching: TaskDTO = { ...task, id: "2", labels: ["waiting"] };

    await reconcileTaskInLists(queryClient, newlyMatching);

    const data = queryClient.getQueryData<{
      pages: { ok: boolean; tasks: TaskDTO[] }[];
    }>(queryKey);
    expect(data?.pages[0].tasks).toEqual([newlyMatching]);
  });
});

describe("reconcileTaskInLists - insertion order", () => {
  const buildQueryClient = () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(filtersListQueryKey, { ok: true, filters: [] });
    queryClient.setQueryData(projectsListQueryKey, { ok: true, projects: [] });
    return queryClient;
  };

  it("appends a newly qualifying task to the end of a list, not the front", async () => {
    const queryClient = buildQueryClient();
    const queryKey = ["tasks", "list", "project", "p1"];
    const existing: TaskDTO = { ...task, id: "1" };
    queryClient.setQueryData(queryKey, {
      pages: [{ ok: true, tasks: [existing], nextCursor: null }],
      pageParams: [null],
    });
    const created: TaskDTO = { ...task, id: "2" };

    await reconcileTaskInLists(queryClient, created);

    const data = queryClient.getQueryData<{
      pages: { ok: boolean; tasks: TaskDTO[] }[];
    }>(queryKey);
    expect(data?.pages[0].tasks.map((t) => t.id)).toEqual(["1", "2"]);
  });

  it("appends to the end of the last loaded page, not the first, across multiple pages", async () => {
    const queryClient = buildQueryClient();
    const queryKey = ["tasks", "list", "project", "p1"];
    const firstPageTask: TaskDTO = { ...task, id: "1" };
    const secondPageTask: TaskDTO = { ...task, id: "2" };
    queryClient.setQueryData(queryKey, {
      pages: [
        { ok: true, tasks: [firstPageTask], nextCursor: "cursor-1" },
        { ok: true, tasks: [secondPageTask], nextCursor: null },
      ],
      pageParams: [null, "cursor-1"],
    });
    const created: TaskDTO = { ...task, id: "3" };

    await reconcileTaskInLists(queryClient, created);

    const data = queryClient.getQueryData<{
      pages: { ok: boolean; tasks: TaskDTO[] }[];
    }>(queryKey);
    expect(data?.pages[0].tasks.map((t) => t.id)).toEqual(["1"]);
    expect(data?.pages[1].tasks.map((t) => t.id)).toEqual(["2", "3"]);
  });

  it("leaves the list untouched when the last loaded page failed to fetch", async () => {
    const queryClient = buildQueryClient();
    const queryKey = ["tasks", "list", "project", "p1"];
    const firstPageTask: TaskDTO = { ...task, id: "1" };
    queryClient.setQueryData(queryKey, {
      pages: [
        { ok: true, tasks: [firstPageTask], nextCursor: "cursor-1" },
        { ok: false, error: { type: "network_error", message: "offline" } },
      ],
      pageParams: [null, "cursor-1"],
    });
    const created: TaskDTO = { ...task, id: "2" };

    await reconcileTaskInLists(queryClient, created);

    const data = queryClient.getQueryData<{
      pages: { ok: boolean; tasks?: TaskDTO[] }[];
    }>(queryKey);
    expect(data?.pages[0].tasks?.map((t) => t.id)).toEqual(["1"]);
    expect(data?.pages[1]).toEqual({
      ok: false,
      error: { type: "network_error", message: "offline" },
    });
  });
});
