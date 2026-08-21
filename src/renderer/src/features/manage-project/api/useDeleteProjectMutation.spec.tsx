import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { projectsListQueryKey } from "@/entities/project";
import { taskCountQueryKey, todayCountQueryKey } from "@/entities/task";
import type { DeleteProjectResult, ProjectsListResult } from "@/main/projects";
import type { TaskDTO, TasksListResult } from "@/main/tasks";
import { useDeleteProjectMutation } from "./useDeleteProjectMutation";

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
    id: "task-1",
    title: "Task",
    projectId: "project-a",
    parentId: null,
    due: { date: dayjs().format("YYYY-MM-DD"), datetime: null },
    ...overrides,
  }) as TaskDTO;

describe("useDeleteProjectMutation", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: { projects: { delete: vi.fn() } },
    });
  });

  it("removes the project's own tasks from every cached tasks-list and decrements counts", async () => {
    window.api.projects.delete = vi.fn(
      () => new Promise<DeleteProjectResult>(() => {}),
    );
    const queryClient = buildQueryClient();

    queryClient.setQueryData(projectsListQueryKey, {
      ok: true,
      projects: [{ id: "project-a", activeTaskCount: 2 }],
    });
    queryClient.setQueryData(taskCountQueryKey, { ok: true, count: 5 });
    queryClient.setQueryData(todayCountQueryKey, { ok: true, count: 3 });

    const todayTask = buildTask({ id: "task-1" });
    const otherProjectTask = buildTask({
      id: "task-2",
      projectId: "project-b",
    });
    queryClient.setQueryData(["tasks", "list", "today"], {
      pages: [
        { ok: true, tasks: [todayTask, otherProjectTask], nextCursor: null },
      ],
      pageParams: [null],
    });
    queryClient.setQueryData(["tasks", "list", "project", "project-a"], {
      pages: [{ ok: true, tasks: [todayTask], nextCursor: null }],
      pageParams: [null],
    });

    const { result } = renderHook(() => useDeleteProjectMutation(), {
      wrapper: buildWrapper(queryClient),
    });

    act(() => {
      result.current.mutate("project-a");
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    expect(
      queryClient.getQueryData<ProjectsListResult>(projectsListQueryKey),
    ).toMatchObject({ projects: [] });
    expect(queryClient.getQueryData(taskCountQueryKey)).toMatchObject({
      count: 4,
    });
    expect(queryClient.getQueryData(todayCountQueryKey)).toMatchObject({
      count: 2,
    });

    const todayData = queryClient.getQueryData<{
      pages: TasksListResult[];
    }>(["tasks", "list", "today"]);
    const todayPage = todayData?.pages[0];
    expect(todayPage?.ok && todayPage.tasks.map((t) => t.id)).toEqual([
      "task-2",
    ]);

    const projectData = queryClient.getQueryData<{
      pages: TasksListResult[];
    }>(["tasks", "list", "project", "project-a"]);
    const projectPage = projectData?.pages[0];
    expect(projectPage?.ok && projectPage.tasks).toEqual([]);
  });

  it("restores the project, its tasks, and the counts when the delete fails", async () => {
    window.api.projects.delete = vi.fn().mockResolvedValue({
      ok: false,
      error: { type: "unknown", message: "boom" },
    });
    const queryClient = buildQueryClient();

    queryClient.setQueryData(projectsListQueryKey, {
      ok: true,
      projects: [{ id: "project-a", activeTaskCount: 1 }],
    });
    queryClient.setQueryData(taskCountQueryKey, { ok: true, count: 5 });
    const task = buildTask();
    queryClient.setQueryData(["tasks", "list", "project", "project-a"], {
      pages: [{ ok: true, tasks: [task], nextCursor: null }],
      pageParams: [null],
    });

    const { result } = renderHook(() => useDeleteProjectMutation(), {
      wrapper: buildWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("project-a");
    });

    expect(
      queryClient.getQueryData<ProjectsListResult>(projectsListQueryKey),
    ).toMatchObject({ projects: [{ id: "project-a" }] });
    expect(queryClient.getQueryData(taskCountQueryKey)).toMatchObject({
      count: 5,
    });
    const projectData = queryClient.getQueryData<{
      pages: TasksListResult[];
    }>(["tasks", "list", "project", "project-a"]);
    const projectPage = projectData?.pages[0];
    expect(projectPage?.ok && projectPage.tasks.map((t) => t.id)).toEqual([
      "task-1",
    ]);
  });
});
