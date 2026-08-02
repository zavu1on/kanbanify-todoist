import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
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
      "@/shared": path.resolve(import.meta.dirname, "src/renderer/src/shared"),
      "@/main": path.resolve(import.meta.dirname, "src/main"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.spec.{ts,tsx}"],
  },
});
