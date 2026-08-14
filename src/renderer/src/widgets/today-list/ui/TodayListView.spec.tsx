import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import type { TaskDTO } from "@/main/tasks";
import { TodayListView } from "./TodayListView";

const buildTask = (overrides: Partial<TaskDTO>): TaskDTO => ({
  id: "task-1",
  title: "Write report",
  description: "",
  projectId: "inbox",
  priority: "p4",
  due: { date: dayjs().format("YYYY-MM-DD"), datetime: null },
  kanbanStatus: { level: "todo", hasConflict: false },
  labels: [],
  checked: false,
  parentId: null,
  ...overrides,
});

const renderView = (tasks: TaskDTO[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <MantineProvider>
      <Notifications />
      <QueryClientProvider client={queryClient}>
        <TodayListView tasks={tasks} queryKey={["tasks", "list", "today"]} />
      </QueryClientProvider>
    </MantineProvider>,
  );
};

describe("TodayListView", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: {
        projects: {
          list: vi.fn().mockResolvedValue({ ok: true, projects: [] }),
        },
        labels: {
          list: vi.fn().mockResolvedValue({ ok: true, labels: [] }),
          create: vi.fn(),
        },
        tasks: {
          create: vi.fn(),
          update: vi.fn(),
          updateStatus: vi.fn(),
          list: vi
            .fn()
            .mockResolvedValue({ ok: true, tasks: [], nextCursor: null }),
          complete: vi.fn(),
        },
      },
    });
  });

  it("splits tasks into Overdue and Today sections", () => {
    renderView([
      buildTask({
        id: "overdue-1",
        title: "Overdue task",
        due: {
          date: dayjs().subtract(2, "day").format("YYYY-MM-DD"),
          datetime: null,
        },
      }),
      buildTask({ id: "today-1", title: "Today task" }),
    ]);

    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Overdue task")).toBeInTheDocument();
    expect(screen.getByText("Today task")).toBeInTheDocument();
  });

  it("does not show the Overdue section when there are no overdue tasks", () => {
    renderView([buildTask({})]);

    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
  });

  it("reschedules every overdue task to today after confirming the bulk move", async () => {
    const user = userEvent.setup();
    renderView([
      buildTask({
        id: "overdue-1",
        due: {
          date: dayjs().subtract(2, "day").format("YYYY-MM-DD"),
          datetime: null,
        },
      }),
    ]);

    await user.click(screen.getByRole("button", { name: "Move all to today" }));
    await user.click(
      await screen.findByRole("button", { name: "Move to today" }),
    );

    await waitFor(() =>
      expect(window.api.tasks.update).toHaveBeenCalledWith(
        "overdue-1",
        expect.objectContaining({
          due: { date: dayjs().format("YYYY-MM-DD"), datetime: null },
        }),
      ),
    );
  });

  it("opens the edit modal when a task card is clicked", async () => {
    const user = userEvent.setup();
    renderView([buildTask({})]);

    await user.click(screen.getByText("Write report"));

    expect(
      await screen.findByRole("heading", { name: "Edit task" }),
    ).toBeInTheDocument();
  });

  it("opens the create modal from the Add task button", async () => {
    const user = userEvent.setup();
    renderView([]);

    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(
      await screen.findByRole("heading", { name: "New task" }),
    ).toBeInTheDocument();
  });

  it("completes a task through the checkbox", async () => {
    window.api.tasks.complete = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderView([buildTask({})]);

    await user.click(screen.getByRole("checkbox"));

    await waitFor(() =>
      expect(window.api.tasks.complete).toHaveBeenCalledWith("task-1"),
    );
  });
});
