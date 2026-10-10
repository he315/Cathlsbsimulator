// The full case's femoral compression orders (access-closure-femoral-manual): an order section
// (src/ui/access/orders/index.ts) for the femoral artery sheath that is to come out by hand. It is the
// preparation the team does before the pull (Brilakis 11.1.6 steps 1-3, as
// src/simulation/access/compression.ts lists them), whose rule the operator follows for the ACT and the
// timer (Brilakis or Oxford), the blood pressure lowered if raised (a titratable agent according to local
// protocol: the lesson names no drug or dose, so none is offered), and protamine, whose dose the learner
// works out. Nothing here says whether an order was right: that is the ledger's, shown in the debrief. The
// doses and rules are those of the module text; names are generic.
import { useState } from "react";
import type { CaseSection, CaseSectionProps } from "./index";
import { COMPRESSION, PREP_CHECKLIST } from "../../../simulation/access/compression";

function CompressionSection({ session, act }: CaseSectionProps) {
  const [mg, setMg] = useState("");
  const [rate, setRate] = useState<"slow" | "fast">("slow");
  const [note, setNote] = useState<string | null>(null);
  const s = session;
  const done = s.prep;
  const rule = s.compressionRule;
  const last = s.protamine[s.protamine.length - 1];
  return (
    <div className="flex flex-col gap-3" data-compression-orders>
      <div className="flex flex-col gap-1.5">
        <div className="text-[12px] font-medium text-ink-soft">Before the femoral sheath comes out</div>
        <div className="grid grid-cols-1 gap-1.5">
          {PREP_CHECKLIST.map((p) => (
            <button
              key={p.id}
              className="btn text-left leading-snug flex items-center justify-between gap-2"
              disabled={s.busy}
              onClick={() => {
                const t = act((x) => x.confirmPrep(p.id));
                if (t) setNote(t);
              }}
              data-compression-prep={p.id}
            >
              <span>{p.label}</span>
              {done[p.id] !== null && <span className="text-[12px] text-ink-faint">done</span>}
            </button>
          ))}
          <button className="btn text-left leading-snug" disabled={s.busy} onClick={() => act((x) => x.lowerBloodPressure())}>
            Lower the blood pressure (titratable agent, local protocol)
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-[12px] font-medium text-ink-soft">Rule for the ACT and the timer</div>
        <div className="seg self-start">
          <button className={`seg-btn ${rule === "brilakis" ? "seg-btn-active" : ""}`} onClick={() => act((x) => x.setCompressionRule("brilakis"))}>
            Brilakis
          </button>
          <button className={`seg-btn ${rule === "oxford" ? "seg-btn-active" : ""}`} onClick={() => act((x) => x.setCompressionRule("oxford"))}>
            Oxford
          </button>
        </div>
        <p className="text-[12px] text-ink-faint leading-snug">
          {rule === "brilakis"
            ? `ACT below ${COMPRESSION.brilakisActS} s; about ${COMPRESSION.brilakisMinPerFr[0]}-${COMPRESSION.brilakisMinPerFr[1]} min of pressure per French.`
            : `ACT below ${COMPRESSION.oxfordActS[0]}-${COMPRESSION.oxfordActS[1]} s or ${COMPRESSION.oxfordAfterH[0]}-${COMPRESSION.oxfordAfterH[1]} h after the heparin; about ${COMPRESSION.oxfordMinutes[0]}-${COMPRESSION.oxfordMinutes[1]} min of pressure.`}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-[12px] font-medium text-ink-soft">Protamine</div>
        <div className="text-[12px] text-ink-faint">Heparin given in this case: {s.heparinU} U</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <input className="field w-20" inputMode="decimal" placeholder="mg" value={mg} onChange={(e) => setMg(e.target.value)} aria-label="Protamine dose, mg" />
          <div className="seg">
            <button className={`seg-btn ${rate === "slow" ? "seg-btn-active" : ""}`} onClick={() => setRate("slow")}>
              Slowly
            </button>
            <button className={`seg-btn ${rate === "fast" ? "seg-btn-active" : ""}`} onClick={() => setRate("fast")}>
              Push
            </button>
          </div>
          <button
            className="btn"
            disabled={!(+mg > 0) || s.busy}
            onClick={() => {
              const g = act((x) => x.giveProtamine(+mg, rate));
              setNote(g ? (g.refused ? "Not given." : `Protamine ${g.givenMg} mg IV given.`) : null);
              setMg("");
            }}
          >
            Give IV
          </button>
        </div>
        {last && <span className="text-[12px] text-ink-faint">Last: {last.mg} mg {last.rate === "slow" ? "slowly" : "pushed"}</span>}
      </div>
      {note && <p className="text-[12px] text-ink leading-snug">{note}</p>}
    </div>
  );
}

export const section: CaseSection = {
  id: "femoral-compression",
  title: "Femoral sheath removal",
  order: 30,
  applies: (s) => s.activeSite.siteKind === "femoral" && (!!s.sheath || (!!s.compression && s.compression.releasedAt === null)),
  Component: CompressionSection,
};
