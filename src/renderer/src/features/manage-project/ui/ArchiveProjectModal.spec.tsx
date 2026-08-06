import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import type { ProjectDTO } from "@/main/projects";
import { ArchiveProjectModal } from "./ArchiveProjectModal";

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
        <ArchiveProjectModal opened onClose={onClose} project={project} />
      </QueryClientProvider>
    </MantineProvider>,
  );

  return { onClose };
};

describe("ArchiveProjectModal", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: { projects: { archive: vi.fn() } },
    });
  });

  it("requires a second confirmation before archiving", async () => {
    const user = userEvent.setup();
    renderModal();

    expect(
      screen.queryByRole("button", { name: "Archive project" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("button", { name: "Archive project" }),
    ).toBeInTheDocument();
    expect(window.api.projects.archive).not.toHaveBeenCalled();
  });

  it("archives the project only after the second confirmation", async () => {
    window.api.projects.archive = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Archive project" }));

    await waitFor(() => {
      expect(window.api.projects.archive).toHaveBeenCalledWith("1");
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
