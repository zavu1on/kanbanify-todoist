import { Button, PasswordInput, Stack } from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import type { FC } from "react";
import { authFormSchema } from "../model/auth";

export const LoginForm: FC = () => {
  const form = useForm({
    initialValues: {
      accessToken: "",
    },
    validate: schemaResolver(authFormSchema, { sync: true }),
  });

  const handleSubmit = form.onSubmit(() => {
    // TODO: send form.getValues().accessToken to the main process via IPC for validation
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="sm">
        <PasswordInput
          label="Access token"
          placeholder="Paste your Todoist access token"
          autoComplete="off"
          data-autofocus
          {...form.getInputProps("accessToken")}
        />

        <Button
          type="submit"
          disabled={form.values.accessToken.trim().length === 0}
          fullWidth
        >
          Log in
        </Button>
      </Stack>
    </form>
  );
};
