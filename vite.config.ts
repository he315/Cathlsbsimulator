import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import angioLibrary from "./scripts/vite-angio-library.mjs";
import buildStatus from "./scripts/vite-build-status.mjs";

export default defineConfig({
  plugins: [react(), angioLibrary("."), buildStatus(".")],
  server: {
    port: 5173,
    open: true,
  },
  // the physics worker is created as a module worker ({ type: "module" }) and modules it bundles use
  // top-level await (their command-line entry points), which neither the default iife worker format nor
  // the default es2020 target allows; the app already needs a WebGL2 desktop browser, all of which run ES2022
  build: { target: "es2022" },
  worker: { format: "es" },
});
