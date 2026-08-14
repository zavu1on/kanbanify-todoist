import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDeleteTaskMutation } from "./useDeleteTaskMutation";

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

describe("useDeleteTaskMutation", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: { tasks: { delete: vi.fn() } },
    });
  });

  it("removes the task from the cache optimistically and invalidates other pages on success", async () => {
    window.api.tasks.delete = vi.fn().mockResolvedValue({ ok: true });
    const queryClient = buildQueryClient();
    queryClient.setQueryData(queryKey, {
      pages: [
        { ok: true, tasks: [{ id: "1" }, { id: "2" }], nextCursor: null },
      ],
      pageParams: [null],
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteTaskMutation(queryKey), {
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

  it("restores the removed task and shows an error notification when the API call fails", async () => {
    window.api.tasks.delete = vi.fn().mockResolvedValue({
      ok: false,
      error: { type: "unknown", message: "boom" },
    });
    const queryClient = buildQueryClient();
    queryClient.setQueryData(queryKey, {
      pages: [{ ok: true, tasks: [{ id: "1" }], nextCursor: null }],
      pageParams: [null],
    });

    const { result } = renderHook(() => useDeleteTaskMutation(queryKey), {
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
