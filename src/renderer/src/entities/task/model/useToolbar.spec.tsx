import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, screen } from "@testing-library/react";
import { type ToolbarSegment, useToolbar } from "./useToolbar";

type TestViewMode = "list" | "kanban" | "board";

const segments: ToolbarSegment<TestViewMode>[] = [
  { value: "list", label: "List" },
  { value: "kanban", label: "Kanban" },
  { value: "board", label: "Board" },
];

const renderToolbar = (
  overrides: Partial<Parameters<typeof useToolbar<TestViewMode>>[0]> = {},
) => {
  const onViewModeChange = vi.fn();
  const onLoadMore = vi.fn();
  const queryClient = new QueryClient();
  const resetQueries = vi.spyOn(queryClient, "resetQueries");

  const { result } = renderHook(
    () =>
      useToolbar<TestViewMode>({
        viewMode: "list",
        onViewModeChange,
        segments,
        refetchQueryKeys: [["tasks", "list"]],
        isRefetching: false,
        onLoadMore,
        hasNextPage: false,
        isFetchingNextPage: false,
        ...overrides,
      }),
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    },
  );

  render(<MantineProvider>{result.current}</MantineProvider>);

  return { onViewModeChange, onLoadMore, resetQueries };
};

describe("useToolbar", () => {
  it("renders a segment per view mode, however many are passed", () => {
    renderToolbar();

    expect(screen.getByRole("radio", { name: "List" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Kanban" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Board" })).toBeInTheDocument();
  });

  it("switches view mode through the segmented control", async () => {
    const user = userEvent.setup();
    const { onViewModeChange } = renderToolbar();

    await user.click(screen.getByRole("radio", { name: "Kanban" }));

    expect(onViewModeChange).toHaveBeenCalledWith("kanban");
  });

  it("resets every passed refetch query key when the refetch button is clicked", async () => {
    const user = userEvent.setup();
    const { resetQueries } = renderToolbar({
      refetchQueryKeys: [
        ["tasks", "list"],
        ["comments", "list"],
      ],
    });

    await user.click(screen.getByRole("button", { name: "Refetch tasks" }));

    expect(resetQueries).toHaveBeenCalledWith({ queryKey: ["tasks", "list"] });
    expect(resetQueries).toHaveBeenCalledWith({
      queryKey: ["comments", "list"],
    });
  });

  it("hides 'Load more' when there is no next page", () => {
    renderToolbar({ hasNextPage: false });

    expect(
      screen.queryByRole("button", { name: "Load more tasks" }),
    ).not.toBeInTheDocument();
  });

  it("triggers load more when there is a next page", async () => {
    const user = userEvent.setup();
    const { onLoadMore } = renderToolbar({ hasNextPage: true });

    await user.click(screen.getByRole("button", { name: "Load more tasks" }));

    expect(onLoadMore).toHaveBeenCalled();
  });
});
