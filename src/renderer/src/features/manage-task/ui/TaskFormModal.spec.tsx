import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { TaskDTO } from "@/main/tasks";
import { TaskFormModal } from "./TaskFormModal";

const inboxProject = {
  id: "inbox",
  name: "Inbox",
  description: "",
  color: "grey",
  parentId: null,
  isInboxProject: true,
  isArchived: false,
  activeTaskCount: 0,
};

const workProject = {
  id: "work",
  name: "Work",
  description: "",
  color: "blue",
  parentId: null,
  isInboxProject: false,
  isArchived: false,
  activeTaskCount: 0,
};

const existingTask: TaskDTO = {
  id: "task-1",
  title: "Write report",
  description: "Quarterly numbers",
  projectId: "inbox",
  priority: "p4",
  due: null,
  kanbanStatus: { level: "todo", hasConflict: false },
  labels: [],
  checked: false,
  parentId: null,
};

const existingSubtask: TaskDTO = {
  id: "task-2",
  title: "Gather numbers",
  description: "",
  projectId: "inbox",
  priority: "p4",
  due: null,
  kanbanStatus: { level: "todo", hasConflict: false },
  labels: [],
  checked: false,
  parentId: "task-1",
};

const renderModal = (props: {
  task?: TaskDTO;
  defaults?: { projectId?: string };
}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onClose = vi.fn();

  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <TaskFormModal
          opened
          onClose={onClose}
          queryKey={["tasks", "list"]}
          task={props.task}
          defaults={props.defaults}
        />
      </QueryClientProvider>
    </MantineProvider>,
  );

  return { onClose };
};

describe("TaskFormModal", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: {
        projects: {
          list: vi.fn().mockResolvedValue({
            ok: true,
            projects: [inboxProject, workProject],
          }),
        },
        labels: {
          list: vi.fn().mockResolvedValue({ ok: true, labels: [] }),
          create: vi.fn(),
        },
        tasks: {
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
          list: vi
            .fn()
            .mockImplementation(
              (
                _cursor: string | null,
                _projectId?: string,
                parentId?: string,
              ) =>
                Promise.resolve({
                  ok: true,
                  tasks: parentId === existingTask.id ? [existingSubtask] : [],
                  nextCursor: null,
                }),
            ),
          complete: vi.fn(),
        },
        comments: {
          list: vi.fn().mockResolvedValue({ ok: true, comments: [] }),
        },
      },
    });
  });

  it("shows a 'New task' title with an editable quick-add title field in create mode", async () => {
    renderModal({});

    expect(
      screen.getByRole("heading", { name: "New task" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Task title" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("shows an 'Edit task' title with the existing title and description in edit mode", async () => {
    renderModal({ task: existingTask });

    expect(
      screen.getByRole("heading", { name: "Edit task" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Task title" }),
    ).toHaveTextContent("Write report");
    expect(screen.getByDisplayValue("Quarterly numbers")).toBeInTheDocument();
  });

  it("submits the edited description and closes the modal", async () => {
    window.api.tasks.update = vi
      .fn()
      .mockResolvedValue({ ok: true, task: existingTask });
    const user = userEvent.setup();
    const { onClose } = renderModal({ task: existingTask });

    const description = screen.getByDisplayValue("Quarterly numbers");
    await user.clear(description);
    await user.type(description, "Updated numbers");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(window.api.tasks.update).toHaveBeenCalledWith(
        "task-1",
        expect.objectContaining({
          title: "Write report",
          description: "Updated numbers",
          projectId: "inbox",
          kanbanStatus: "todo",
        }),
      );
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("asks for confirmation before closing a dirty edit form", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({ task: existingTask });

    await user.type(screen.getByDisplayValue("Quarterly numbers"), "!");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      await screen.findByRole("heading", { name: "Discard changes?" }),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on Escape the same way as clicking Cancel — straight away when clean, with a confirmation when dirty", async () => {
    const { onClose } = renderModal({});
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Task title" }), {
      key: "Escape",
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());

    const { onClose: onCloseDirty } = renderModal({ task: existingTask });
    const titleInput = screen.getAllByRole("textbox", {
      name: "Task title",
    })[1];
    titleInput.textContent = "Write a different report";
    fireEvent.input(titleInput);

    fireEvent.keyDown(titleInput, { key: "Escape" });
    expect(
      await screen.findByRole("heading", { name: "Discard changes?" }),
    ).toBeInTheDocument();
    expect(onCloseDirty).not.toHaveBeenCalled();
  });

  it("asks for confirmation on Escape when the Description field was edited", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({ task: existingTask });

    const description = screen.getByDisplayValue("Quarterly numbers");
    await user.type(description, "!");
    fireEvent.keyDown(description, { key: "Escape" });

    expect(
      await screen.findByRole("heading", { name: "Discard changes?" }),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("pre-fills the project from create-mode defaults", async () => {
    renderModal({ defaults: { projectId: "work" } });

    expect(
      await screen.findByRole("button", { name: "Work" }),
    ).toBeInTheDocument();
  });

  it("parses a quick-add priority token out of the title on create", async () => {
    window.api.tasks.create = vi
      .fn()
      .mockResolvedValue({ ok: true, task: existingTask });
    const user = userEvent.setup();
    renderModal({});

    const titleInput = screen.getByRole("textbox", { name: "Task title" });
    titleInput.textContent = "Buy milk p1";
    fireEvent.input(titleInput);

    await waitFor(() =>
      expect(screen.getByDisplayValue("P1")).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(window.api.tasks.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Buy milk", priority: "p1" }),
      );
    });
  });

  it("parses a reserved-label quick-add token as the Kanban status, not a label", async () => {
    window.api.tasks.create = vi
      .fn()
      .mockResolvedValue({ ok: true, task: existingTask });
    const user = userEvent.setup();
    renderModal({});

    const titleInput = screen.getByRole("textbox", { name: "Task title" });
    titleInput.textContent = "Ship it @todo";
    fireEvent.input(titleInput);

    await waitFor(() =>
      expect(screen.getByDisplayValue("Todo")).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(window.api.tasks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Ship it",
          kanbanStatus: "todo",
          labels: [],
        }),
      );
    });
  });

  it("overrides a field from a quick-add token in edit mode, then reverts to the task's original value once it's erased", async () => {
    const taskWithPriority: TaskDTO = { ...existingTask, priority: "p2" };
    renderModal({ task: taskWithPriority });

    const titleInput = screen.getByRole("textbox", { name: "Task title" });
    titleInput.textContent = "Write report p1";
    fireEvent.input(titleInput);

    await waitFor(() =>
      expect(screen.getByDisplayValue("P1")).toBeInTheDocument(),
    );

    titleInput.textContent = "Write report";
    fireEvent.input(titleInput);

    await waitFor(() =>
      expect(screen.getByDisplayValue("P2")).toBeInTheDocument(),
    );
  });

  it("submits the form when Enter is pressed in the title field", async () => {
    window.api.tasks.create = vi
      .fn()
      .mockResolvedValue({ ok: true, task: existingTask });
    const user = userEvent.setup();
    const { onClose } = renderModal({});

    const titleInput = screen.getByRole("textbox", { name: "Task title" });
    await user.click(titleInput);
    await user.type(titleInput, "Buy milk{Enter}");

    await waitFor(() => {
      expect(window.api.tasks.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Buy milk" }),
      );
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("suggests known projects while typing a '#' token and applies the pick", async () => {
    const user = userEvent.setup();
    renderModal({});

    const titleInput = screen.getByRole("textbox", { name: "Task title" });
    titleInput.textContent = "Ship it #Wo";
    fireEvent.input(titleInput);

    await user.click(await screen.findByRole("button", { name: "Work" }));

    expect(
      await screen.findByRole("button", { name: "Work" }),
    ).toBeInTheDocument();
  });

  it("has no Delete button in create mode", () => {
    renderModal({});

    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("asks for confirmation before deleting, closing the modal and deleting only after the second confirmation", async () => {
    window.api.tasks.delete = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    const { onClose } = renderModal({ task: existingTask });

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(
      await screen.findByRole("heading", { name: "Delete task?" }),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(window.api.tasks.delete).not.toHaveBeenCalled();

    await user.click(
      screen.getAllByRole("button", { name: "Delete" }).slice(-1)[0],
    );

    expect(onClose).toHaveBeenCalled();
    await waitFor(() =>
      expect(window.api.tasks.delete).toHaveBeenCalledWith("task-1"),
    );
  });

  it("cancels deletion without closing the modal or calling the API", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({ task: existingTask });

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const confirmDialog = await screen.findByRole("dialog", {
      name: "Delete task?",
    });
    await user.click(
      within(confirmDialog).getByRole("button", { name: "Cancel" }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Delete task?" }),
      ).not.toBeInTheDocument(),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(window.api.tasks.delete).not.toHaveBeenCalled();
  });

  it("shows a disabled sub-tasks placeholder in create mode", async () => {
    renderModal({});

    expect(
      await screen.findByText("Save this task first to add sub-tasks."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add sub-task" }),
    ).not.toBeInTheDocument();
  });

  it("hides the Kanban status field for a subtask, lists it under its parent, and navigates in on click", async () => {
    const user = userEvent.setup();
    renderModal({ task: existingTask });

    await user.click(await screen.findByText("Gather numbers"));

    expect(
      await screen.findByRole("button", { name: "← Write report" }),
    ).toBeInTheDocument();
    // The root frame stays mounted (just hidden) so its own field survives —
    // only the subtask frame must not add a second one.
    expect(screen.getAllByText("Kanban status")).toHaveLength(1);
  });

  it("disables the Project field for a subtask — its project is inherited, not independently editable", async () => {
    const user = userEvent.setup();
    renderModal({ task: existingTask });

    await user.click(await screen.findByText("Gather numbers"));
    await screen.findByRole("button", { name: "← Write report" });

    const projectInputs = screen.getAllByDisplayValue("Inbox");
    expect(projectInputs[projectInputs.length - 1]).toBeDisabled();
  });

  it("returns to the parent instead of closing the modal when a subtask is completed from its own header checkbox", async () => {
    window.api.tasks.complete = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    const { onClose } = renderModal({ task: existingTask });

    await user.click(await screen.findByText("Gather numbers"));
    await screen.findByRole("button", { name: "← Write report" });

    await user.click(
      screen.getByRole("checkbox", { name: 'Complete "Gather numbers"' }),
    );

    await waitFor(() =>
      expect(window.api.tasks.complete).toHaveBeenCalledWith("task-2"),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("heading", { name: "Edit task" }),
    ).toBeInTheDocument();
  });

  it("goes back to the parent on Cancel from a subtask, confirming first when dirty", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({ task: existingTask });

    await user.click(await screen.findByText("Gather numbers"));
    await screen.findByRole("button", { name: "← Write report" });

    const descriptionInputs =
      screen.getAllByPlaceholderText("Add a description");
    await user.type(descriptionInputs[descriptionInputs.length - 1], "!");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      await screen.findByRole("heading", { name: "Discard changes?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Discard" }));

    // Back on the parent frame, not the whole modal closed.
    expect(onClose).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("heading", { name: "Edit task" }),
    ).toBeInTheDocument();
  });

  it("opens a new-subtask frame inheriting the parent's project, and returns to the parent on save", async () => {
    window.api.tasks.create = vi
      .fn()
      .mockResolvedValue({ ok: true, task: existingSubtask });
    const user = userEvent.setup();
    renderModal({ task: existingTask });

    await user.click(screen.getByRole("button", { name: "Add sub-task" }));

    expect(
      await screen.findByRole("button", { name: "← Write report" }),
    ).toBeInTheDocument();
    // The still-mounted (hidden) parent frame also shows "Inbox" on its own
    // project chip — two matches confirms the new-subtask frame inherited it.
    // `getAllByText` (unlike `getAllByRole`) doesn't filter out the hidden
    // frame, which is exactly what lets this check both at once.
    await waitFor(() => expect(screen.getAllByText("Inbox")).toHaveLength(2));

    const titleInputs = screen.getAllByRole("textbox", {
      name: "Task title",
    });
    await user.type(titleInputs[titleInputs.length - 1], "New subtask");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(window.api.tasks.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: "New subtask", parentId: "task-1" }),
      );
    });
    // Back on the parent frame, not the whole modal closed.
    expect(
      await screen.findByRole("heading", { name: "Edit task" }),
    ).toBeInTheDocument();
  });
});
