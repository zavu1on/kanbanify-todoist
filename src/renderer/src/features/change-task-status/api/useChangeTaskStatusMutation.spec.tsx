import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["tasks", "list"] });
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
});
