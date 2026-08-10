import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import type { TaskDTO } from "@/main/tasks";
import { TaskBoard } from "./TaskBoard";

const task: TaskDTO = {
  id: "task-1",
  title: "Write report",
  description: "",
  projectId: "inbox",
  priority: "p4",
  due: null,
  kanbanStatus: { level: "todo", hasConflict: false },
  labels: [],
  checked: false,
  parentId: null,
};

const renderBoard = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <TaskBoard tasks={[task]} queryKey={["tasks", "list"]} />
      </QueryClientProvider>
    </MantineProvider>,
  );
};

describe("TaskBoard", () => {
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
          list: vi.fn().mockResolvedValue({
            ok: true,
            tasks: [],
            nextCursor: null,
          }),
          complete: vi.fn(),
        },
      },
    });
  });

  it("opens the edit modal when a task card is clicked", async () => {
    const user = userEvent.setup();
    renderBoard();

    await user.click(screen.getByText("Write report"));

    expect(
      await screen.findByRole("heading", { name: "Edit task" }),
    ).toBeInTheDocument();
  });

  it("pre-fills the Kanban status matching whichever column's '+' was clicked", async () => {
    window.api.tasks.create = vi.fn().mockResolvedValue({ ok: true, task });
    const user = userEvent.setup();
    renderBoard();

    await user.click(
      screen.getByRole("button", { name: "Add task to In progress" }),
    );
    expect(await screen.findByDisplayValue("In progress")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // A second column, on the same always-mounted modal instance — the
    // previous click's defaults must not stick around.
    await user.click(
      screen.getByRole("button", { name: "Add task to Completed" }),
    );
    expect(await screen.findByDisplayValue("Completed")).toBeInTheDocument();
  });
});
