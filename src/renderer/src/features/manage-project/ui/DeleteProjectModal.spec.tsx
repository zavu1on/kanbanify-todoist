import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import type { ProjectDTO } from "@/main/projects";
import { DeleteProjectModal } from "./DeleteProjectModal";

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

const renderModal = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onClose = vi.fn();

  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <DeleteProjectModal opened onClose={onClose} project={project} />
      </QueryClientProvider>
    </MantineProvider>,
  );

  return { onClose };
};

describe("DeleteProjectModal", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: { projects: { delete: vi.fn() } },
    });
  });

  it("requires a second confirmation before deleting", async () => {
    const user = userEvent.setup();
    renderModal();

    expect(
      screen.queryByRole("button", { name: "Delete project" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("button", { name: "Delete project" }),
    ).toBeInTheDocument();
    expect(window.api.projects.delete).not.toHaveBeenCalled();
  });

  it("deletes the project only after the second confirmation", async () => {
    window.api.projects.delete = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Delete project" }));

    await waitFor(() => {
      expect(window.api.projects.delete).toHaveBeenCalledWith("1");
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
