import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { projectsListQueryKey } from "@/entities/project";
import { taskCountQueryKey, todayCountQueryKey } from "@/entities/task";
import type { CompleteTaskResult } from "@/main/tasks";
import { useCompleteTaskMutation } from "./useCompleteTaskMutation";

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

describe("useCompleteTaskMutation", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: { tasks: { complete: vi.fn() } },
    });
  });

  it("removes the task from the cache optimistically and invalidates other pages on success", async () => {
    window.api.tasks.complete = vi.fn().mockResolvedValue({ ok: true });
    const queryClient = buildQueryClient();
    queryClient.setQueryData(queryKey, {
      pages: [
        { ok: true, tasks: [{ id: "1" }, { id: "2" }], nextCursor: null },
      ],
      pageParams: [null],
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCompleteTaskMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ taskId: "1" });
    });

    await waitFor(() =>
      expect(queryClient.getQueryData(queryKey)).toMatchObject({
        pages: [{ tasks: [{ id: "2" }] }],
      }),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["tasks", "list"],
      refetchType: "active",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["tasks", "count"],
      refetchType: "active",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["projects", "list"],
      refetchType: "active",
    });
  });

  it("optimistically decrements the total, today, and project counts", async () => {
    window.api.tasks.complete = vi.fn(
      () => new Promise<CompleteTaskResult>(() => {}),
    );
    const queryClient = buildQueryClient();
    const task = {
      id: "1",
      projectId: "project-a",
      parentId: null,
      due: { date: dayjs().format("YYYY-MM-DD"), datetime: null },
    };
    queryClient.setQueryData(queryKey, {
      pages: [{ ok: true, tasks: [task], nextCursor: null }],
      pageParams: [null],
    });
    queryClient.setQueryData(taskCountQueryKey, { ok: true, count: 5 });
    queryClient.setQueryData(todayCountQueryKey, { ok: true, count: 2 });
    queryClient.setQueryData(projectsListQueryKey, {
      ok: true,
      projects: [{ id: "project-a", activeTaskCount: 3 }],
    });

    const { result } = renderHook(() => useCompleteTaskMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ taskId: "1" });
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    expect(queryClient.getQueryData(taskCountQueryKey)).toMatchObject({
      count: 4,
    });
    expect(queryClient.getQueryData(todayCountQueryKey)).toMatchObject({
      count: 1,
    });
    expect(queryClient.getQueryData(projectsListQueryKey)).toMatchObject({
      projects: [{ activeTaskCount: 2 }],
    });
  });

  it("restores the removed task and shows an error notification when the API call fails", async () => {
    window.api.tasks.complete = vi.fn().mockResolvedValue({
      ok: false,
      error: { type: "unknown", message: "boom" },
    });
    const queryClient = buildQueryClient();
    queryClient.setQueryData(queryKey, {
      pages: [{ ok: true, tasks: [{ id: "1" }], nextCursor: null }],
      pageParams: [null],
    });

    const { result } = renderHook(() => useCompleteTaskMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ taskId: "1" });
    });

    expect(queryClient.getQueryData(queryKey)).toMatchObject({
      pages: [{ tasks: [{ id: "1" }] }],
    });
  });
});
