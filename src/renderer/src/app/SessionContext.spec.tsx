import { screen, waitFor } from "@testing-library/react";
import { SessionProvider, useSession } from "./SessionContext";

const user = {
  id: "1",
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  avatarUrl: null,
  weekStartsOn: 1,
};

const SessionProbe = () => {
  const session = useSession();

  return (
    <div>
      <span data-testid="status">{session.status}</span>
      {session.status === "authenticated" && (
        <span>{session.user.fullName}</span>
      )}
      {session.status === "unauthenticated" && session.errorMessage && (
        <span>{session.errorMessage}</span>
      )}
      <button type="button" onClick={() => session.authenticate(user)}>
        Authenticate
      </button>
      <button type="button" onClick={() => session.logout()}>
        Log out
      </button>
    </div>
  );
};

const mockCheckSession = (result: unknown) => {
  Object.defineProperty(window, "api", {
    writable: true,
    configurable: true,
    value: {
      auth: {
        checkSession: vi.fn().mockResolvedValue(result),
        logout: vi.fn().mockResolvedValue({ ok: true }),
      },
    },
  });
};

describe("SessionContext", () => {
  it("starts in loading state before the session check resolves", () => {
    mockCheckSession({ status: "no_token" });
    render(
      <SessionProvider>
        <SessionProbe />
      </SessionProvider>,
    );

    expect(screen.getByTestId("status")).toHaveTextContent("loading");
  });

  it("becomes unauthenticated without a message when no token is stored", async () => {
    mockCheckSession({ status: "no_token" });
    render(
      <SessionProvider>
        <SessionProbe />
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    });
  });

  it("becomes authenticated with the fetched user when the stored token is valid", async () => {
    mockCheckSession({ status: "authenticated", user });
    render(
      <SessionProvider>
        <SessionProbe />
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    });
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("becomes unauthenticated with the backend error message when the stored token is invalid", async () => {
    mockCheckSession({
      status: "error",
      error: { type: "invalid_token", message: "Token expired" },
    });
    render(
      <SessionProvider>
        <SessionProbe />
      </SessionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    });
    expect(screen.getByText("Token expired")).toBeInTheDocument();
  });

  it("authenticate() switches straight to authenticated without another IPC call", async () => {
    mockCheckSession({ status: "no_token" });
    render(
      <SessionProvider>
        <SessionProbe />
      </SessionProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    });

    await userEvent.click(screen.getByRole("button", { name: "Authenticate" }));

    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    expect(window.api.auth.checkSession).toHaveBeenCalledOnce();
  });

  it("logout() calls the IPC bridge and resets to unauthenticated", async () => {
    mockCheckSession({ status: "authenticated", user });
    render(
      <SessionProvider>
        <SessionProbe />
      </SessionProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    });

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated");
    });
    expect(window.api.auth.logout).toHaveBeenCalledOnce();
  });

  it("throws when useSession is used outside a SessionProvider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => render(<SessionProbe />)).toThrow(
      "useSession must be used within a SessionProvider",
    );

    consoleError.mockRestore();
  });
});
