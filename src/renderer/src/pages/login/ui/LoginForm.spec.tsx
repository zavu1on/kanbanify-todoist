import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { screen } from "@testing-library/react";
import { SessionProvider } from "@/app/SessionContext";
import { LoginForm } from "./LoginForm";

const renderLoginForm = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <LoginForm />
        </SessionProvider>
      </QueryClientProvider>
    </MantineProvider>,
  );
};

describe("LoginForm", () => {
  beforeEach(() => {
    Object.defineProperty(window, "api", {
      writable: true,
      configurable: true,
      value: {
        auth: {
          login: vi.fn(),
          checkSession: vi.fn().mockResolvedValue({ status: "no_token" }),
          logout: vi.fn(),
        },
      },
    });
  });

  it("disables the login button while the access token field is empty", () => {
    renderLoginForm();

    expect(screen.getByRole("button", { name: "Log in" })).toBeDisabled();
  });

  it("enables the login button once an access token is entered", async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText("Access token"), "short-token");

    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
  });

  it("shows a validation error when submitting a token that is too short", async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText("Access token"), "short-token");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Access token is too short"),
    ).toBeInTheDocument();
  });

  it("shows a validation error when the token contains whitespace", async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.type(
      screen.getByLabelText("Access token"),
      `${"a".repeat(20)} ${"b".repeat(20)}`,
    );
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Access token must not contain whitespace"),
    ).toBeInTheDocument();
  });

  it("does not show a validation error when submitting a valid token", async () => {
    vi.mocked(window.api.auth.login).mockResolvedValue({
      ok: true,
      user: {
        id: "1",
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        avatarUrl: null,
      },
    });
    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText("Access token"), "a".repeat(40));
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      screen.queryByText("Access token is too short"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Access token must not contain whitespace"),
    ).not.toBeInTheDocument();
  });

  it("calls the IPC login bridge with the entered access token", async () => {
    vi.mocked(window.api.auth.login).mockResolvedValue({
      ok: true,
      user: {
        id: "1",
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        avatarUrl: null,
      },
    });
    const user = userEvent.setup();
    renderLoginForm();

    const token = "a".repeat(40);
    await user.type(screen.getByLabelText("Access token"), token);
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(window.api.auth.login).toHaveBeenCalledWith(token);
    });
  });

  it("shows the backend error message when authentication fails", async () => {
    vi.mocked(window.api.auth.login).mockResolvedValue({
      ok: false,
      error: { type: "invalid_token", message: "Access token is invalid" },
    });
    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText("Access token"), "a".repeat(40));
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Access token is invalid"),
    ).toBeInTheDocument();
  });
});
