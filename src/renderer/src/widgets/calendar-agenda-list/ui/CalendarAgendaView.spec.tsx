import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import type { TaskDTO } from "@/main/tasks";
import { CalendarAgendaView } from "./CalendarAgendaView";

const buildTask = (overrides: Partial<TaskDTO>): TaskDTO => ({
  id: "task-1",
  title: "Write report",
  description: "",
  projectId: "inbox",
  priority: "p4",
  due: { date: "2026-08-10", datetime: null },
  kanbanStatus: { level: "todo", hasConflict: false },
  labels: [],
  checked: false,
  parentId: null,
  ...overrides,
});

const renderList = (tasks: TaskDTO[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <CalendarAgendaView tasks={tasks} queryKey={["tasks", "list"]} />
      </QueryClientProvider>
    </MantineProvider>,
  );
};

describe("CalendarAgendaView", () => {
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
          list: vi.fn().mockResolvedValue({ ok: true, tasks: [], nextCursor: null }),
          complete: vi.fn(),
        },
      },
    });
  });

  it("groups tasks under a heading for their due date", () => {
    renderList([
      buildTask({ id: "task-1", due: { date: "2026-08-10", datetime: null } }),
      buildTask({
        id: "task-2",
        title: "Send invoice",
        due: { date: "2026-08-11", datetime: null },
      }),
    ]);

    expect(screen.getByText("Monday, August 10")).toBeInTheDocument();
    expect(screen.getByText("Tuesday, August 11")).toBeInTheDocument();
    expect(screen.getByText("Write report")).toBeInTheDocument();
    expect(screen.getByText("Send invoice")).toBeInTheDocument();
  });

  it("opens the edit modal when a task card is clicked", async () => {
    const user = userEvent.setup();
    renderList([buildTask({})]);

    await user.click(screen.getByText("Write report"));

    expect(
      await screen.findByRole("heading", { name: "Edit task" }),
    ).toBeInTheDocument();
  });

  it("completes a task through the checkbox", async () => {
    window.api.tasks.complete = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderList([buildTask({})]);

    await user.click(screen.getByRole("checkbox"));

    await waitFor(() =>
      expect(window.api.tasks.complete).toHaveBeenCalledWith("task-1"),
    );
  });
});
