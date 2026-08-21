import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  TaskDTO,
  TasksListResult,
  UpdateTaskStatusResult,
} from "@/main/tasks";
import { useChangeTaskStatusMutation } from "./useChangeTaskStatusMutation";

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

describe("useChangeTaskStatusMutation", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: { tasks: { updateStatus: vi.fn() } },
    });
  });

  it("invalidates every tasks-list page after a successful status change", async () => {
    window.api.tasks.updateStatus = vi
      .fn()
      .mockResolvedValue({ ok: true, task: { id: "1" } });
    const queryClient = buildQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useChangeTaskStatusMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ taskId: "1", status: "in-progress" });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["tasks", "list"],
      refetchType: "none",
    });
  });

  it("does not invalidate other pages when the status change fails", async () => {
    window.api.tasks.updateStatus = vi.fn().mockResolvedValue({
      ok: false,
      error: { type: "unknown", message: "boom" },
    });
    const queryClient = buildQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useChangeTaskStatusMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ taskId: "1", status: "in-progress" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("patches the task's status in every cached tasks-list, not just the caller's own", async () => {
    const globalQueryKey = ["tasks", "list"];
    const projectQueryKey = ["tasks", "list", "project", "project-a"];
    window.api.tasks.updateStatus = vi.fn(
      () => new Promise<UpdateTaskStatusResult>(() => {}),
    );
    const queryClient = buildQueryClient();
    const task = {
      id: "1",
      projectId: "project-a",
      kanbanStatus: { level: "todo", hasConflict: false },
    } as TaskDTO;
    const page: TasksListResult = { ok: true, tasks: [task], nextCursor: null };
    queryClient.setQueryData(globalQueryKey, {
      pages: [page],
      pageParams: [null],
    });
    // The project's own page was visited earlier this session, so its cache
    // already has the same task — even though the drag happens on the global board.
    queryClient.setQueryData(projectQueryKey, {
      pages: [page],
      pageParams: [null],
    });

    const { result } = renderHook(
      () => useChangeTaskStatusMutation(globalQueryKey),
      { wrapper: buildWrapper(queryClient) },
    );

    act(() => {
      result.current.mutate({ taskId: "1", status: "in-progress" });
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));

    const projectData = queryClient.getQueryData<{
      pages: TasksListResult[];
    }>(projectQueryKey);
    const projectPage = projectData?.pages[0];
    expect(projectPage?.ok && projectPage.tasks[0]?.kanbanStatus.level).toBe(
      "in-progress",
    );
  });

  it("restores every touched list and shows an error notification when the call throws", async () => {
    window.api.tasks.updateStatus = vi
      .fn()
      .mockRejectedValue(new Error("network down"));
    const queryClient = buildQueryClient();
    const task = {
      id: "1",
      projectId: "project-a",
      kanbanStatus: { level: "todo", hasConflict: false },
    } as TaskDTO;
    const page: TasksListResult = { ok: true, tasks: [task], nextCursor: null };
    queryClient.setQueryData(queryKey, { pages: [page], pageParams: [null] });

    const { result } = renderHook(() => useChangeTaskStatusMutation(queryKey), {
      wrapper: buildWrapper(queryClient),
    });

    await act(async () => {
      await result.current
        .mutateAsync({ taskId: "1", status: "in-progress" })
        .catch(() => {});
    });

    const data = queryClient.getQueryData<{ pages: TasksListResult[] }>(
      queryKey,
    );
    const resultPage = data?.pages[0];
    expect(resultPage?.ok && resultPage.tasks[0]?.kanbanStatus.level).toBe(
      "todo",
    );
  });
});
