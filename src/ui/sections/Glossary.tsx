import { useMemo, useState } from "react";
import { useContent } from "../content/useContent";
import SectionShell from "../SectionShell";

export default function Glossary() {
  const content = useContent();
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (content?.GLOSSARY ?? [])
      .filter((g) => !s || g.term.toLowerCase().includes(s) || g.definition.toLowerCase().includes(s))
      .slice()
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [content, q]);

  const groups = useMemo(() => {
    const m = new Map<string, typeof list>();
    for (const g of list) {
      const k = /[a-z]/i.test(g.term[0]) ? g.term[0].toUpperCase() : "#";
      m.set(k, [...(m.get(k) ?? []), g]);
    }
    return [...m.entries()];
  }, [list]);

  return (
    <SectionShell
      title="Glossary"
      subtitle={content ? `${content.GLOSSARY.length} terms and abbreviations` : "Loading…"}
      actions={
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search terms"
          autoFocus
          className="bg-base-800 border border-line rounded-md px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint w-64"
        />
      }
    >
      <div className="max-w-4xl">
        {groups.length === 0 && <div className="text-sm text-ink-faint">No terms match.</div>}
        {groups.map(([k, gs]) => (
          <section key={k} className="mb-5">
            <div className="text-accent font-semibold text-lg mb-1">{k}</div>
            <dl className="divide-y divide-line/60 border-y border-line/60">
              {gs.map((g) => (
                <div key={g.term} className="grid md:grid-cols-[220px_1fr] gap-x-4 py-2">
                  <dt className="text-[14px] text-ink font-medium">{g.term}</dt>
                  <dd className="text-[14px] text-ink-soft leading-relaxed">{g.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </SectionShell>
  );
}
