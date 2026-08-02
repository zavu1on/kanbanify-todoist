import { MantineProvider } from "@mantine/core";
import { screen } from "@testing-library/react";
import { LoginForm } from "./LoginForm";

const renderLoginForm = () => {
  return render(
    <MantineProvider>
      <LoginForm />
    </MantineProvider>,
  );
};

describe("LoginForm", () => {
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

    expect(await screen.findByText("Access token is too short")).toBeInTheDocument();
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
    const user = userEvent.setup();
    renderLoginForm();

    await user.type(screen.getByLabelText("Access token"), "a".repeat(40));
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.queryByText("Access token is too short")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Access token must not contain whitespace"),
    ).not.toBeInTheDocument();
  });
});
