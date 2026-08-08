import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";

if (import.meta.env.DEV) {
  const { scan } = await import("react-scan");
  scan();
}

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container not found");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
