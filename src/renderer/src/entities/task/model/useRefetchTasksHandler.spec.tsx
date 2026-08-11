import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { useRefetchTasksHandler } from "./useRefetchTasksHandler";

const renderWithClient = (queryClient: QueryClient, queryKeys: unknown[][]) =>
  renderHook(() => useRefetchTasksHandler(queryKeys), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

describe("useRefetchTasksHandler", () => {
  it("resets every passed query key when called", () => {
    const queryClient = new QueryClient();
    const resetQueries = vi.spyOn(queryClient, "resetQueries");
    const queryKeys = [
      ["tasks", "list"],
      ["tasks", "list", "subtasks"],
      ["comments", "list"],
    ];

    const { result } = renderWithClient(queryClient, queryKeys);
    act(() => {
      result.current();
    });

    expect(resetQueries).toHaveBeenCalledTimes(3);
    for (const queryKey of queryKeys) {
      expect(resetQueries).toHaveBeenCalledWith({ queryKey });
    }
  });

  it("resets the same query keys again when Ctrl+R is pressed", () => {
    const queryClient = new QueryClient();
    const resetQueries = vi.spyOn(queryClient, "resetQueries");
    const queryKeys = [["tasks", "list", "calendar"]];

    renderWithClient(queryClient, queryKeys);
    act(() => {
      document.documentElement.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "r",
          ctrlKey: true,
          bubbles: true,
        }),
      );
    });

    expect(resetQueries).toHaveBeenCalledWith({ queryKey: queryKeys[0] });
  });
});
