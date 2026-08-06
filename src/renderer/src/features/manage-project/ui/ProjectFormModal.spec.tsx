import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import type { ProjectDTO } from "@/main/projects";
import { ProjectFormModal } from "./ProjectFormModal";

const workProject: ProjectDTO = {
  id: "1",
  name: "Work",
  description: "Work stuff",
  color: "blue",
  parentId: "0",
  isInboxProject: false,
  isArchived: false,
  activeTaskCount: 2,
};

const parentProject: ProjectDTO = {
  id: "0",
  name: "Life",
  description: "",
  color: "red",
  parentId: null,
  isInboxProject: false,
  isArchived: false,
  activeTaskCount: 0,
};

const renderModal = (props: { project?: ProjectDTO }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onClose = vi.fn();

  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <ProjectFormModal opened onClose={onClose} project={props.project} />
      </QueryClientProvider>
    </MantineProvider>,
  );

  return { onClose };
};

describe("ProjectFormModal", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: {
        projects: {
          list: vi.fn().mockResolvedValue({
            ok: true,
            projects: [workProject, parentProject],
          }),
          create: vi.fn(),
          update: vi.fn(),
        },
      },
    });
  });

  it("shows an 'Add project' title and a selectable parent project in create mode", async () => {
    renderModal({});

    expect(
      screen.getByRole("heading", { name: "Add project" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("combobox", { name: "Parent project" }),
    ).toBeEnabled();
  });

  it("shows an 'Edit project' title with a read-only parent in edit mode", async () => {
    renderModal({ project: workProject });

    expect(
      screen.getByRole("heading", { name: "Edit project" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Work")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Work stuff")).toBeInTheDocument();
    const parentField = await screen.findByLabelText("Parent project");
    expect(parentField).toHaveValue("Life");
    expect(parentField).toBeDisabled();
  });

  it("shows a validation error for a blank name and does not call the IPC bridge", async () => {
    const user = userEvent.setup();
    renderModal({ project: workProject });

    await user.clear(screen.getByLabelText("Name"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(window.api.projects.update).not.toHaveBeenCalled();
  });

  it("submits the trimmed name and description on create and closes the modal", async () => {
    window.api.projects.create = vi.fn().mockResolvedValue({
      ok: true,
      project: { ...workProject, id: "2", name: "New" },
    });
    const user = userEvent.setup();
    const { onClose } = renderModal({});

    await user.type(screen.getByLabelText("Name"), "  New  ");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(window.api.projects.create).toHaveBeenCalledWith({
        name: "New",
        description: "",
        color: "charcoal",
        parentId: null,
      });
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("submits only name, description and color on update — no parentId", async () => {
    window.api.projects.update = vi.fn().mockResolvedValue({
      ok: true,
      project: workProject,
    });
    const user = userEvent.setup();
    const { onClose } = renderModal({ project: workProject });

    await user.clear(screen.getByLabelText("Description"));
    await user.type(screen.getByLabelText("Description"), "Updated");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(window.api.projects.update).toHaveBeenCalledWith("1", {
        name: "Work",
        description: "Updated",
        color: "blue",
      });
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
