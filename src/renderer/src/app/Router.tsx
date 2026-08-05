import { Center, Loader } from "@mantine/core";
import type { FC } from "react";
import { createHashRouter, RouterProvider } from "react-router";
import { DashboardPage } from "@/pages/dashboard";
import { LoginPage } from "@/pages/login";
import { TasksPage } from "@/pages/tasks";
import { AppLayout } from "./AppLayout";
import { useSession } from "./SessionContext";

const appRouter = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "tasks", element: <TasksPage /> },
    ],
  },
]);

const authRouter = createHashRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
]);

export const Router: FC = () => {
  const session = useSession();

  if (session.status === "loading") {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  return (
    <RouterProvider
      router={session.status === "authenticated" ? appRouter : authRouter}
    />
  );
};
