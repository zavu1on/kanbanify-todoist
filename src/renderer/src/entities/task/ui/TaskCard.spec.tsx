import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import type { TaskDTO } from "@/main/tasks";
import { TaskCard } from "./TaskCard";

const task: TaskDTO = {
  id: "1",
  title: "Write report",
  description: "",
  projectId: "project-1",
  priority: "p4",
  due: null,
  kanbanStatus: { level: "none", hasConflict: false },
  labels: [],
  checked: false,
  parentId: null,
};

const renderCard = (props: Partial<React.ComponentProps<typeof TaskCard>>) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <TaskCard task={task} {...props} />
      </QueryClientProvider>
    </MantineProvider>,
  );
};

describe("TaskCard", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: {
        projects: {
          list: vi.fn().mockResolvedValue({ ok: true, projects: [] }),
        },
      },
    });
  });

  it("does not render a checkbox when onComplete is omitted", () => {
    renderCard({});

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("checks the box immediately but defers onComplete until the exit animation finishes", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    renderCard({ onComplete });

    await user.click(screen.getByRole("checkbox"));

    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(onComplete).not.toHaveBeenCalled();

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith("1"));
  });

  it("shows at most 2 labels, collapsing the rest into a +N pill", () => {
    renderCard({
      task: { ...task, labels: ["frontend", "urgent", "backend", "docs"] },
    });

    expect(screen.getByText("frontend")).toBeInTheDocument();
    expect(screen.getByText("urgent")).toBeInTheDocument();
    expect(screen.queryByText("backend")).not.toBeInTheDocument();
    expect(screen.queryByText("docs")).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("does not show a +N pill when there are 2 or fewer labels", () => {
    renderCard({ task: { ...task, labels: ["frontend", "urgent"] } });

    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  describe("due date meta", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-08-05T14:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("prefixes the day count for a task overdue by more than a day", () => {
      renderCard({
        task: { ...task, due: { date: "2026-08-02", datetime: null } },
      });

      expect(screen.getByText("3 days overdue · Aug 2")).toBeInTheDocument();
    });

    it("shows the plain label for a task due today", () => {
      renderCard({
        task: { ...task, due: { date: "2026-08-05", datetime: null } },
      });

      expect(screen.getByText("Today")).toBeInTheDocument();
    });
  });
});
