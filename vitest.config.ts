import { defineConfig } from "vitest/config";

// Pure engine tests run in Node — the simulation/ layer is framework-free and
// deterministic, so no jsdom is needed. UI/store tests that touch zustand also
// run fine in Node (no DOM required).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    watch: false,
  },
});
