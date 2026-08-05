import { AppShell, MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { SessionProvider } from "@/app/SessionContext";
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
        },
      },
    });
  });

  it("shows the unfinished task count next to the Tasks link", async () => {
    window.api.tasks.count = vi.fn().mockResolvedValue({ ok: true, count: 7 });
    renderSidebar();

    expect(await screen.findByText("7")).toBeInTheDocument();
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
});
