import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import type { TaskDTO } from "@/main/tasks";
import { TaskCard } from "./TaskCard";

const task: TaskDTO = {
  id: "1",
  title: "Write report",
  projectId: "project-1",
  priority: "p4",
  due: null,
  kanbanStatus: { level: "none", hasConflict: false },
  labels: [],
  checked: false,
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
});
