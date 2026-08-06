import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import type { ProjectDTO } from "@/main/projects";
import { ProjectActionsMenu } from "./ProjectActionsMenu";

const project: ProjectDTO = {
  id: "1",
  name: "Work",
  description: "",
  color: "blue",
  parentId: null,
  isInboxProject: false,
  isArchived: false,
  activeTaskCount: 2,
};

const renderMenu = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <ProjectActionsMenu project={project} />
      </QueryClientProvider>
    </MantineProvider>,
  );
};

describe("ProjectActionsMenu", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: {
        projects: {
          list: vi.fn().mockResolvedValue({ ok: true, projects: [project] }),
          archive: vi.fn(),
          delete: vi.fn(),
        },
      },
    });
  });

  it("opens the edit modal from the menu", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Work actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }));

    expect(
      await screen.findByRole("heading", { name: "Edit project" }),
    ).toBeInTheDocument();
  });

  it("opens the archive confirmation from the menu", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Work actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Archive" }));

    expect(
      await screen.findByRole("heading", { name: "Archive project?" }),
    ).toBeInTheDocument();
  });

  it("opens the delete confirmation from the menu", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "Work actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(
      await screen.findByRole("heading", { name: "Delete project?" }),
    ).toBeInTheDocument();
  });
});
