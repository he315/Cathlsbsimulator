// The handover note, the case summary and its decision ledger.
// (split from src/ui/access/panels.tsx by proc-foundation-scenarios-ledger; panels.tsx re-exports it).
//
// Several access sites (access-multi-site): when the case opened more than one site the note also
// lists every site that had a sheath (arterial or venous), and the access site is the one the catheter
// worked through. Every site the case can hold is offered, so the list itself gives nothing away.
import { useState } from "react";
import { useProcedureStore } from "../../../state/useProcedureStore";
import { SITE_KEYS, siteKeyLabel, type HandoverNote } from "../../../simulation/session/caseSession";
import { SHEATHS, type SheathId } from "../../../simulation/access/closure";
import { summariseLedger } from "../../../mentor/ledger";
import { useTipsModule } from "../../lab/useLabTips";
import { openLesson } from "../../content/openLesson";
import { clock, ledgerRows, useSession } from "../panels";

const COMPLICATIONS: { id: string; label: string }[] = [
  { id: "radial-spasm", label: "Radial spasm" },
  { id: "forearm-perforation", label: "Arm branch perforation" },
  { id: "forearm-haematoma", label: "Forearm haematoma" },
  { id: "radial-occlusion", label: "Radial artery occlusion" },
  { id: "subintimal", label: "Subintimal wire at the puncture" },
  { id: "venous-sheath", label: "Sheath in a vein, removed" },
  { id: "arterial-sheath-at-vein", label: "Sheath in the artery at a venous site, removed" },
  { id: "groin-haematoma", label: "Groin haematoma" },
  { id: "retroperitoneal-bleed", label: "Retroperitoneal bleed" },
  { id: "pseudoaneurysm", label: "Pseudoaneurysm" },
  { id: "av-fistula", label: "Arteriovenous fistula" },
  { id: "high-stick", label: "High femoral puncture" },
  { id: "low-stick", label: "Low femoral puncture" },
];

const CHECKS: { id: string; label: string }[] = [
  { id: "radial-pulse", label: "Radial pulse and band site" },
  { id: "hand-perfusion", label: "Hand colour, warmth, sensation" },
  { id: "groin", label: "Groin site" },
  { id: "distal-pulses", label: "Foot pulses" },
  { id: "observations", label: "Pulse and blood pressure" },
];

export function HandoverPanel() {
  const s = useSession();
  const act = useProcedureStore((x) => x.act);
  const finish = useProcedureStore((x) => x.finish);
  const summary = useProcedureStore((x) => x.summary);
  const [n, setN] = useState<HandoverNote>(() => ({ site: "", sheath: "", closure: "", heparinU: null, lastActS: null, contrastMl: null, fluoroMin: null, complications: [], bandOffHours: null, checks: [], free: "" }));
  const num = (v: string) => (v.trim() === "" ? null : +v);
  const g = s.grade;
  const set = (p: Partial<HandoverNote>) => setN((x) => ({ ...x, ...p }));
  const toggle = (k: "complications" | "checks", id: string) => setN((x) => ({ ...x, [k]: x[k].includes(id) ? x[k].filter((y) => y !== id) : [...x[k], id] }));
  const multi = s.sites.length > 1;
  const toggleSite = (key: string) => setN((x) => {
    const cur = x.sites ?? [];
    return { ...x, sites: cur.includes(key) ? cur.filter((y) => y !== key) : [...cur, key] };
  });
  return (
    <div className="panel h-full flex flex-col overflow-hidden">
      <div className="panel-head">
        <span>Handover to the ward</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="flex flex-col gap-2 text-[13px]">
          <label className="flex items-center justify-between gap-2 text-ink-soft">
            {multi ? "Working access site" : "Access site"}
            <select className="field w-44" value={n.site} onChange={(e) => set({ site: e.target.value as HandoverNote["site"] })}>
              <option value="">Choose</option>
              <option value="radial-right">Right radial</option>
              <option value="radial-left">Left radial</option>
              <option value="femoral">{multi ? "Femoral" : "Right femoral"}</option>
            </select>
          </label>
          {multi && (
            <fieldset className="rounded-md border border-line p-2">
              <legend className="px-1 text-ink">Access sites and lines (every sheath placed)</legend>
              <div className="grid grid-cols-2 gap-1">
                {SITE_KEYS.map((k) => (
                  <label key={k} className="flex items-center gap-2 text-ink-soft">
                    <input type="checkbox" checked={!!n.sites?.includes(k)} onChange={() => toggleSite(k)} />
                    {siteKeyLabel(k)[0].toUpperCase() + siteKeyLabel(k).slice(1)}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <label className="flex items-center justify-between gap-2 text-ink-soft">
            Sheath
            <select className="field w-44" value={n.sheath} onChange={(e) => set({ sheath: e.target.value as SheathId | "" })}>
              <option value="">Choose</option>
              {(Object.keys(SHEATHS) as SheathId[]).map((id) => (
                <option key={id} value={id}>
                  {SHEATHS[id].label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between gap-2 text-ink-soft">
            Closure
            <select className="field w-44" value={n.closure} onChange={(e) => set({ closure: e.target.value })}>
              <option value="">Choose</option>
              <option value="radial-band">Radial band</option>
              <option value="manual">Manual compression</option>
              <option value="device">Closure device</option>
            </select>
          </label>
          {(
            [
              ["heparinU", "Heparin given (U)"],
              ["lastActS", "Last ACT (s), blank if none"],
              ["contrastMl", "Contrast (mL)"],
              ["fluoroMin", "Fluoroscopy (min)"],
              ["bandOffHours", "Band off after (h)"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center justify-between gap-2 text-ink-soft">
              {label}
              <input className="field w-28" inputMode="decimal" value={n[k] ?? ""} onChange={(e) => set({ [k]: num(e.target.value) } as Partial<HandoverNote>)} />
            </label>
          ))}
          <textarea className="field h-20 py-2" placeholder="Anything else for the ward" value={n.free} onChange={(e) => set({ free: e.target.value })} />
        </div>
        <div className="flex flex-col gap-2 text-[13px]">
          <div className="text-ink">Complications</div>
          <div className="grid grid-cols-2 gap-1">
            {COMPLICATIONS.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-ink-soft">
                <input type="checkbox" checked={n.complications.includes(c.id)} onChange={() => toggle("complications", c.id)} />
                {c.label}
              </label>
            ))}
          </div>
          <div className="text-ink mt-2">Checks asked of the ward</div>
          <div className="grid grid-cols-2 gap-1">
            {CHECKS.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-ink-soft">
                <input type="checkbox" checked={n.checks.includes(c.id)} onChange={() => toggle("checks", c.id)} />
                {c.label}
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-accent" onClick={() => act((x) => x.submitHandover(n))}>
              Hand over
            </button>
            <button className="btn btn-good" disabled={!g || !s.closureDone()} onClick={() => finish()}>
              Finish the case
            </button>
          </div>
          {g && (
            <table className="w-full text-[12px] mt-2">
              <thead>
                <tr className="text-ink-faint text-left">
                  <th className="font-normal py-1">Item</th>
                  <th className="font-normal">Case</th>
                  <th className="font-normal">Your note</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((i) => (
                  <tr key={i.field} className={i.correct ? "text-ink-soft" : "text-warn"}>
                    <td className="py-0.5 pr-2">{i.field}</td>
                    <td className="pr-2">{i.expected}</td>
                    <td>{i.given}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {summary && <SummaryBlock />}
        </div>
      </div>
    </div>
  );
}

function SummaryBlock() {
  const sum = useProcedureStore((x) => x.summary)!;
  return (
    <div className="rounded-md border border-line p-2.5 mt-2 text-[13px] flex flex-col gap-1">
      <div className="text-ink">Case logged ({sum.passed ? "passed" : "not passed"})</div>
      <div className="text-ink-soft">
        {clock(sum.durationS)} on the clock · contrast {Math.round(sum.totals.contrastMl)} mL · fluoroscopy {(sum.totals.fluoroS / 60).toFixed(1)} min · Ka,r {Math.round(sum.totals.karMGy)} mGy · heparin {sum.heparinU} U
      </div>
      {sum.complications.length > 0 && <div className="text-ink-soft">Complications and errors: {sum.complications.map((c) => c.label).join("; ")}.</div>}
      {sum.raoProbability !== null && (
        <div className="text-ink-soft">
          Radial occlusion risk for this case {Math.round(sum.raoProbability * 100)}%:{" "}
          {sum.raoTerms.map((t) => `${t.factor} (odds × ${t.oddsRatio.toFixed(2)}, ${t.basis})`).join("; ") || "reference conditions"}.
        </div>
      )}
      {sum.femoralTerms.length > 0 && <div className="text-ink-soft">Femoral bleeding factors: {sum.femoralTerms.map((t) => `${t.factor} (× ${t.oddsRatio.toFixed(2)})`).join("; ")}.</div>}
      {sum.decisions.length > 0 && <LedgerList />}
    </div>
  );
}

/**
 * The case's decisions after it is finished (the ledger): what was done, what was expected, the
 * lesson that teaches it and the tips beside it. Shown only in the summary, never on a live screen.
 */
function LedgerList() {
  const sum = useProcedureStore((x) => x.summary)!;
  const tips = useTipsModule();
  const rows = ledgerRows(sum.decisions, tips?.TIP_BY_ID ?? null);
  const head = summariseLedger(sum.decisions);
  return (
    <section className="mt-2 flex flex-col gap-1.5" aria-label="Decisions">
      <div className="text-ink">
        Decisions: {head.correct} of {head.total} as expected
      </div>
      <ul className="flex flex-col gap-1.5">
        {rows.map(({ decision: d, tips: dt }) => (
          <li key={d.id} className="rounded-md border border-line p-2" data-decision={d.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <span className="text-ink">{d.label}</span>
              <span className={`text-[12px] ${d.correct ? "text-good" : "text-danger"}`}>{d.correct ? "As expected" : "Not as expected"}</span>
            </div>
            <div className="text-[12px] text-ink-soft mt-0.5">You: {d.given}</div>
            <div className="text-[12px] text-ink-faint">Expected: {d.expected}</div>
            {dt.map((t) => (
              <div key={t.id} className="text-[12px] text-ink-soft mt-1" data-tip={t.id}>
                Tip: {t.title}
              </div>
            ))}
            {d.lessonId && (
              <button type="button" className="btn btn-ghost px-2 py-0.5 text-xs mt-1" data-lesson={d.lessonId} onClick={() => void openLesson(d.lessonId!)}>
                Open lesson
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
