// Minimal Node typings for the few test files that read the locally built library from disk
// (vitest runs them in Node). The app itself never imports these modules.
declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding: "utf8"): string;
}
declare module "node:path" {
  export function join(...parts: string[]): string;
}
declare const __dirname: string;
