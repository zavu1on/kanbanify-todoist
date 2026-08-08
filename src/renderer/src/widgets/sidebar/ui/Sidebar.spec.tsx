import { AppShell, MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { SessionProvider } from "@/app/SessionContext";
import type { ProjectsListResult } from "@/main/projects";
import type { TasksCountResult } from "@/main/tasks";
import { Sidebar } from "./Sidebar";

const renderSidebar = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SessionProvider>
            <AppShell navbar={{ width: 260, breakpoint: 0 }}>
              <Sidebar />
            </AppShell>
          </SessionProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </MantineProvider>,
  );
};

describe("Sidebar", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: {
        auth: {
          checkSession: vi.fn().mockResolvedValue({ status: "no_token" }),
          logout: vi.fn(),
        },
        tasks: {
          count: vi.fn(),
          create: vi.fn(),
        },
        labels: {
          list: vi.fn().mockResolvedValue({ ok: true, labels: [] }),
        },
        projects: {
          list: vi.fn().mockResolvedValue({ ok: true, projects: [] }),
        },
      },
    });
  });

  it("opens the new task modal when the 'New task' link is clicked", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole("link", { name: "New task" }));

    expect(
      await screen.findByRole("heading", { name: "New task" }),
    ).toBeInTheDocument();
  });

  it("shows the unfinished task count next to the Tasks link", async () => {
    window.api.tasks.count = vi.fn().mockResolvedValue({ ok: true, count: 7 });
    renderSidebar();

    expect(await screen.findByText("7")).toBeInTheDocument();
  });

  it("shows a loading skeleton for the task count badge until it resolves", async () => {
    let resolveCount: (value: TasksCountResult) => void = () => {};
    window.api.tasks.count = vi.fn(
      () =>
        new Promise<TasksCountResult>((resolve) => {
          resolveCount = resolve;
        }),
    );
    renderSidebar();

    expect(
      screen.getByRole("status", { name: "Loading Tasks count" }),
    ).toBeInTheDocument();

    resolveCount({ ok: true, count: 7 });

    expect(await screen.findByText("7")).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "Loading Tasks count" }),
    ).not.toBeInTheDocument();
  });

  it("does not show a count badge when the count request fails", async () => {
    window.api.tasks.count = vi.fn().mockResolvedValue({
      ok: false,
      error: { type: "network_error", message: "offline" },
    });
    renderSidebar();

    await waitFor(() => {
      expect(window.api.tasks.count).toHaveBeenCalled();
    });
    expect(screen.queryByText("7")).not.toBeInTheDocument();
  });

  it("lists projects with their active task count after the divider", async () => {
    window.api.projects.list = vi.fn().mockResolvedValue({
      ok: true,
      projects: [
        {
          id: "1",
          name: "Inbox",
          color: "grey",
          isInboxProject: true,
          activeTaskCount: 0,
        },
        {
          id: "2",
          name: "Work",
          color: "blue",
          isInboxProject: false,
          activeTaskCount: 4,
        },
      ],
    });
    renderSidebar();

    expect(await screen.findByText("Work")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Inbox")).toBeInTheDocument();
  });

  it("shows a loading skeleton for the projects list until it resolves", async () => {
    let resolveProjects: (value: ProjectsListResult) => void = () => {};
    window.api.projects.list = vi.fn(
      () =>
        new Promise<ProjectsListResult>((resolve) => {
          resolveProjects = resolve;
        }),
    );
    renderSidebar();

    expect(
      screen.getByRole("status", { name: "Loading projects" }),
    ).toBeInTheDocument();

    resolveProjects({
      ok: true,
      projects: [
        {
          id: "1",
          name: "Work",
          description: "",
          color: "blue",
          parentId: null,
          isInboxProject: false,
          isArchived: false,
          activeTaskCount: 1,
        },
      ],
    });

    expect(await screen.findByText("Work")).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "Loading projects" }),
    ).not.toBeInTheDocument();
  });

  it("does not show a project list when there are no projects", async () => {
    window.api.projects.list = vi
      .fn()
      .mockResolvedValue({ ok: true, projects: [] });
    renderSidebar();

    await waitFor(() => {
      expect(window.api.projects.list).toHaveBeenCalled();
    });
    expect(
      screen.queryByRole("link", { name: /work/i }),
    ).not.toBeInTheDocument();
  });
});
