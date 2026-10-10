// The attending and procedure log.
// (split from src/ui/access/panels.tsx by proc-foundation-scenarios-ledger; panels.tsx re-exports it).
import { useEffect, useRef } from "react";
import { clock, useSession } from "../panels";

export function LogPanel() {
  const s = useSession();
  const ref = useRef<HTMLDivElement>(null);
  const n = s.log.length;
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [n]);
  const tone: Record<string, string> = { attending: "text-ink", patient: "text-warn", nurse: "text-warn", result: "text-ink-soft", action: "text-ink-soft", event: "text-ink-faint" };
  const who: Record<string, string> = { attending: "Attending", patient: "Patient", nurse: "Nurse", result: "", action: "", event: "" };
  return (
    <div className="panel p-0 flex-1 min-h-0 flex flex-col">
      <div className="panel-head">Procedure log</div>
      <div ref={ref} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5">
        {s.log.map((l, i) => (
          <div key={i} className={`text-[12px] flex gap-2 ${tone[l.kind] ?? "text-ink-soft"}`}>
            <span className="text-ink-faint font-mono shrink-0">{clock(l.t)}</span>
            <span>
              {who[l.kind] ? <span className="text-ink-faint">{who[l.kind]}: </span> : null}
              {l.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
