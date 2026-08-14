import { Center, Loader } from "@mantine/core";
import type { FC } from "react";
import { createHashRouter, Navigate, RouterProvider } from "react-router";
import { CalendarPage } from "@/pages/calendar";
import { LoginPage } from "@/pages/login";
import { TasksPage } from "@/pages/tasks";
import { AppLayout } from "./AppLayout";
import { useSession } from "./SessionContext";

const appRouter = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/tasks" replace /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "projects/:projectId", element: <TasksPage /> },
      { path: "calendar", element: <CalendarPage /> },
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
