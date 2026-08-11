import { MantineProvider } from "@mantine/core";
import { screen } from "@testing-library/react";
import { CommentForm } from "./CommentForm";

const renderForm = (
  props: Partial<React.ComponentProps<typeof CommentForm>> = {},
) => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  render(
    <MantineProvider>
      <CommentForm
        mode="create"
        onSubmit={onSubmit}
        onCancel={onCancel}
        {...props}
      />
    </MantineProvider>,
  );

  return { onSubmit, onCancel };
};

describe("CommentForm", () => {
  it("shows 'Comment' as the submit label in create mode", () => {
    renderForm({ mode: "create" });

    expect(screen.getByRole("button", { name: "Comment" })).toBeInTheDocument();
  });

  it("shows 'Update' as the submit label in edit mode", () => {
    renderForm({ mode: "edit", initialContent: "Original" });

    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
  });

  it("submits the entered content", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(
      screen.getByPlaceholderText("Add a comment..."),
      "Looks good",
    );
    await user.click(screen.getByRole("button", { name: "Comment" }));

    expect(onSubmit).toHaveBeenCalledWith("Looks good", { type: "keep" });
  });

  it("submits on Enter when the textarea is focused", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    const textarea = screen.getByPlaceholderText("Add a comment...");
    await user.type(textarea, "Looks good{Enter}");

    expect(onSubmit).toHaveBeenCalledWith("Looks good", { type: "keep" });
  });

  it("inserts a newline instead of submitting on Shift+Enter", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    const textarea = screen.getByPlaceholderText("Add a comment...");
    await user.type(textarea, "Line one{Shift>}{Enter}{/Shift}Line two");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(textarea).toHaveValue("Line one\nLine two");
  });

  it("does not submit empty content", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole("button", { name: "Comment" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("cancels immediately when the form is untouched", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalled();
  });

  it("confirms before discarding a dirty form", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();

    await user.type(screen.getByPlaceholderText("Add a comment..."), "Draft");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("heading", { name: "Discard comment?" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("adds a picked file as a removable chip", async () => {
    const user = userEvent.setup();
    renderForm();

    const file = new File(["content"], "report.pdf", {
      type: "application/pdf",
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);

    expect(screen.getByText("report.pdf")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove report.pdf" }));
    expect(screen.queryByText("report.pdf")).not.toBeInTheDocument();
  });

  it("submits a picked file as a 'replace' attachment change", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    const file = new File(["content"], "report.pdf", {
      type: "application/pdf",
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);
    await user.type(
      screen.getByPlaceholderText("Add a comment..."),
      "See attached",
    );
    await user.click(screen.getByRole("button", { name: "Comment" }));

    expect(onSubmit).toHaveBeenCalledWith("See attached", {
      type: "replace",
      file,
    });
  });

  it("rejects a file over the size limit without attaching it", async () => {
    const user = userEvent.setup();
    renderForm();

    const oversizedFile = new File(
      [new ArrayBuffer(6 * 1024 * 1024)],
      "huge.zip",
    );
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, oversizedFile);

    expect(screen.queryByText("huge.zip")).not.toBeInTheDocument();
  });

  it("shows an existing attachment and submits 'remove' when it's cleared", async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      mode: "edit",
      initialContent: "Original",
      initialAttachment: {
        resourceType: "file",
        fileName: "report.pdf",
        fileType: "application/pdf",
        fileUrl: "https://files.todoist.com/report.pdf",
      },
    });

    expect(screen.getByText("report.pdf")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove report.pdf" }));
    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(onSubmit).toHaveBeenCalledWith("Original", { type: "remove" });
  });
});
