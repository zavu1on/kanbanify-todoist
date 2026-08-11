import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import type { TaskDTO } from "@/main/tasks";
import { CalendarMonthView } from "./CalendarMonthView";

const task: TaskDTO = {
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
};

const renderMonthView = (tasks: TaskDTO[]) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <CalendarMonthView
          tasks={tasks}
          queryKey={["tasks", "list"]}
          weekStartsOn={1}
        />
      </QueryClientProvider>
    </MantineProvider>,
  );
};

describe("CalendarMonthView", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-08-05T14:00:00.000Z"));

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

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens the edit modal when a task's event is clicked", async () => {
    const user = userEvent.setup();
    renderMonthView([task]);

    await user.click(screen.getByRole("button", { name: "Write report" }));

    expect(
      await screen.findByRole("heading", { name: "Edit task" }),
    ).toBeInTheDocument();
  });

  it("opens the create modal pre-filled with the clicked day", async () => {
    window.api.tasks.create = vi.fn().mockResolvedValue({ ok: true, task });
    const user = userEvent.setup();
    renderMonthView([]);

    await user.click(
      screen.getByRole("button", { name: "August 10, 2026" }),
    );

    expect(
      await screen.findByRole("heading", { name: "New task" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-08-10")).toBeInTheDocument();
  });
});
