import type { FC } from "react";
import { createHashRouter, RouterProvider } from "react-router";
import { DashboardPage } from "@/pages/dashboard";
import { LoginPage } from "@/pages/login";

const appRouter = createHashRouter([
  {
    path: "/",
    element: <DashboardPage />,
  },
]);

const authRouter = createHashRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
]);

export const Router: FC = () => {
  return <RouterProvider router={authRouter} />;
};
