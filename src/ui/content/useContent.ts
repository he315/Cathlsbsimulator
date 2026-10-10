// Lazily loads the curriculum (tracks, cases, glossary) as one async chunk so
// the initial app bundle stays small. Cached after the first load.
import { useEffect, useState } from "react";

export type ContentModule = typeof import("../../content/index");

let cache: ContentModule | null = null;
let pending: Promise<ContentModule> | null = null;

export function loadContent(): Promise<ContentModule> {
  if (cache) return Promise.resolve(cache);
  if (!pending) pending = import("../../content/index").then((m) => (cache = m));
  return pending;
}

export function useContent(): ContentModule | null {
  const [c, setC] = useState<ContentModule | null>(cache);
  useEffect(() => {
    let alive = true;
    if (!cache) loadContent().then((m) => alive && setC(m));
    return () => {
      alive = false;
    };
  }, []);
  return c;
}
