import { Alert, Button, Center, Loader, Stack } from "@mantine/core";
import { type FC, useEffect, useMemo } from "react";
import {
  createHashRouter,
  Navigate,
  type RouteObject,
  RouterProvider,
} from "react-router";
import { CalendarPage } from "@/pages/calendar";
import { FilterPage } from "@/pages/filter";
import { LoginPage } from "@/pages/login";
import { TasksPage } from "@/pages/tasks";
import { TodayPage } from "@/pages/today";
import { AppLayout } from "./AppLayout";
import { useSession } from "./SessionContext";

const RouteError: FC = () => (
  <Center h="100vh" p="md">
    <Stack align="center">
      <Alert color="red" title="Something went wrong">
        The page failed to render.
      </Alert>
      <Button onClick={() => window.location.reload()}>Reload</Button>
    </Stack>
  </Center>
);

const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/tasks" replace /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "projects/:projectId", element: <TasksPage /> },
      { path: "filters/:filterId", element: <FilterPage /> },
      { path: "today", element: <TodayPage /> },
      { path: "calendar", element: <CalendarPage /> },
    ],
  },
];

const authRoutes: RouteObject[] = [{ path: "/", element: <LoginPage /> }];

export const Router: FC = () => {
  const session = useSession();
  const isAuthenticated = session.status === "authenticated";
  const isLoading = session.status === "loading";

  const router = useMemo(
    () => createHashRouter(isAuthenticated ? appRoutes : authRoutes),
    [isAuthenticated],
  );
  useEffect(() => () => router.dispose(), [router]);

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  return (
    <RouterProvider key={isAuthenticated ? "app" : "auth"} router={router} />
  );
};
