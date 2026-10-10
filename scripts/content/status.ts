// Build-status snapshot of the manual curriculum: per-module counts from the module files.
// Run: npx vite-node scripts/content/status.ts > <out.json>
import type { ModuleFile } from "../../src/content/manual/index";

const FILES = import.meta.glob<ModuleFile>(["../../src/content/manual/*/*.ts", "!../../src/content/manual/**/*.test.ts"], { eager: true });
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const out: Record<string, unknown>[] = [];
for (const [path, f] of Object.entries(FILES)) {
  const m = f.module;
  let w = 0;
  let checks = 0;
  let videos = 0;
  let tipBlocks = 0;
  for (const l of m.lessons)
    for (const b of l.blocks) {
      w += words(JSON.stringify(b).replace(/"kind":"[a-z]+"|[{}\[\]",:]/g, " "));
      if (b.kind === "check") checks++;
      if (b.kind === "video") videos++;
      if (b.kind === "tip") tipBlocks++;
    }
  out.push({
    path: path.replace("../../", ""),
    id: m.id,
    title: m.title,
    lessons: m.lessons.length,
    words: w,
    checks,
    videos,
    quiz: m.quiz.length,
    cases: (f.cases ?? []).length,
    caseSteps: (f.cases ?? []).reduce((a, c) => a + c.steps.length, 0),
    tips: (f.tips ?? []).length,
    tipBlocks,
    refs: (f.refs ?? []).length,
    topics: [...new Set(m.lessons.flatMap((l) => l.topics ?? []))],
  });
}
console.log(JSON.stringify(out));
