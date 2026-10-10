import { useState, type ReactNode } from "react";
import { GUIDES, GUIDE_BY_ID, GUIDE_FRENCH, GUIDE_LENGTHS_CM, GUIDE_LUMEN, type GuideFrench, type GuideLengthCm } from "../../../simulation/pci/equipment";
import { MP_TWIST_NOT_TRANSMITTED_RAD } from "../../../simulation/pci/guide";
import { exchangeGuideOverWire, selectGuide } from "../../../simulation/pci/actions/guide";
import { applyGuideAction, guideEngagementFor } from "../useGuidePhysics";
import { usePciSession, type PciConsoleMeta, type PciConsoleProps } from "./registry";
import type { PciLabSession } from "../PciLabSession";

// ---------------------------------------------------------------------------
// The guide console (pci-guide-engagement): read-outs and settings only. The
// hands advance, withdraw and rotate the guide to engage, seat and turn it
// (src/ui/pci/inputBindings/guide.ts, the 'catheter' slot); this console
// chooses the guide from the catalogue (shape, French size, length, side
// holes) and brings it up to the aortic root, or exchanges it over the wire in
// the vessel (an exchange-length wire, or one held by a trapping balloon or an
// extension wire). It shows what the operator knows at the table: the guide
// on the table and its label, its lumen, whether the hub is winding up, and
// which mechanics move it. It never shows the guide's depth, coaxiality or the
// ostium: those are for the image, the trace and the debrief.
// ---------------------------------------------------------------------------

export const meta: PciConsoleMeta = { id: "guide", label: "Guide", order: 10 };

const SELECT = "bg-base-800 border border-line rounded px-1.5 py-0.5 text-[12px] text-ink";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="stat-label">{label}</span>
      <span className="font-mono text-[12px] text-ink-soft">{children}</span>
    </div>
  );
}

/** What the hands feel at the hub: free, winding up, or not following at all. */
function hubFeel(twistRad: number | undefined, kinked: boolean | undefined): string {
  if (kinked) return "the tip no longer follows";
  const t = Math.abs(twistRad ?? 0);
  if (t > MP_TWIST_NOT_TRANSMITTED_RAD) return "winding up";
  if (t > MP_TWIST_NOT_TRANSMITTED_RAD / 3) return "some resistance";
  return "turns freely";
}

function OnTable({ session }: { session: PciLabSession }) {
  const gs = session.st.guide;
  const spec = GUIDE_BY_ID[gs.id];
  const lumen = GUIDE_LUMEN[gs.french];
  const eng = guideEngagementFor(session);
  return (
    <div className="space-y-1.5">
      <Row label="Guide">
        {spec?.label ?? gs.id} · {gs.french} Fr
      </Row>
      <Row label="Length">
        {gs.lengthCm ?? 100} cm{gs.sideHoles ? " · side holes" : ""}
      </Row>
      <Row label="Lumen">
        {lumen.idIn[0].toFixed(3)} in ({lumen.idMm[0].toFixed(2)} mm)
      </Row>
      <Row label="Hub">{hubFeel(gs.twistRad, gs.kinked)}</Row>
      <Row label="Mechanics">{eng.mode === "rod" ? "rod mechanics" : eng.mode === "bench" ? "rod mechanics starting" : "simple model"}</Row>
      {spec && <div className="text-[12px] text-ink-faint">{spec.note}</div>}
    </div>
  );
}

function Choose({ session }: { session: PciLabSession }) {
  const st = session.st;
  const [id, setId] = useState<string>(st.guide.id);
  const [french, setFrench] = useState<GuideFrench>(st.guide.french);
  const [lengthCm, setLengthCm] = useState<GuideLengthCm>(st.guide.lengthCm ?? 100);
  const [sideHoles, setSideHoles] = useState<boolean>(!!st.guide.sideHoles);
  const [hold, setHold] = useState<"" | "trap" | "extension">("");
  const wireIn = st.tipMm > 5;
  const choice = { french, lengthCm, sideHoles };
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <select value={id} onChange={(e) => setId(e.target.value)} className={SELECT} aria-label="Guide shape">
          {GUIDES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
        <select value={french} onChange={(e) => setFrench(Number(e.target.value) as GuideFrench)} className={`${SELECT} font-mono`} aria-label="Guide size">
          {GUIDE_FRENCH.map((f) => (
            <option key={f} value={f}>
              {f} Fr
            </option>
          ))}
        </select>
        <select value={lengthCm} onChange={(e) => setLengthCm(Number(e.target.value) as GuideLengthCm)} className={`${SELECT} font-mono`} aria-label="Guide length">
          {GUIDE_LENGTHS_CM.map((l) => (
            <option key={l} value={l}>
              {l} cm
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-[12px] text-ink-soft">
          <input type="checkbox" checked={sideHoles} onChange={(e) => setSideHoles(e.target.checked)} />
          side holes
        </label>
      </div>
      <div className="text-[12px] text-ink-faint">{GUIDE_BY_ID[id]?.note}</div>
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <button
          className="btn !py-1 text-[12px]"
          disabled={wireIn || !!st.device}
          onClick={() => applyGuideAction(session, (x) => selectGuide(x, id, choice))}
          title="With the wire and devices out of the coronary: this guide comes up to the aortic root, for the hands to engage"
        >
          Bring up to the root
        </button>
        <select value={hold} onChange={(e) => setHold(e.target.value as "" | "trap" | "extension")} className={SELECT} aria-label="How the wire is held during the exchange" disabled={!wireIn}>
          <option value="">Wire as it is</option>
          <option value="trap">Trapping balloon</option>
          <option value="extension">Extension wire</option>
        </select>
        <button
          className="btn !py-1 text-[12px]"
          disabled={!wireIn || !!st.device}
          onClick={() => applyGuideAction(session, (x) => exchangeGuideOverWire(session.s, x, id, { ...choice, hold: hold || undefined }, session.g))}
          title="Exchange the guide over the wire in the vessel: the wire keeps its position only if it is exchange length or held"
        >
          Exchange over the wire
        </button>
      </div>
    </div>
  );
}

export default function GuideConsole({ session }: PciConsoleProps) {
  usePciSession(session);
  return (
    <div className="space-y-4 text-[13px]" aria-label="Guide">
      <OnTable session={session} />
      <Choose session={session} />
    </div>
  );
}
