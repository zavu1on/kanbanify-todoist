import { Box, Paper } from "@mantine/core";
import type { FC } from "react";
import { GetTokenSteps } from "./GetTokenSteps";
import { LoginForm } from "./LoginForm";
import { LoginHeader } from "./LoginHeader";

export const LoginPage: FC = () => {
  return (
    <Box
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
      }}
      p="md"
    >
      <Paper w={480} p="xl" radius="md" withBorder>
        <LoginHeader />

        <GetTokenSteps />

        <LoginForm />
      </Paper>
    </Box>
  );
};
