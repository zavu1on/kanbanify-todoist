import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import type { CommentDTO } from "@/main/comments";
import { CommentsSection } from "./CommentsSection";

const existingComment: CommentDTO = {
  id: "comment-1",
  taskId: "task-1",
  content: "Looks good",
  postedAt: "2026-08-01T12:00:00.000Z",
  attachment: null,
};

const renderSection = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <CommentsSection taskId="task-1" />
      </QueryClientProvider>
    </MantineProvider>,
  );
};

describe("CommentsSection", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: {
        comments: {
          list: vi
            .fn()
            .mockResolvedValue({ ok: true, comments: [existingComment] }),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        },
        attachments: {
          download: vi.fn().mockResolvedValue({
            ok: true,
            saved: true,
            filePath: "/tmp/report.pdf",
          }),
        },
      },
    });
  });

  it("lists existing comments once loaded", async () => {
    renderSection();

    expect(await screen.findByText("Looks good")).toBeInTheDocument();
  });

  it("adds a comment through the inline form", async () => {
    window.api.comments.create = vi.fn().mockResolvedValue({
      ok: true,
      comment: { ...existingComment, id: "comment-2", content: "New note" },
    });
    const user = userEvent.setup();
    renderSection();
    await screen.findByText("Looks good");

    await user.click(screen.getByPlaceholderText("Add a comment..."));
    await user.type(
      screen.getByPlaceholderText("Add a comment..."),
      "New note",
    );
    await user.click(screen.getByRole("button", { name: "Comment" }));

    expect(await screen.findByText("New note")).toBeInTheDocument();
    await waitFor(() =>
      expect(window.api.comments.create).toHaveBeenCalledWith({
        taskId: "task-1",
        content: "New note",
      }),
    );
  });

  it("edits a comment through its context menu", async () => {
    window.api.comments.update = vi.fn().mockResolvedValue({
      ok: true,
      comment: { ...existingComment, content: "Edited" },
    });
    const user = userEvent.setup();
    renderSection();
    await screen.findByText("Looks good");

    await user.click(screen.getByRole("button", { name: "Comment actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }));

    const textarea = await screen.findByDisplayValue("Looks good");
    await user.clear(textarea);
    await user.type(textarea, "Edited");
    await user.click(screen.getByRole("button", { name: "Update" }));

    expect(await screen.findByText("Edited")).toBeInTheDocument();
    await waitFor(() =>
      expect(window.api.comments.update).toHaveBeenCalledWith("comment-1", {
        content: "Edited",
      }),
    );
  });

  it("deletes a comment after confirming", async () => {
    window.api.comments.delete = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderSection();
    await screen.findByText("Looks good");

    await user.click(screen.getByRole("button", { name: "Comment actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(
      await screen.findByRole("heading", { name: "Delete comment?" }),
    ).toBeInTheDocument();
    expect(window.api.comments.delete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(window.api.comments.delete).toHaveBeenCalledWith("comment-1"),
    );
    await waitFor(() =>
      expect(screen.queryByText("Looks good")).not.toBeInTheDocument(),
    );
  });

  it("downloads a comment's attachment", async () => {
    window.api.comments.list = vi.fn().mockResolvedValue({
      ok: true,
      comments: [
        {
          ...existingComment,
          attachment: {
            resourceType: "file",
            fileName: "report.pdf",
            fileType: "application/pdf",
            fileUrl: "https://files.todoist.com/report.pdf",
          },
        },
      ],
    });
    const user = userEvent.setup();
    renderSection();
    await screen.findByText("Looks good");

    await user.click(
      screen.getByRole("button", { name: "Download report.pdf" }),
    );

    await waitFor(() =>
      expect(window.api.attachments.download).toHaveBeenCalledWith({
        fileUrl: "https://files.todoist.com/report.pdf",
        fileName: "report.pdf",
      }),
    );
  });
});
