import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { projectsListQueryKey } from "@/entities/project";
import { taskCountQueryKey, todayCountQueryKey } from "@/entities/task";
import type { TaskDTO, TasksListResult, UpdateTaskRequest } from "@/main/tasks";
import { useUpdateTaskMutation } from "./useUpdateTaskMutation";

const buildWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const buildQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const buildTask = (overrides: Partial<TaskDTO> = {}): TaskDTO =>
  ({
    id: "1",
    title: "Task",
    description: "",
    projectId: "project-a",
    priority: "p4",
    due: { date: dayjs().format("YYYY-MM-DD"), datetime: null },
    kanbanStatus: { level: "none", hasConflict: false },
    labels: [],
    ...overrides,
  }) as TaskDTO;

const seedList = (
  queryClient: QueryClient,
  queryKey: unknown[],
  tasks: TaskDTO[],
) => {
  const page: TasksListResult = { ok: true, tasks, nextCursor: null };
  queryClient.setQueryData(queryKey, {
    pages: [page],
    pageParams: [null],
  });
};

const buildInput = (
  overrides: Partial<UpdateTaskRequest>,
): UpdateTaskRequest => ({
  title: "Task",
  description: "",
  projectId: "project-a",
  priority: "p4",
  due: { date: dayjs().format("YYYY-MM-DD"), datetime: null },
  kanbanStatus: "none",
  labels: [],
  ...overrides,
});

describe("useUpdateTaskMutation", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: { tasks: { update: vi.fn(() => new Promise(() => {})) } },
    });
  });

  it("drops the card from the Today list as soon as its due date moves past today", async () => {
    const queryKey = ["tasks", "list", "today"];
    const queryClient = buildQueryClient();
    const task = buildTask();
    seedList(queryClient, queryKey, [task]);

    const { result } = renderHook(() => useUpdateTaskMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        taskId: "1",
        task,
        input: buildInput({
          due: {
            date: dayjs().add(3, "day").format("YYYY-MM-DD"),
            datetime: null,
          },
        }),
      });
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    const data = queryClient.getQueryData<{ pages: TasksListResult[] }>(
      queryKey,
    );
    const page = data?.pages[0];
    expect(page?.ok && page.tasks).toEqual([]);
  });

  it("drops the card from a project list as soon as it's moved to another project", async () => {
    const queryKey = ["tasks", "list", "project", "project-a"];
    const queryClient = buildQueryClient();
    const task = buildTask({ projectId: "project-a" });
    seedList(queryClient, queryKey, [task]);

    const { result } = renderHook(() => useUpdateTaskMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        taskId: "1",
        task,
        input: buildInput({ projectId: "project-b" }),
      });
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    const data = queryClient.getQueryData<{ pages: TasksListResult[] }>(
      queryKey,
    );
    const page = data?.pages[0];
    expect(page?.ok && page.tasks).toEqual([]);
  });

  it("keeps the card patched in place on the unscoped Tasks list", async () => {
    const queryKey = ["tasks", "list"];
    const queryClient = buildQueryClient();
    const task = buildTask({ projectId: "project-a" });
    seedList(queryClient, queryKey, [task]);

    const { result } = renderHook(() => useUpdateTaskMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        taskId: "1",
        task,
        input: buildInput({ projectId: "project-b" }),
      });
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    const data = queryClient.getQueryData<{ pages: TasksListResult[] }>(
      queryKey,
    );
    const page = data?.pages[0];
    expect(page?.ok && page.tasks.map((t) => t.projectId)).toEqual([
      "project-b",
    ]);
  });

  it("inserts the card into a project list as soon as the task is moved into it", async () => {
    const queryKey = ["tasks", "list", "project", "project-b"];
    const queryClient = buildQueryClient();
    const task = buildTask({ projectId: "project-a" });
    seedList(queryClient, queryKey, []);

    const { result } = renderHook(() => useUpdateTaskMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        taskId: "1",
        task,
        input: buildInput({ projectId: "project-b" }),
      });
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    const data = queryClient.getQueryData<{ pages: TasksListResult[] }>(
      queryKey,
    );
    const page = data?.pages[0];
    expect(page?.ok && page.tasks.map((t) => t.id)).toEqual(["1"]);
  });

  it("inserts the card into the Calendar list as soon as a due date is set", async () => {
    const queryKey = ["tasks", "list", "calendar"];
    const queryClient = buildQueryClient();
    const task = buildTask({ due: null });
    seedList(queryClient, queryKey, []);

    const { result } = renderHook(() => useUpdateTaskMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        taskId: "1",
        task,
        input: buildInput({
          due: { date: dayjs().format("YYYY-MM-DD"), datetime: null },
        }),
      });
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    const data = queryClient.getQueryData<{ pages: TasksListResult[] }>(
      queryKey,
    );
    const page = data?.pages[0];
    expect(page?.ok && page.tasks.map((t) => t.id)).toEqual(["1"]);
  });

  it("optimistically bumps the Today count when a due date is set to today", async () => {
    const queryKey = ["tasks", "list"];
    const queryClient = buildQueryClient();
    const task = buildTask({ due: null });
    seedList(queryClient, queryKey, [task]);
    queryClient.setQueryData(todayCountQueryKey, { ok: true, count: 2 });

    const { result } = renderHook(() => useUpdateTaskMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        taskId: "1",
        task,
        input: buildInput({
          due: { date: dayjs().format("YYYY-MM-DD"), datetime: null },
        }),
      });
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    expect(queryClient.getQueryData(todayCountQueryKey)).toMatchObject({
      count: 3,
    });
  });

  it("optimistically moves the project active-task count when a task changes project", async () => {
    const queryKey = ["tasks", "list"];
    const queryClient = buildQueryClient();
    const task = buildTask({ projectId: "project-a" });
    seedList(queryClient, queryKey, [task]);
    queryClient.setQueryData(taskCountQueryKey, { ok: true, count: 5 });
    queryClient.setQueryData(projectsListQueryKey, {
      ok: true,
      projects: [
        { id: "project-a", activeTaskCount: 3 },
        { id: "project-b", activeTaskCount: 1 },
      ],
    });

    const { result } = renderHook(() => useUpdateTaskMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        taskId: "1",
        task,
        input: buildInput({ projectId: "project-b" }),
      });
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    // Moving a task between projects doesn't change how many tasks exist in total.
    expect(queryClient.getQueryData(taskCountQueryKey)).toMatchObject({
      count: 5,
    });
    expect(queryClient.getQueryData(projectsListQueryKey)).toMatchObject({
      projects: [
        { id: "project-a", activeTaskCount: 2 },
        { id: "project-b", activeTaskCount: 2 },
      ],
    });
  });

  it("reconciles the task into a project page's cache even when edited from a different screen", async () => {
    const queryKey = ["tasks", "list"];
    const projectQueryKey = ["tasks", "list", "project", "project-b"];
    const queryClient = buildQueryClient();
    const task = buildTask({ projectId: "project-a" });
    seedList(queryClient, queryKey, [task]);
    // The target project's page was visited earlier this session, so its
    // cache already exists — even though the edit happens elsewhere.
    seedList(queryClient, projectQueryKey, []);

    const { result } = renderHook(() => useUpdateTaskMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        taskId: "1",
        task,
        input: buildInput({ projectId: "project-b" }),
      });
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    const projectData = queryClient.getQueryData<{
      pages: TasksListResult[];
    }>(projectQueryKey);
    const projectPage = projectData?.pages[0];
    expect(projectPage?.ok && projectPage.tasks.map((t) => t.id)).toEqual([
      "1",
    ]);
  });

  it("drops the card from the Calendar list as soon as its due date is cleared", async () => {
    const queryKey = ["tasks", "list", "calendar"];
    const queryClient = buildQueryClient();
    const task = buildTask();
    seedList(queryClient, queryKey, [task]);

    const { result } = renderHook(() => useUpdateTaskMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        taskId: "1",
        task,
        input: buildInput({ due: null }),
      });
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    const data = queryClient.getQueryData<{ pages: TasksListResult[] }>(
      queryKey,
    );
    const page = data?.pages[0];
    expect(page?.ok && page.tasks).toEqual([]);
  });
});
