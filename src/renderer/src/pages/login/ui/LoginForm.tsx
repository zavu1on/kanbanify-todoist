import { Alert, Button, PasswordInput, Stack } from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import type { FC } from "react";
import { useState } from "react";
import { useSession } from "@/app/SessionContext";
import { authFormSchema, loginWithAccessToken } from "../model/auth";

export const LoginForm: FC = () => {
  const session = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      accessToken: "",
    },
    validate: schemaResolver(authFormSchema, { sync: true }),
  });

  const handleSubmit = form.onSubmit(async ({ accessToken }) => {
    setIsSubmitting(true);
    const result = await loginWithAccessToken(accessToken);
    setIsSubmitting(false);

    if (result.ok) {
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
    } else {
      form.setFieldError("accessToken", result.error.message);
    }
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
          loading={isSubmitting}
          disabled={form.values.accessToken.trim().length === 0}
          fullWidth
        >
          Log in
        </Button>
      </Stack>
    </form>
  );
};
