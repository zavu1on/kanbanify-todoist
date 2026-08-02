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
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/renderer"),
    },
    plugins: [react()],
  },
});
