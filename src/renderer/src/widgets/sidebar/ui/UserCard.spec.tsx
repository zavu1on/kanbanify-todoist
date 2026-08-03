import { MantineProvider } from "@mantine/core";
import { screen, waitFor, within } from "@testing-library/react";
import { SessionProvider } from "@/app/SessionContext";
import { UserCard } from "./UserCard";

const renderUserCard = (avatarUrl: string | null = null) => {
  return render(
    <MantineProvider>
      <SessionProvider>
        <UserCard
          fullName="Ada Lovelace"
          email="ada@example.com"
          avatarUrl={avatarUrl}
        />
      </SessionProvider>
    </MantineProvider>,
  );
};

describe("UserCard", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: {
        auth: {
          checkSession: vi.fn().mockResolvedValue({ status: "no_token" }),
          logout: vi.fn().mockResolvedValue({ ok: true }),
        },
      },
    });
  });

  it("shows the user's name and email", () => {
    renderUserCard();

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("renders the avatar photo when one is provided", () => {
    renderUserCard("https://example.com/avatar.png");

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/avatar.png",
    );
  });

  it("asks for confirmation before logging out", async () => {
    const user = userEvent.setup();
    renderUserCard();

    await user.click(screen.getByText("Ada Lovelace"));
    await user.click(await screen.findByText("Log out"));

    expect(
      await screen.findByRole("dialog", { name: "Log out?" }),
    ).toBeInTheDocument();
    expect(window.api.auth.logout).not.toHaveBeenCalled();
  });

  it("logs out and closes the dialog once confirmed", async () => {
    const user = userEvent.setup();
    renderUserCard();

    await user.click(screen.getByText("Ada Lovelace"));
    await user.click(await screen.findByText("Log out"));

    const dialog = await screen.findByRole("dialog", { name: "Log out?" });
    await user.click(within(dialog).getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(window.api.auth.logout).toHaveBeenCalledOnce();
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("cancels without logging out", async () => {
    const user = userEvent.setup();
    renderUserCard();

    await user.click(screen.getByText("Ada Lovelace"));
    await user.click(await screen.findByText("Log out"));

    const dialog = await screen.findByRole("dialog", { name: "Log out?" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(window.api.auth.logout).not.toHaveBeenCalled();
  });
});
