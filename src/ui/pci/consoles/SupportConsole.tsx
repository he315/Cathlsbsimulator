import { useState, type ReactNode } from "react";
import { DEVICE_BY_ID, WIRE_SPEC } from "../../../simulation/pci/equipment";
import { extensionCollarMm, type SupportCatheterKind } from "../../../simulation/pci/guide";
import { ANCHOR_ATM_RANGE, anchorBranches, breathHeld, deliveryTechnique, deviceSpecOf, recordSupport, removeExtension, setAnchorBalloon, setExtensionRod, setSupportCatheter, shaftMarksIn, takeExtension } from "../../../simulation/pci/actions/devices";
import { setBuddyWire } from "../../../simulation/pci/actions/guide";
import { labScreens } from "../../lab/visibility";
import { DELIVERY_HANDS, anchorBranchName, applyDeliveryAction, deepBreathByTeam, deliveryHand, setDeliveryHand, type DeliveryHand } from "../inputBindings/support";
import { usePciSession, type PciConsoleMeta, type PciConsoleProps } from "./registry";
import type { PciLabSession } from "../PciLabSession";

// ---------------------------------------------------------------------------
// The support console (pci-device-delivery): read-outs and settings only.
//
// The hands do the delivery (src/ui/pci/inputBindings/support.ts, 'delivery'):
// the right hand pushes and pulls the device shaft or the guide extension's
// push rod on the device slot, the left hand pins the wire (the two-hand
// technique) or holds the guide as well (the independent-hand technique,
// which adds back-up and seats the guide a little with each push); a deep
// seat is a push on the guide and a partial wire withdrawal a pull on the
// wire. This console shows what the operator knows at the table (the device
// on the rail and which shaft marks have reached the Y-connector, the pins,
// the support in use, the extension's push rod and, while the beam is on,
// whether its tip and collar are beyond the guide tip, which the image then
// shows) and holds the settings:
// what the right hand moves, and the support menu for a device that will not
// go (deep breath, buddy wire, support-wire exchange, anchor balloon, guide
// extension, support catheter; the guide exchange or upsizing is the guide
// console's). It never shows the forces, the guide's depth or the lesion: in
// guided practice only, as a teaching aid, the share of the guide's back-up
// the last push needed.
// ---------------------------------------------------------------------------

export const meta: PciConsoleMeta = { id: "support", label: "Delivery and support", order: 25 };

const SELECT = "bg-base-800 border border-line rounded px-1.5 py-0.5 text-[12px] text-ink";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="stat-label">{label}</span>
      <span className="font-mono text-[12px] text-ink-soft">{children}</span>
    </div>
  );
}

/** The anchor balloon sizes the console offers (mm): the module's 1.5-2.0 mm, and larger to err with. */
const ANCHOR_SIZES = [1.25, 1.5, 2.0, 2.5, 3.0] as const;
/** The anchor pressures offered (atm), across and beyond the low-pressure range. */
const ANCHOR_ATMS = [4, 6, 8, 10, 12, 14] as const;
const SUPPORT_CATHETERS: readonly { id: SupportCatheterKind; label: string }[] = [
  { id: "scaffold", label: "Scaffold support catheter" },
  { id: "strut", label: "Strut support catheter" },
  { id: "anchoring-balloon", label: "Anchoring balloon catheter (5 Fr)" },
];

/** Which shaft marks are at or past the Y-connector, as the operator reads them on the table. */
function marksText(marks: number[]): string {
  if (!marks.length) return "no mark at the valve yet";
  return `${marks.map((m) => `${m} cm`).join(" and ")} mark${marks.length > 1 ? "s" : ""} past the valve`;
}

/** The last engine record carrying a push's forces (the guided teaching aid), scanning back without copying the log. */
function lastPushForces(log: PciLabSession["st"]["log"]): (typeof log)[number] | null {
  for (let i = log.length - 1; i >= 0; i--) {
    const r = log[i];
    if (typeof r.data.requiredN === "number" && typeof r.data.backupN === "number" && Number(r.data.backupN) > 0) return r;
  }
  return null;
}

function OnTheRail({ session }: { session: PciLabSession }) {
  const st = session.st;
  const dev = st.device;
  const spec = dev ? deviceSpecOf(dev) : null;
  const tech = deliveryTechnique(st);
  const ext = st.guide.ext;
  const guided = labScreens(session.policy).teachingAids;
  const last = guided ? lastPushForces(st.log) : null;
  // the extension's tip and collar against the guide tip are seen on the image only while the beam is on
  const screened = session.beamMode() !== null;
  const support = [st.guide.buddy ? "buddy wire" : "", st.guide.anchor ? `anchor balloon in the ${st.guide.anchor.branch}` : "", st.guide.supportCatheter ? "support catheter" : "", breathHeld(st) ? "breath held" : ""].filter(Boolean);
  return (
    <div className="space-y-1.5">
      <Row label="Device">{dev && spec ? `${spec.label}${dev.diameter ? ` ${dev.diameter.toFixed(2)} × ${dev.lengthMm} mm` : ""}` : "none on the wire"}</Row>
      {dev && dev.stage === "in-guide" && <Row label="Shaft">{marksText(shaftMarksIn(st))}</Row>}
      <Row label="Left hand">{tech === "independent-hand" ? "wire pinned, guide held" : tech === "two-hand" ? "wire pinned" : st.guide.pinned ? "guide held" : "free"}</Row>
      <Row label="Wire">{WIRE_SPEC[st.wireKind].label}</Row>
      <Row label="Support">{support.length ? support.join(", ") : "none"}</Row>
      {ext && (
        <>
          <Row label="Extension">
            {DEVICE_BY_ID[ext.specId]?.label ?? "Guide extension"} {ext.french} Fr · {ext.cylinderMm / 10} cm cylinder
          </Row>
          <Row label="Push rod">{ext.rodParked ? "under the towel" : "loose"}</Row>
          <Row label="On the image">
            {screened ? `${ext.tipMm > 0 ? "tip beyond the guide tip" : "tip in the guide"} · collar ${extensionCollarMm(ext) > 0 ? "outside the guide" : "inside the guide"}` : "screen to see the tip and collar"}
          </Row>
        </>
      )}
      {guided && last && (
        <Row label="Last push">
          {Math.round((100 * Number(last.data.requiredN)) / Number(last.data.backupN))}% of the guide's back-up <span className="text-ink-faint">(guided)</span>
        </Row>
      )}
    </div>
  );
}

function Hand({ session }: { session: PciLabSession }) {
  const [hand, setHand] = useState<DeliveryHand>(() => deliveryHand(session));
  const change = (h: DeliveryHand) => {
    setDeliveryHand(session, h);
    setHand(deliveryHand(session));
  };
  return (
    <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
      Right hand on
      <select value={hand} onChange={(e) => change(e.target.value as DeliveryHand)} className={SELECT} aria-label="What the right hand moves">
        {DELIVERY_HANDS.map((h) => (
          <option key={h.id} value={h.id}>
            {h.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SupportMenu({ session }: { session: PciLabSession }) {
  const st = session.st;
  const g = session.g;
  // largest first, so the default is the branch the engine itself picks when none is named
  const branches = [...anchorBranches(g)].sort((a, b) => b.refMm - a.refMm);
  const [branch, setBranch] = useState<string>(() => branches[0]?.branch ?? "");
  const [anchorD, setAnchorD] = useState<number>(1.5);
  const [anchorAtm, setAnchorAtm] = useState<number>(ANCHOR_ATM_RANGE[0] + 2);
  const extSpec = DEVICE_BY_ID.extension;
  const sizes = extSpec.diameters.filter((fr) => (extSpec.minFrench(fr) ?? 99) <= st.guide.french);
  const [extFr, setExtFr] = useState<number>(() => (sizes.includes(st.guide.french) ? st.guide.french : (sizes[sizes.length - 1] ?? st.guide.french)));
  const [extCm, setExtCm] = useState<number>(extSpec.lengths[extSpec.lengths.length - 1]);
  const [scKind, setScKind] = useState<SupportCatheterKind>("scaffold");
  const wireIn = st.tipMm > 30;
  const ext = st.guide.ext;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button className="btn !py-1 text-[12px]" disabled={breathHeld(st)} onClick={() => deepBreathByTeam(session)} title="Ask the patient to take a deep breath and hold it: the bends straighten for a few seconds">
          Deep breath
        </button>
        <button
          className="btn !py-1 text-[12px]"
          disabled={!wireIn}
          aria-pressed={st.guide.buddy}
          onClick={() => applyDeliveryAction(session, "load-device", (x) => (x.guide.buddy ? setBuddyWire(x, false) : recordSupport(setBuddyWire(x, true), "buddy-wire")))}
          title="A second wire alongside the working wire straightens the vessel and adds back-up"
        >
          {st.guide.buddy ? "Remove buddy wire" : "Buddy wire"}
        </button>
        <button
          className="btn !py-1 text-[12px]"
          disabled={!wireIn || st.wireKind === "support"}
          onClick={() => {
            if (session.setWireKind("support")) applyDeliveryAction(session, "load-device", (x) => recordSupport(x, "support-wire"));
          }}
          title="Exchange the working wire for a support wire"
        >
          Support wire
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[12px] text-ink-soft">Anchor balloon</span>
        <select value={branch} onChange={(e) => setBranch(e.target.value)} className={SELECT} aria-label="Anchor branch" disabled={!branches.length}>
          {branches.map((b) => (
            <option key={b.branch} value={b.branch}>
              {anchorBranchName(b.branch)}
            </option>
          ))}
        </select>
        <select value={anchorD} onChange={(e) => setAnchorD(Number(e.target.value))} className={`${SELECT} font-mono`} aria-label="Anchor balloon size">
          {ANCHOR_SIZES.map((d) => (
            <option key={d} value={d}>
              {d.toFixed(2)} mm
            </option>
          ))}
        </select>
        <select value={anchorAtm} onChange={(e) => setAnchorAtm(Number(e.target.value))} className={`${SELECT} font-mono`} aria-label="Anchor balloon pressure">
          {ANCHOR_ATMS.map((a) => (
            <option key={a} value={a}>
              {a} atm
            </option>
          ))}
        </select>
        <button
          className="btn !py-1 text-[12px]"
          disabled={!wireIn || !branches.length}
          onClick={() => applyDeliveryAction(session, "load-device", (x) => setAnchorBalloon(g, x, x.guide.anchor ? null : { diameter: anchorD, atm: anchorAtm, branch }))}
        >
          {st.guide.anchor ? "Deflate anchor" : "Inflate anchor"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[12px] text-ink-soft">Guide extension</span>
        <select value={extFr} onChange={(e) => setExtFr(Number(e.target.value))} className={`${SELECT} font-mono`} aria-label="Extension size" disabled={!!ext}>
          {sizes.map((fr) => (
            <option key={fr} value={fr}>
              {fr} Fr
            </option>
          ))}
        </select>
        <select value={extCm} onChange={(e) => setExtCm(Number(e.target.value))} className={`${SELECT} font-mono`} aria-label="Extension cylinder length" disabled={!!ext}>
          {extSpec.lengths.map((l) => (
            <option key={l} value={l}>
              {l} cm
            </option>
          ))}
        </select>
        {!ext ? (
          <button className="btn !py-1 text-[12px]" disabled={!st.valveOpen} onClick={() => applyDeliveryAction(session, "load-device", (x) => takeExtension(x, { french: extFr, cylinderCm: extCm }))} title="Introduce the extension through the open valve">
            Introduce
          </button>
        ) : (
          <>
            <button className="btn !py-1 text-[12px]" aria-pressed={ext.rodParked} onClick={() => applyDeliveryAction(session, "load-device", (x) => setExtensionRod(x, !ext.rodParked))} title="Lay the push rod under the towel beside the Y-connector so the wire cannot wrap round it">
              {ext.rodParked ? "Rod loose" : "Rod under towel"}
            </button>
            <button className="btn !py-1 text-[12px]" disabled={ext.tipMm > 0} onClick={() => applyDeliveryAction(session, "remove-device", (x) => removeExtension(x))}>
              Remove
            </button>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[12px] text-ink-soft">Support catheter</span>
        <select value={scKind} onChange={(e) => setScKind(e.target.value as SupportCatheterKind)} className={SELECT} aria-label="Support catheter" disabled={!!st.guide.supportCatheter}>
          {SUPPORT_CATHETERS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          className="btn !py-1 text-[12px]"
          disabled={!wireIn}
          onClick={() => applyDeliveryAction(session, st.guide.supportCatheter ? "remove-device" : "load-device", (x) => setSupportCatheter(g, x, x.guide.supportCatheter ? null : scKind))}
        >
          {st.guide.supportCatheter ? "Remove" : "Land"}
        </button>
      </div>
    </div>
  );
}

export default function SupportConsole({ session }: PciConsoleProps) {
  usePciSession(session);
  return (
    <div className="space-y-3 text-[13px]" aria-label="Delivery and support">
      <OnTheRail session={session} />
      <Hand session={session} />
      <SupportMenu session={session} />
      <div className="text-[12px] text-ink-faint">The hands push the device or the extension, pin the wire and hold the guide; a deep seat is a push on the guide, a partial wire withdrawal a pull on the wire. Exchange or upsize the guide in the guide console.</div>
    </div>
  );
}
