// ---------------------------------------------------------------------------
// TeamReport: the team's communication summary for the debrief (closed-loop
// orders, read-backs confirmed, misheard read-backs caught, warnings to the
// patient), with the time-stamped findings. Read once when the debrief opens.
// ---------------------------------------------------------------------------

import { useMemo } from "react";
import type { Team } from "../../simulation/team/team";

export default function TeamReport({ team, className = "" }: { team: Team; className?: string }) {
  const r = useMemo(() => team.report(), [team]);
  const said = r.orders + r.queries > 0 || r.findings.length > 0;
  return (
    <section className={`panel ${className}`} aria-label="Team communication">
      <div className="panel-head">Communication with the team</div>
      <div className="flex flex-col gap-1.5 px-4 py-3 text-[13px]">
        {!said && <span className="text-ink-faint">No orders were given to the team in this case.</span>}
        {said &&
          r.lines.map((l) => (
            <span key={l} className="text-ink">
              {l}
            </span>
          ))}
        {r.findings.map((f, i) => (
          <span key={i} className={f.severity === "safety" ? "text-[#f2938c]" : "text-ink-soft"}>
            <span className="mr-1.5 font-mono text-xs text-ink-faint">{team.clock(f.t)}</span>
            {f.text}
          </span>
        ))}
      </div>
    </section>
  );
}
