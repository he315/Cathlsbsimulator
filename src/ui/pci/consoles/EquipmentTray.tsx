import { useMemo, useState, type ReactNode } from "react";
import { DEVICE_BY_ID } from "../../../simulation/pci/equipment";
import { trayOf, type BalloonMixture, type CartStock, type PciState, type WireSetup } from "../../../simulation/pci/state";
import { MIXTURES, MP_CASE_DATE, cartCheckDue, cartCheckList, cartOf, deviceBoxLabel, shelfSpecs, syringeView } from "../../../simulation/pci/cart";
import {
  applySuction,
  aspirateGuide,
  assistStep,
  backloadDevice,
  checkCart,
  checkLabel,
  connectIndeflator,
  deviceShaftMm,
  fillPrepSyringe,
  guideLengthMm,
  nextAssistStep,
  removeDevice,
  requestDevice,
  restockCart,
  returnBox,
  setUpWire,
  setValve,
  wireLoadedAtTable,
  wireSeenSinceRemoval,
} from "../../../simulation/pci/actions/devices";
import { pinWire } from "../../../simulation/pci/actions/wire";
import { deliverByHand } from "../inputBindings/support";
import { labScreens } from "../../lab/visibility";
import { usePciSession, type PciConsoleMeta, type PciConsoleProps } from "./registry";
import type { PciAction, PciLabSession } from "../PciLabSession";

// ---------------------------------------------------------------------------
// The equipment tray (pci-equipment-tray): the table workflow for every mode.
//
// The cart (checked before complex and CTO cases, restocked at the end), the
// request for a box, the label read back (type, size, pressures, use-by date,
// with the case's date beside it), the prep station (the syringe's mixture,
// negative suction with the plunger up, what the syringe shows, the
// indeflator connected), the backload with the wire pinned, the haemostatic
// valve, the guide back-bled and aspirated, the wire's table set-up (the
// Y-connector, introducer and torque device) and the scrub nurse, who does
// the next step on request (recorded in the debrief). Each button is an
// operator action through the session's action entry, asked of the attending
// first. The hands push the device down the guide (the delivery binding);
// in guided practice the tray adds push buttons and the pre-device checklist
// as teaching aids. Nothing here says whether a box is out of date, how much
// air is left or where the wire tip is: the label, the syringe and the image
// do; outside guided practice the scrub nurse is asked for "the next step"
// without the step named. From this package on the assisted device console
// shows its device path in guided practice only.
// ---------------------------------------------------------------------------

export const meta: PciConsoleMeta = { id: "equipment-tray", label: "Equipment tray", order: 5 };

const SELECT = "bg-base-800 border border-line rounded px-1.5 py-0.5 text-[12px] text-ink";
const BTN = "btn !py-1 text-[12px]";
/** Where the guided push stops the device's distal end short of the guide tip (mm): a UI choice for the teaching buttons. */
const PUSH_STOP_SHORT_MM = 20;

/** An operator action through the session's action entry (asked of the attending first), as the binding files reach it. */
function act(session: PciLabSession, name: PciAction, f: (x: PciState) => PciState): boolean {
  const entry = (session as unknown as { act?: (a: PciAction, fn: (x: PciState) => PciState) => boolean }).act;
  if (typeof entry === "function") return entry.call(session, name, f);
  if (import.meta.env?.DEV) throw new Error("EquipmentTray: the PCI session offers no act(); the tray's actions cannot reach the engine.");
  return false;
}

/** The cart, built once per stored cart and case start (cartOf rebuilds it from its seed until the tray stores it). */
function useCart(st: PciState, stockId?: string): CartStock {
  const stored = trayOf(st).cart;
  const start = st.log.find((r) => r.kind === "case-start");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => cartOf(st, stockId), [stored, start, stockId]);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1 border-t border-line pt-2 first:border-t-0 first:pt-0">
      <span className="stat-label">{title}</span>
      {children}
    </div>
  );
}

function Cart({ session }: { session: PciLabSession }) {
  const st = session.st;
  const stock = session.resolved.def.stock;
  const tray = trayOf(st);
  const [open, setOpen] = useState(false);
  const [flags, setFlags] = useState<string[]>([]);
  const due = cartCheckDue(session.s);
  const cart = useCart(st, stock);
  return (
    <Section title="Cart">
      <div className="text-[12px] text-ink-faint">{due ? "Complex case: walk the bail-out items on the cart before the first wire." : "Bail-out items on the cart."}</div>
      <div className="flex flex-wrap gap-1.5">
        <button className={BTN} onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? "Close the cart" : "Open the cart"}
        </button>
        {open && (
          <button className="btn btn-accent !py-1 text-[12px]" onClick={() => act(session, "load-device", (x) => checkCart(x, flags, stock))}>
            Cart checked{flags.length ? ` (${flags.length} to replace)` : ""}
          </button>
        )}
        {tray.cartCheckedT !== null && (
          <button className={BTN} onClick={() => act(session, "load-device", (x) => restockCart(x, stock))} disabled={tray.restocked}>
            {tray.restocked ? "Cart restocked" : "Restock the cart"}
          </button>
        )}
      </div>
      {open && (
        <div className="max-h-32 space-y-1 overflow-y-auto" aria-label="Cart contents">
          <div className="font-mono text-[12px] text-ink-faint">Today {cart.today}</div>
          {cartCheckList(cart).map((item) => (
            <label key={item.specId} className="flex items-start gap-1.5 text-[12px] text-ink-soft">
              <input type="checkbox" checked={flags.includes(item.specId)} onChange={(e) => setFlags(e.target.checked ? [...flags, item.specId] : flags.filter((f) => f !== item.specId))} aria-label={`Flag ${item.label}`} />
              <span>
                <span className="text-ink">{item.label}</span>{" "}
                <span className="font-mono">{item.sizes.map((z) => (z.qty > 0 ? `${z.size} ×${z.qty} use by ${z.useBy}` : `${z.size} none`)).join("; ")}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </Section>
  );
}

function Request({ session }: { session: PciLabSession }) {
  const specs = shelfSpecs();
  const [specId, setSpecId] = useState(specs.find((s) => s.id === "sc")?.id ?? specs[0].id);
  const spec = DEVICE_BY_ID[specId];
  const [diam, setDiam] = useState(spec.diameters.includes(2.5) ? 2.5 : spec.diameters[0]);
  const [len, setLen] = useState(spec.lengths.includes(15) ? 15 : spec.lengths[0]);
  const pick = (id: string) => {
    const s = DEVICE_BY_ID[id];
    setSpecId(id);
    if (!s.diameters.includes(diam)) setDiam(s.diameters.reduce((a, d) => (Math.abs(d - diam) < Math.abs(a - diam) ? d : a), s.diameters[0]));
    if (!s.lengths.includes(len)) setLen(s.lengths.reduce((a, l) => (Math.abs(l - len) < Math.abs(a - len) ? l : a), s.lengths[0]));
  };
  return (
    <Section title="Ask for a device">
      <div className="flex flex-wrap items-center gap-1.5">
        <select value={specId} onChange={(e) => pick(e.target.value)} className={SELECT} aria-label="Device type">
          {specs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select value={diam} onChange={(e) => setDiam(Number(e.target.value))} className={`${SELECT} font-mono`} aria-label="Diameter">
          {spec.diameters.map((d) => (
            <option key={d} value={d}>
              {d.toFixed(2)} mm
            </option>
          ))}
        </select>
        <select value={len} onChange={(e) => setLen(Number(e.target.value))} className={`${SELECT} font-mono`} aria-label="Length">
          {spec.lengths.map((l) => (
            <option key={l} value={l}>
              {l} mm
            </option>
          ))}
        </select>
        <button className="btn btn-accent !py-1 text-[12px]" onClick={() => act(session, "load-device", (x) => requestDevice(x, specId, diam, len, { fromCart: true, stockId: session.resolved.def.stock }))}>
          Ask for the box
        </button>
      </div>
    </Section>
  );
}

function Box({ session }: { session: PciLabSession }) {
  const dev = session.st.device!;
  const spec = DEVICE_BY_ID[dev.specId];
  const today = useCart(session.st).today;
  const label = deviceBoxLabel(dev, today);
  const aids = labScreens(session.policy).teachingAids;
  return (
    <Section title="Box">
      <div className="text-[12px] text-ink">
        {spec.label} {label.size}
      </div>
      {dev.labelChecked ? (
        <div className="space-y-0.5 font-mono text-[12px] text-ink-soft" aria-label="Box label">
          {label.lines.map((l, i) => (
            <div key={`${l.k}-${i}`} className="flex justify-between gap-2">
              <span className="text-ink-faint">{l.k}</span>
              <span>{l.v}</span>
            </div>
          ))}
          <div className="flex justify-between gap-2">
            <span className="text-ink-faint">Today</span>
            <span>{today}</span>
          </div>
          {aids && label.expired && <div className="text-warn">Out of date: send it back.</div>}
        </div>
      ) : (
        <div className="text-[12px] text-ink-faint">Read the label back before it is opened: type, diameter, length and use-by date.</div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {!dev.labelChecked && (
          <button className="btn btn-accent !py-1 text-[12px]" onClick={() => act(session, "load-device", checkLabel)}>
            Read the label back
          </button>
        )}
        <button className={BTN} onClick={() => act(session, "load-device", returnBox)}>
          Send the box back
        </button>
      </div>
    </Section>
  );
}

function Prep({ session }: { session: PciLabSession }) {
  const dev = session.st.device!;
  const [mix, setMix] = useState<BalloonMixture>(dev.mixture ?? "1:1");
  return (
    <Section title="Prep station">
      <div className="flex flex-wrap items-center gap-1.5">
        <select value={mix} onChange={(e) => setMix(e.target.value as BalloonMixture)} className={SELECT} aria-label="Syringe mixture">
          {MIXTURES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <button className={BTN} onClick={() => act(session, "load-device", (x) => fillPrepSyringe(x, mix))}>
          Fill the syringe
        </button>
        <button className={BTN} onClick={() => act(session, "load-device", applySuction)} disabled={!dev.mixture}>
          Pull negative, plunger up
        </button>
        <button className={BTN} onClick={() => act(session, "load-device", connectIndeflator)} disabled={!dev.mixture || !!dev.indeflatorConnected}>
          {dev.indeflatorConnected ? "Indeflator connected" : "Connect the indeflator"}
        </button>
      </div>
      <div className="text-[12px] text-ink-soft" role="status">
        {syringeView(dev)}
      </div>
    </Section>
  );
}

function Rail({ session }: { session: PciLabSession }) {
  const st = session.st;
  const dev = st.device!;
  const guided = session.policy.mode === "guided";
  const inGuide = dev.stage === "in-guide";
  const distal = dev.centreMm + dev.lengthMm / 2;
  const toMark = () => {
    const target = -PUSH_STOP_SHORT_MM;
    const mm = target - distal;
    if (mm > 0) deliverByHand(session, mm);
  };
  return (
    <Section title="Wire and valve">
      <div className="flex flex-wrap gap-1.5">
        <button className={BTN} onClick={() => act(session, "advance-wire", (x) => pinWire(x, !x.wire.pinned))} aria-pressed={st.wire.pinned}>
          {st.wire.pinned ? "Wire pinned" : "Pin the wire"}
        </button>
        {dev.stage !== "backloaded" && !inGuide && (
          <button className="btn btn-accent !py-1 text-[12px]" onClick={() => act(session, "load-device", backloadDevice)}>
            Backload on the wire
          </button>
        )}
        <button className={BTN} onClick={() => act(session, "load-device", (x) => setValve(x, !x.valveOpen))} aria-pressed={st.valveOpen}>
          {st.valveOpen ? "Close the valve" : "Open the valve"}
        </button>
        {dev.stage === "backloaded" && (
          <button className={BTN} onClick={() => act(session, "remove-device", removeDevice)}>
            Take it off the wire
          </button>
        )}
        {inGuide && (
          <button className={BTN} onClick={() => act(session, "remove-device", removeDevice)}>
            Withdraw the device
          </button>
        )}
      </div>
      {dev.stage === "backloaded" && <div className="text-[12px] text-ink-faint">On the wire. Open the valve and push it in at the Y-connector.</div>}
      {inGuide && <div className="font-mono text-[12px] text-ink-soft">Shaft beyond the valve {(deviceShaftMm(st) / 10).toFixed(0)} cm (guide {guideLengthMm(st.guide) / 10} cm)</div>}
      {guided && (dev.stage === "backloaded" || inGuide) && (
        <div className="flex flex-wrap gap-1.5" aria-label="Push the device (guided practice)">
          {(dev.stage === "backloaded" || distal < -PUSH_STOP_SHORT_MM - 1) && (
            <button className={BTN} onClick={() => (dev.stage === "backloaded" ? deliverByHand(session, 1) : toMark())} disabled={!st.valveOpen && dev.stage === "backloaded"}>
              {dev.stage === "backloaded" ? "Introduce through the valve" : "Push to the shaft mark"}
            </button>
          )}
          {inGuide && (
            <>
              <button className={BTN} onClick={() => deliverByHand(session, -5)}>
                Back 5 mm
              </button>
              <button className={BTN} onClick={() => deliverByHand(session, 2)}>
                Forward 2 mm
              </button>
              <button className={BTN} onClick={() => deliverByHand(session, 5)}>
                Forward 5 mm
              </button>
            </>
          )}
        </div>
      )}
    </Section>
  );
}

function Guide({ session }: { session: PciLabSession }) {
  const st = session.st;
  const tray = trayOf(st);
  const aids = labScreens(session.policy).teachingAids;
  const wireChecked = wireSeenSinceRemoval(st);
  const needsCheck = !st.device || st.device.stage !== "in-guide";
  return (
    <Section title="Guide">
      <div className="flex flex-wrap gap-1.5">
        <button className={BTN} onClick={() => act(session, "flush-guide", aspirateGuide)} title="Back-bleed the Y-connector, aspirate and flush the guide through the manifold">
          Back-bleed and aspirate the guide
        </button>
      </div>
      {aids && needsCheck && (
        <ul className="space-y-0.5 text-[12px]" aria-label="Before the device (guided practice)">
          <li className={wireChecked ? "text-good" : "text-ink-faint"}>{wireChecked ? "Wire tip seen on an injection since the last device" : "Inject to see the wire tip before the device goes in"}</li>
          <li className={tray.guideClear ? "text-good" : "text-ink-faint"}>{tray.guideClear ? "Guide back-bled and aspirated" : "Back-bleed and aspirate the guide before the next injection"}</li>
        </ul>
      )}
    </Section>
  );
}

function WireSetUp({ session }: { session: PciLabSession }) {
  const st = session.st;
  const tray = trayOf(st);
  // every item starts unset: the learner chooses each one (the introducer, the tip hidden, through the valve, the torque device)
  const [setup, setSetup] = useState<WireSetup>({ yConnector: "rotating", introducer: false, tipHidden: false, throughValve: false, torqueDeviceCm: null });
  // the set-up belongs to the wire it was done for (wireLoadedAtTable: no newer wire since); a wire in the
  // artery that was not set up here was loaded by the team. Once loaded, the form is not offered again.
  const mine = !!tray.wireSetup && wireLoadedAtTable(st);
  if (st.tipMm > 0 || mine) {
    // with a device out the wire's set-up is history: the line is left out to keep the tray short
    if (st.device) return null;
    return (
      <Section title="Wire set-up">
        <div className="text-[12px] text-ink-faint">
          {mine ? `Loaded through the ${tray.wireSetup!.yConnector} valve${tray.wireSetup!.torqueDeviceCm ? `, torque device at ${tray.wireSetup!.torqueDeviceCm} cm` : ""}.` : "The wire on the table was loaded by the team."}
        </div>
      </Section>
    );
  }
  const tick = (k: "introducer" | "tipHidden" | "throughValve", label: string) => (
    <label className="flex items-center gap-1 text-[12px] text-ink-soft">
      <input type="checkbox" checked={setup[k]} onChange={(e) => setSetup({ ...setup, [k]: e.target.checked })} />
      {label}
    </label>
  );
  return (
    <Section title="Wire set-up">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <select value={setup.yConnector} onChange={(e) => setSetup({ ...setup, yConnector: e.target.value as WireSetup["yConnector"] })} className={SELECT} aria-label="Haemostatic valve">
          <option value="rotating">Rotating haemostatic valve</option>
          <option value="automated">Automated haemostatic valve</option>
        </select>
        {tick("introducer", "Introducer")}
        {tick("tipHidden", "Tip hidden in it")}
        {tick("throughValve", "Pushed through the valve")}
        <select value={setup.torqueDeviceCm ?? 0} onChange={(e) => setSetup({ ...setup, torqueDeviceCm: Number(e.target.value) || null })} className={`${SELECT} font-mono`} aria-label="Torque device position">
          <option value={0}>No torque device stop</option>
          <option value={90}>Torque device at 90 cm</option>
          <option value={100}>Torque device at 100 cm</option>
        </select>
        <button className="btn btn-accent !py-1 text-[12px]" onClick={() => act(session, "advance-wire", (x) => setUpWire(x, setup))}>
          Load the wire
        </button>
      </div>
    </Section>
  );
}

function Nurse({ session }: { session: PciLabSession }) {
  const step = nextAssistStep(session.st);
  // the step is named (and the button hidden when none is left) only as a teaching aid: the engine's view of
  // the device (prepared or not, the guide clear or not) is otherwise for the syringe, the label and the image
  const aids = labScreens(session.policy).teachingAids;
  const what = step === "label" ? "read the label back" : step === "prepare" ? "prepare the balloon" : step === "backload" ? "backload it on the wire" : step === "aspirate" ? "aspirate the guide" : null;
  if (aids && !what) return null;
  return (
    <Section title="Scrub nurse">
      <button className={BTN} onClick={() => act(session, step === "aspirate" ? "flush-guide" : "load-device", assistStep)}>
        {aids ? `Ask the scrub nurse to ${what}` : "Ask the scrub nurse for the next step"}
      </button>
    </Section>
  );
}

export default function EquipmentTray({ session }: PciConsoleProps) {
  usePciSession(session);
  const dev = session.st.device;
  const onTable = !!dev && dev.stage !== "in-guide" && dev.stage !== "backloaded";
  const inflatable = !!dev && (dev.kind === "balloon" || dev.kind === "stent" || dev.kind === "covered-stent");
  return (
    <div className="space-y-2 text-[13px]" aria-label="Equipment tray" data-case-date={MP_CASE_DATE}>
      <Cart session={session} />
      {!dev && <Request session={session} />}
      {dev && onTable && <Box session={session} />}
      {dev && onTable && inflatable && <Prep session={session} />}
      {dev && <Rail session={session} />}
      <Guide session={session} />
      <Nurse session={session} />
      <WireSetUp session={session} />
    </div>
  );
}
