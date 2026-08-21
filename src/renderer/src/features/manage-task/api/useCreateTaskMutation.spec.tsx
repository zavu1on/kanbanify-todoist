import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { projectsListQueryKey } from "@/entities/project";
import { taskCountQueryKey, todayCountQueryKey } from "@/entities/task";
import type { CreateTaskRequest, TasksListResult } from "@/main/tasks";
import { useCreateTaskMutation } from "./useCreateTaskMutation";

const queryKey = ["tasks", "list"];

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

const buildInput = (
  overrides: Partial<CreateTaskRequest> = {},
): CreateTaskRequest => ({
  title: "Task",
  description: "",
  projectId: "project-a",
  priority: "p4",
  due: { date: dayjs().format("YYYY-MM-DD"), datetime: null },
  kanbanStatus: "none",
  labels: [],
  parentId: null,
  ...overrides,
});

describe("useCreateTaskMutation", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: { tasks: { create: vi.fn(() => new Promise(() => {})) } },
    });
  });

  it("optimistically bumps the total, today, and project active-task counts", async () => {
    const queryClient = buildQueryClient();
    const page: TasksListResult = { ok: true, tasks: [], nextCursor: null };
    queryClient.setQueryData(queryKey, { pages: [page], pageParams: [null] });
    queryClient.setQueryData(taskCountQueryKey, { ok: true, count: 5 });
    queryClient.setQueryData(todayCountQueryKey, { ok: true, count: 2 });
    queryClient.setQueryData(projectsListQueryKey, {
      ok: true,
      projects: [{ id: "project-a", activeTaskCount: 3 }],
    });

    const { result } = renderHook(() => useCreateTaskMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    act(() => {
      result.current.mutate(buildInput());
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    expect(queryClient.getQueryData(taskCountQueryKey)).toMatchObject({
      count: 6,
    });
    expect(queryClient.getQueryData(todayCountQueryKey)).toMatchObject({
      count: 3,
    });
    expect(queryClient.getQueryData(projectsListQueryKey)).toMatchObject({
      projects: [{ activeTaskCount: 4 }],
    });
  });

  it("inserts the new task into a project page's cache even when created from a different screen", async () => {
    const todayQueryKey = ["tasks", "list", "today"];
    const projectQueryKey = ["tasks", "list", "project", "project-a"];
    const queryClient = buildQueryClient();
    const emptyPage: TasksListResult = {
      ok: true,
      tasks: [],
      nextCursor: null,
    };
    // The project page was visited earlier this session, so its cache
    // already exists — even though the create happens from Today, not there.
    queryClient.setQueryData(todayQueryKey, {
      pages: [emptyPage],
      pageParams: [null],
    });
    queryClient.setQueryData(projectQueryKey, {
      pages: [emptyPage],
      pageParams: [null],
    });

    const { result } = renderHook(() => useCreateTaskMutation(todayQueryKey), {
      wrapper: buildWrapper(queryClient),
    });

    act(() => {
      result.current.mutate(buildInput({ projectId: "project-a" }));
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    const projectData = queryClient.getQueryData<{
      pages: TasksListResult[];
    }>(projectQueryKey);
    const projectPage = projectData?.pages[0];
    expect(projectPage?.ok && projectPage.tasks).toHaveLength(1);
  });

  it("doesn't bump the Today count for a task without a due date", async () => {
    const queryClient = buildQueryClient();
    const page: TasksListResult = { ok: true, tasks: [], nextCursor: null };
    queryClient.setQueryData(queryKey, { pages: [page], pageParams: [null] });
    queryClient.setQueryData(todayCountQueryKey, { ok: true, count: 2 });

    const { result } = renderHook(() => useCreateTaskMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    act(() => {
      result.current.mutate(buildInput({ due: null }));
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    expect(queryClient.getQueryData(todayCountQueryKey)).toMatchObject({
      count: 2,
    });
  });
});
