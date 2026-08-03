import { AppShell } from "@mantine/core";
import type { FC } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "@/widgets/sidebar";

export const AppLayout: FC = () => {
  return (
    <AppShell navbar={{ width: 260, breakpoint: "sm" }} padding="md">
      <Sidebar />

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};
