import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import { AutoLaunchSwitch } from "./AutoLaunchSwitch";

const renderSwitch = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <AutoLaunchSwitch />
      </QueryClientProvider>
    </MantineProvider>,
  );
};

describe("AutoLaunchSwitch", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: {
        startup: {
          getAutoLaunch: vi.fn(),
          setAutoLaunch: vi.fn(),
        },
      },
    });
  });

  it("reflects the current auto-launch state once loaded", async () => {
    window.api.startup.getAutoLaunch = vi
      .fn()
      .mockResolvedValue({ ok: true, enabled: true });
    renderSwitch();

    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", { name: "Launch at system startup" }),
      ).toBeChecked();
    });
  });

  it("enables auto-launch when toggled on", async () => {
    window.api.startup.getAutoLaunch = vi
      .fn()
      .mockResolvedValue({ ok: true, enabled: false });
    window.api.startup.setAutoLaunch = vi
      .fn()
      .mockResolvedValue({ ok: true, enabled: true });
    const user = userEvent.setup();
    renderSwitch();

    const toggle = await screen.findByRole("checkbox", {
      name: "Launch at system startup",
    });
    await waitFor(() => expect(toggle).not.toBeChecked());
    await user.click(toggle);

    await waitFor(() => {
      expect(window.api.startup.setAutoLaunch).toHaveBeenCalledWith(true);
    });
  });

  it("rolls back the toggle if the update fails", async () => {
    window.api.startup.getAutoLaunch = vi
      .fn()
      .mockResolvedValue({ ok: true, enabled: false });
    window.api.startup.setAutoLaunch = vi.fn().mockResolvedValue({
      ok: false,
      error: { type: "unknown", message: "boom" },
    });
    const user = userEvent.setup();
    renderSwitch();

    const toggle = await screen.findByRole("checkbox", {
      name: "Launch at system startup",
    });
    await waitFor(() => expect(toggle).not.toBeChecked());
    await user.click(toggle);

    await waitFor(() => {
      expect(window.api.startup.setAutoLaunch).toHaveBeenCalledWith(true);
    });
    await waitFor(() => expect(toggle).not.toBeChecked());
  });
});
