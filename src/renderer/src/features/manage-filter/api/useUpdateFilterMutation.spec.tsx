import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUpdateFilterMutation } from "./useUpdateFilterMutation";

describe("useUpdateFilterMutation", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: { filters: { update: vi.fn() } },
    });
  });

  it("invalidates the edited filter's cached tasks list after a successful save", async () => {
    window.api.filters.update = vi.fn().mockResolvedValue({
      ok: true,
      filter: {
        id: 7,
        title: "F",
        color: "charcoal",
        query: "p1",
        taskCount: 0,
      },
    });
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateFilterMutation(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        id: 7,
        input: { title: "F", color: "charcoal", query: "p1" },
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["tasks", "list", "filter", 7],
    });
  });
});
