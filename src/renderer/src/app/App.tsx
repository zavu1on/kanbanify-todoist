import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { Notifications } from "@mantine/notifications";
import { Router } from "./Router";
import { SessionProvider } from "./SessionContext";
import { ThemeProvider } from "./ThemeProvider";

export function App() {
  return (
    <ThemeProvider>
      <Notifications />
      <SessionProvider>
        <Router />
      </SessionProvider>
    </ThemeProvider>
  );
}
