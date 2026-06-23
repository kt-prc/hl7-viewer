/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  // Privacy: this is a fully static SPA. No proxying, no server-side anything.
  server: { host: "127.0.0.1", port: 5173 },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
