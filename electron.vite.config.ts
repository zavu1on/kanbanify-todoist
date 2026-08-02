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
