import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

import { Notifications } from "@mantine/notifications";
import { QueryProvider } from "./QueryProvider";
import { Router } from "./Router";
import { SessionProvider } from "./SessionContext";
import { ThemeProvider } from "./ThemeProvider";

export function App() {
  return (
    <ThemeProvider>
      <Notifications />
      <QueryProvider>
        <SessionProvider>
          <Router />
        </SessionProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
