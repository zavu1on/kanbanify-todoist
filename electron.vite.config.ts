import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

export default defineConfig({
  main: {
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/main"),
    },
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/preload"),
    },
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    root: "src/renderer",
    // Vite's default `localhost` binding resolves to the IPv6 loopback
    // (`::1`) first on this machine, which Electron's Chromium network stack
    // then fails to connect to (ERR_CONNECTION_REFUSED) — pin IPv4 instead.
    server: {
      host: "127.0.0.1",
    },
    resolve: {
      alias: {
        "@/app": path.resolve(import.meta.dirname, "src/renderer/src/app"),
        "@/pages": path.resolve(import.meta.dirname, "src/renderer/src/pages"),
        "@/widgets": path.resolve(
          import.meta.dirname,
          "src/renderer/src/widgets",
        ),
        "@/features": path.resolve(
          import.meta.dirname,
          "src/renderer/src/features",
        ),
        "@/entities": path.resolve(
          import.meta.dirname,
          "src/renderer/src/entities",
        ),
        "@/shared": path.resolve(
          import.meta.dirname,
          "src/renderer/src/shared",
        ),
        "@/main": path.resolve(import.meta.dirname, "src/main"),
      },
    },
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/renderer"),
    },
    plugins: [react()],
  },
});
