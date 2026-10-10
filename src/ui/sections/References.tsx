import { useMemo, useState } from "react";
import { REFERENCES } from "../../content/refs";
import type { RefKind } from "../../content/schema";
import { RefBadge } from "../content/RefList";
import SectionShell from "../SectionShell";

const KIND_LABEL: Record<RefKind, string> = {
  supplied: "Supplied notes",
  book: "Textbooks",
  handbook: "Handbooks",
  guideline: "Guidelines",
  consensus: "Consensus documents",
  trial: "Trials",
  paper: "Papers",
  case: "Case reports",
  web: "Web resources",
};
const ORDER: RefKind[] = ["supplied", "book", "handbook", "guideline", "consensus", "trial", "paper", "case", "web"];

export default function References() {
  const [q, setQ] = useState("");
  const [onlyChecked, setOnlyChecked] = useState(false);
  const refs = useMemo(() => {
    const s = q.trim().toLowerCase();
    return REFERENCES.filter(
      (r) => (!onlyChecked || r.verified) && (!s || r.citation.toLowerCase().includes(s) || (r.note ?? "").toLowerCase().includes(s))
    );
  }, [q, onlyChecked]);
  const checked = REFERENCES.filter((r) => r.verified).length;

  return (
    <SectionShell
      title="References"
      subtitle={`${REFERENCES.length} sources · ${checked} checked against the original. "Unchecked" means the citation details have not yet been verified; read the source before relying on it.`}
      actions={
        <>
          <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
            <input type="checkbox" checked={onlyChecked} onChange={(e) => setOnlyChecked(e.target.checked)} />
            checked only
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="bg-base-800 border border-line rounded-md px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint w-56"
          />
        </>
      }
    >
      <div className="max-w-4xl space-y-6">
        {ORDER.map((k) => {
          const list = refs.filter((r) => r.kind === k);
          if (list.length === 0) return null;
          return (
            <section key={k}>
              <div className="stat-label mb-2">{KIND_LABEL[k]}</div>
              <div className="space-y-1.5">
                {list.map((r) => (
                  <div key={r.id} className="panel px-4 py-2.5">
                    <div className="text-[14px] text-ink-soft leading-relaxed">
                      {r.citation}{" "}
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                          link
                        </a>
                      )}{" "}
                      <RefBadge verified={r.verified} />
                    </div>
                    {r.note && <div className="text-[12px] text-ink-faint mt-0.5">{r.note}</div>}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </SectionShell>
  );
}
