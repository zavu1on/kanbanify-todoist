import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import type { FilterDTO } from "@/main/filters";
import { FilterFormModal } from "./FilterFormModal";

const workFilter: FilterDTO = {
  id: 1,
  title: "Urgent work",
  color: "red",
  query: "#Work & p1",
};

const renderModal = (props: { filter?: FilterDTO }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onClose = vi.fn();

  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <FilterFormModal opened onClose={onClose} filter={props.filter} />
      </QueryClientProvider>
    </MantineProvider>,
  );

  return { onClose };
};

describe("FilterFormModal", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: {
        projects: {
          list: vi.fn().mockResolvedValue({
            ok: true,
            projects: [
              {
                id: "p1",
                name: "Work",
                description: "",
                color: "blue",
                parentId: null,
                isInboxProject: false,
                isArchived: false,
                activeTaskCount: 0,
              },
            ],
          }),
        },
        labels: {
          list: vi.fn().mockResolvedValue({ ok: true, labels: [] }),
        },
        filters: {
          list: vi.fn().mockResolvedValue({ ok: true, filters: [] }),
          create: vi.fn(),
          update: vi.fn(),
        },
      },
    });
  });

  it("shows an 'Add filter' title with 'Today + Overdue' preselected in create mode", async () => {
    renderModal({});

    expect(
      screen.getByRole("heading", { name: "Add filter" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Today + Overdue" }),
    ).toBeChecked();
    expect(screen.getByText("query=(today | overdue)")).toBeInTheDocument();
  });

  it("shows an 'Edit filter' title and reconstructs the saved query's fields", async () => {
    renderModal({ filter: workFilter });

    expect(await screen.findByDisplayValue("Urgent work")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "P1" })).toBeChecked();
    expect(screen.getByRole("combobox", { name: "Project" })).toHaveValue(
      "Work",
    );
    expect(screen.getByText("query=#Work & p1")).toBeInTheDocument();
  });

  it("shows a validation error for a blank title and does not call the IPC bridge", async () => {
    const user = userEvent.setup();
    renderModal({ filter: workFilter });

    await user.clear(await screen.findByLabelText("Title"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(window.api.filters.update).not.toHaveBeenCalled();
  });

  it("submits the trimmed title and built query on create, then closes the modal", async () => {
    window.api.filters.create = vi.fn().mockResolvedValue({
      ok: true,
      filter: { ...workFilter, id: 2, title: "New" },
    });
    const user = userEvent.setup();
    const { onClose } = renderModal({});

    await user.type(screen.getByLabelText("Title"), "  New  ");
    await user.click(screen.getByRole("checkbox", { name: "P1" }));
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(window.api.filters.create).toHaveBeenCalledWith({
        title: "New",
        color: "charcoal",
        query: "p1 & (today | overdue)",
      });
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
