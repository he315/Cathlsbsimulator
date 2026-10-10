// The full case's bleeding work-up (access-cx-bleeding-retroperitoneal): the team at the bedside over the
// session module 'bleeding' (src/simulation/session/modules/bleeding.ts). The operator says the suspicion out
// loud; starts the general measures (access, crystalloid, type and crossmatch, red cells, a vasopressor,
// haemoglobin, pressure at the site); chooses where to look (the bladder on the pelvic screen of the access
// fluoroscopy, angiography from the other groin, CT, or straight back to the laboratory); reverses (protamine
// with its dose and rate, stopping an IV antiplatelet infusion, a DOAC agent, platelets); treats what the
// imaging shows; and writes the antiplatelet plan. The right and wrong options sit side by side; the results
// are what a test or an image shows, never a diagnosis; nothing here says whether an order was right (that is
// the ledger's, in the debrief). Doses are those of the module text (src/simulation/access/bleeding.ts);
// names are generic.
import { useState } from "react";
import type { CaseSession } from "../../simulation/session/caseSession";
import {
  ANTIPLATELET_PLAN_LABEL,
  BLADDER_READING_LABEL,
  DOAC_REVERSAL_LABEL,
  RP_SOURCED,
  RP_TREATMENT_LABEL,
  type AntiplateletPlan,
  type BladderReading,
  type DoacReversal,
  type RpTreatment,
} from "../../simulation/access/bleeding";
import { BLEED_ORDERS, bleedingOf, type BleedOrderSpec } from "../../simulation/session/modules/bleeding";

export interface BleedingPanelProps {
  session: CaseSession;
  act: <T>(fn: (s: CaseSession) => T) => T | undefined;
}

const GROUPS: { id: BleedOrderSpec["group"]; title: string }[] = [
  { id: "measures", title: "General measures" },
  { id: "blood", title: "Blood" },
  { id: "reverse", title: "Infusions" },
];

const TREATMENTS: readonly RpTreatment[] = ["balloon", "covered-stent", "coils", "surgery", "conservative", "other-cause"];
const READINGS: readonly BladderReading[] = ["dented", "normal", "not-opacified"];
const PLANS: readonly AntiplateletPlan[] = ["continue", "de-escalate", "oral-after-cangrelor", "stop-dapt"];
const DOAC_AGENTS: readonly DoacReversal[] = ["idarucizumab", "andexanet", "pcc"];

const ago = (now: number, t: number) => {
  const m = Math.max(0, Math.floor((now - t) / 60));
  return m === 0 ? "just now" : `${m} min ago`;
};

function Heading({ children }: { children: string }) {
  return <div className="text-[12px] font-medium text-ink-soft">{children}</div>;
}

export function BleedingPanel({ session, act }: BleedingPanelProps) {
  const [mg, setMg] = useState("");
  const [rate, setRate] = useState<"slow" | "fast">("slow");
  const m = bleedingOf(session);
  if (!m) return null;
  const st = m.state;
  const where = m.actions.where();
  const onBoard = m.actions.onBoard();
  const busy = (what: string) => st.inProgress.some((p) => p.what === what);
  const recent = st.actions.slice(-6).reverse();
  const results = st.results.slice(-5).reverse();
  const hasP2y12 = !!onBoard.p2y12;

  return (
    <div className="flex flex-col gap-3" data-bleeding-orders>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={`btn text-left leading-snug ${st.saidT !== null ? "border-accent" : ""}`}
          disabled={st.saidT !== null}
          onClick={() => act((s) => bleedingOf(s)?.actions.suspect())}
          data-bleed-suspect
        >
          {st.saidT !== null ? "Said: suspected retroperitoneal bleed" : "Say it: suspected retroperitoneal bleed"}
        </button>
        <span className="text-[12px] text-ink-faint">{where === "recovery" ? "In recovery" : where === "lab" ? "Back in the laboratory" : "On the table"}</span>
      </div>

      {GROUPS.map((g) => (
        <div key={g.id} className="flex flex-col gap-1.5">
          <Heading>{g.title}</Heading>
          <div className="grid grid-cols-2 gap-1.5">
            {BLEED_ORDERS.filter((o) => o.group === g.id).map((o) => (
              <button key={o.id} className="btn text-left leading-snug" disabled={o.id === "hb" && busy("hb")} onClick={() => act((s) => bleedingOf(s)?.actions.order(o.id))} data-bleed-order={o.id}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <Heading>Where to look</Heading>
        <div className="grid grid-cols-2 gap-1.5">
          <button className="btn text-left leading-snug" disabled={where === "recovery" || busy("angio")} onClick={() => act((s) => bleedingOf(s)?.actions.contralateralAngiogram())} data-bleed-route="contralateral-angio">
            Iliofemoral angiogram from the other groin
          </button>
          <button className="btn text-left leading-snug" disabled={busy("ct")} onClick={() => act((s) => bleedingOf(s)?.actions.ct())} data-bleed-route="ct">
            CT of the abdomen and pelvis
          </button>
          <button className="btn text-left leading-snug" disabled={where !== "recovery" || busy("back-to-lab")} onClick={() => act((s) => bleedingOf(s)?.actions.backToLab())} data-bleed-route="back-to-lab">
            Straight back to the laboratory
          </button>
          <button className="btn text-left leading-snug" disabled={!st.angio || busy("retrograde")} onClick={() => act((s) => bleedingOf(s)?.actions.checkRetrograde())} data-bleed-route="retrograde">
            Selective injection: retrograde filling?
          </button>
        </div>
        <p className="text-[12px] text-ink-faint leading-snug">The bladder is screened on the access fluoroscopy at the pelvis station; angiography from the other groin needs a sheath there (another access site).</p>
        {st.bladder.screenedT !== null && (
          <div className="flex flex-col gap-1">
            <span className="text-[12px] text-ink-soft">The pelvic screen shows</span>
            <div className="flex flex-wrap gap-1.5">
              {READINGS.map((r) => (
                <button key={r} className={`btn leading-snug ${st.bladder.reading === r ? "border-accent" : ""}`} aria-pressed={st.bladder.reading === r} onClick={() => act((s) => bleedingOf(s)?.actions.readBladder(r))} data-bleed-bladder={r}>
                  {BLADDER_READING_LABEL[r]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Heading>Reverse</Heading>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-ink-soft">Protamine</span>
          <input className="field w-20" inputMode="numeric" value={mg} onChange={(e) => setMg(e.target.value)} placeholder="mg" aria-label="Protamine dose in mg" />
          <div className="seg" role="group" aria-label="Protamine rate">
            <button className={`seg-btn ${rate === "slow" ? "seg-btn-active" : ""}`} aria-pressed={rate === "slow"} onClick={() => setRate("slow")}>
              Slowly, at most {RP_SOURCED.protamineMaxMgPerMin} mg/min
            </button>
            <button className={`seg-btn ${rate === "fast" ? "seg-btn-active" : ""}`} aria-pressed={rate === "fast"} onClick={() => setRate("fast")}>
              As a bolus
            </button>
          </div>
          <button className="btn" disabled={!(Number(mg) > 0)} onClick={() => act((s) => bleedingOf(s)?.actions.protamine(Number(mg), rate))} data-bleed-protamine>
            Give
          </button>
        </div>
        {onBoard.doac && (
          <div className="grid grid-cols-1 gap-1.5">
            {DOAC_AGENTS.map((a) => (
              <button key={a} className="btn text-left leading-snug" onClick={() => act((s) => bleedingOf(s)?.actions.doacReversal(a))} data-bleed-doac={a}>
                {DOAC_REVERSAL_LABEL[a]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Heading>Treat what the imaging shows</Heading>
        <div className="grid grid-cols-2 gap-1.5">
          {TREATMENTS.map((t) => (
            <button key={t} className="btn text-left leading-snug" disabled={busy(t)} onClick={() => act((s) => bleedingOf(s)?.actions.treat(t))} data-bleed-treat={t}>
              {RP_TREATMENT_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {hasP2y12 && (
        <div className="flex flex-col gap-1.5">
          <Heading>Antiplatelet plan once the bleeding is controlled</Heading>
          <div className="grid grid-cols-1 gap-1.5">
            {PLANS.map((p) => (
              <button key={p} className={`btn text-left leading-snug ${st.plan?.plan === p ? "border-accent" : ""}`} aria-pressed={st.plan?.plan === p} onClick={() => act((s) => bleedingOf(s)?.actions.antiplateletPlan(p))} data-bleed-plan={p}>
                {ANTIPLATELET_PLAN_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
      )}

      {st.inProgress.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {st.inProgress.map((p, i) => (
            <li key={`${p.what}-${i}`} className="text-[12px] text-ink-soft">
              {p.label}: under way
            </li>
          ))}
        </ul>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-1" data-bleed-results>
          <Heading>Results</Heading>
          <ul className="flex flex-col gap-1">
            {results.map((r, i) => (
              <li key={`${r.t}-${i}`} className="text-[12px] leading-snug">
                <span className="text-ink">{r.title}:</span> <span className="text-ink-soft">{r.text}</span> <span className="text-ink-faint">{ago(session.tS, r.t)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {st.note && (
        <p className="text-[12px] text-ink leading-snug" data-bleed-note>
          {st.note}
        </p>
      )}
      {recent.length > 0 && (
        <div className="flex flex-col gap-1">
          <Heading>Given and done</Heading>
          <ul className="flex flex-col gap-0.5">
            {recent.map((a, i) => (
              <li key={`${a.t}-${i}`} className="text-[12px] text-ink-soft leading-snug">
                <span className="text-ink">{a.text}</span> <span className="text-ink-faint">{ago(session.tS, a.t)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default BleedingPanel;
