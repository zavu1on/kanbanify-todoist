import { Alert, Button, PasswordInput, Stack } from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";
import type { FC } from "react";
import { useSession } from "@/app/SessionContext";
import { loginWithAccessToken } from "../api/loginWithAccessToken";
import { authFormSchema } from "../model/auth";

export const LoginForm: FC = () => {
  const session = useSession();

  const form = useForm({
    initialValues: {
      accessToken: "",
    },
    validate: schemaResolver(authFormSchema, { sync: true }),
  });

  const loginMutation = useMutation({
    mutationFn: loginWithAccessToken,
    onSuccess: (result) => {
      if (!result.ok) {
        form.setFieldError("accessToken", result.error.message);
        return;
      }

      notifications.show({
        color: "green",
        title: "Signed in",
        message: `Welcome, ${result.user.fullName} (${result.user.email})`,
      });

      if (result.tokenStorageWarning) {
        notifications.show({
          color: "yellow",
          title: "Token stored without encryption",
          message: result.tokenStorageWarning,
          autoClose: false,
        });
      }

      form.reset();
      session.authenticate(result.user);
    },
  });

  const handleSubmit = form.onSubmit(({ accessToken }) => {
    loginMutation.mutate(accessToken);
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="sm">
        {session.status === "unauthenticated" && session.errorMessage && (
          <Alert color="red" title="Session expired">
            {session.errorMessage}
          </Alert>
        )}

        <PasswordInput
          label="Access token"
          placeholder="Paste your Todoist access token"
          autoComplete="off"
          data-autofocus
          {...form.getInputProps("accessToken")}
        />

        <Button
          type="submit"
          loading={loginMutation.isPending}
          disabled={form.values.accessToken.trim().length === 0}
          fullWidth
        >
          Log in
        </Button>
      </Stack>
    </form>
  );
};
