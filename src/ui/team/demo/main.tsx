// ---------------------------------------------------------------------------
// Development-only page for the team and audio engine (track C4).
// Served by the dev server at /src/ui/team/demo/index.html; not part of the
// production build (vite builds index.html only).
//
// It wires one seeded patient (S9 PatientEngine), the S8 input system
// (keyboard pedals F and C, syringe J), a C-arm and table drive, the team and
// LabAudio exactly as a lab would (see docs/realism/wave2/C4.md, "Integration
// steps"), with buttons that trigger engine events. window.__teamDemo exposes
// everything, and step(seconds) runs the frame loop by hand when the tab is
// hidden (requestAnimationFrame pauses).
// ---------------------------------------------------------------------------

import "../../../styles/index.css";
import { StrictMode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { PatientEngine } from "../../../simulation/patient/engine";
import { generatePatient, vignette } from "../../../simulation/patient/patient";
import { createInputSystem, GRIP_ORDER_PCI } from "../../../input";
import { CArmDrive, TableDrive } from "../../../simulation/imaging/carm";
import type { TelemetryEvent } from "../../../simulation/session/types";
import { Team } from "../../../simulation/team/team";
import type { TeamAction, TableItem, PreparedSyringe } from "../../../simulation/team/types";
import { AudioEngine } from "../../../audio/engine";
import { LabAudio } from "../../../audio/labAudio";
import HaemoMonitor from "../../lab/HaemoMonitor";
import Captions from "../Captions";
import CommandPalette from "../CommandPalette";
import TeamButtons from "../TeamButtons";
import AudioMixer from "../AudioMixer";

interface Imaging {
  fluoroPps: number;
  cinePps: number;
  fieldCm: number;
  fluoroLevel: "low" | "normal" | "high";
}

function makeLab(seed: string) {
  const profile = generatePatient(seed, { indication: "SA" });
  const engine = new PatientEngine({ profile });
  engine.setTip({ location: "aorta" });
  const input = createInputSystem({ present: ["sheath", "catheter", "wire014", "balloon"], gripOrder: GRIP_ORDER_PCI });
  const carm = new CArmDrive({ laoRao: 0, cranialCaudal: 0 });
  const table = new TableDrive();
  const imaging: Imaging = { fluoroPps: 15, cinePps: 15, fieldCm: 20, fluoroLevel: "normal" };
  const lab = { side: "left" as "left" | "right", fluoroS: 0, signalled: 0, syringeMl: 0, syringeForce: 0, atm: 0, atmTarget: 0 };
  const team = new Team({
    seed,
    patient: engine,
    input,
    carm,
    table,
    imaging: () => ({ ...imaging, fluoroMin: lab.fluoroS / 60 }),
    catheterSide: () => lab.side,
  });
  const audioEngine = new AudioEngine();
  const audio = new LabAudio(audioEngine);
  audio.setPatient(engine);
  input.bus.on("carm", (v) => carm.setCommandedVelocity(v.laoDegPerS, v.cranDegPerS));
  input.bus.on("table", (v) => table.setCommandedVelocity(v.xMmPerS, v.yMmPerS));
  input.bus.on("syringe", (s) => {
    // demo only: contrast through the syringe at up to 4 mL/s (model), delivered to the engine on release
    if (s.force <= 0 && lab.syringeMl > 0) {
      engine.contrast(lab.syringeMl, lab.side);
      lab.syringeMl = 0;
    }
    lab.syringeForce = s.port === "contrast" ? Math.max(0, s.force) : 0;
  });
  team.bus.on("action", (a: TeamAction) => {
    if (a.a === "protocol") {
      if (a.fluoroPps) imaging.fluoroPps = a.fluoroPps;
      if (a.cinePps) imaging.cinePps = a.cinePps;
      if (a.fieldCm) imaging.fieldCm = a.fieldCm;
      if (a.fluoroLevel) imaging.fluoroLevel = a.fluoroLevel;
      audio.setImaging({ fluoroLevel: imaging.fluoroLevel, fluoroPps: imaging.fluoroPps, cinePps: imaging.cinePps });
    }
  });
  const pending: TelemetryEvent[] = [];
  const log: TelemetryEvent[] = [];
  /** one frame of the lab loop */
  const frame = (dt: number) => {
    input.frame(dt * 1000);
    carm.step(dt);
    table.step(dt);
    engine.advance(dt);
    // screening time and the five-minute signal (the S6 DoseTracker emits this in the labs)
    if (input.pedalState().fluoro) {
      lab.fluoroS += dt;
      const n = Math.floor(lab.fluoroS / 300);
      if (n > lab.signalled) {
        lab.signalled = n;
        pending.push({ tWall: team.t, tPatient: engine.time, kind: "dose.fluoro-5min", data: { fluoroMin: n * 5 } });
      }
    }
    if (lab.syringeForce > 0) lab.syringeMl += lab.syringeForce * 4 * dt;
    // inflation device: the pressure follows the target at 4 atm/s (demo model)
    if (lab.atm !== lab.atmTarget) {
      const d = Math.sign(lab.atmTarget - lab.atm) * Math.min(Math.abs(lab.atmTarget - lab.atm), 4 * dt);
      lab.atm += d;
      if (d > 0) audio.setIndeflator(lab.atm);
    }
    const ev = engine.drainEvents().concat(pending.splice(0));
    team.onTelemetry(ev);
    audio.onTelemetry(ev);
    team.advance(dt);
    audio.frame();
    for (const e of ev.concat(team.drainEvents())) log.push(e);
    if (log.length > 400) log.splice(0, log.length - 400);
  };
  return { profile, engine, input, carm, table, imaging, lab, team, audioEngine, audio, frame, pending, log };
}

type Lab = ReturnType<typeof makeLab>;

function useTick(ms = 250) {
  const [, set] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => set((x) => x + 1), ms);
    return () => clearInterval(iv);
  }, [ms]);
}

function Scenario({ lab }: { lab: Lab }) {
  const { engine, audio, team } = lab;
  const b = (label: string, fn: () => void, title?: string) => (
    <button type="button" className="btn px-2.5 py-1 text-xs" onClick={fn} title={title}>
      {label}
    </button>
  );
  return (
    <section className="panel">
      <div className="panel-head">Engine events</div>
      <div className="flex flex-wrap gap-1.5 px-3 py-3">
        {b("Femoral puncture", () => engine.stimulus("puncture", 0.7))}
        {b("Radial cocktail", () => {
          engine.give({ drug: "verapamil", dose: 2.5, route: "ia" });
          engine.stimulus("cocktail", 0.6);
        })}
        {b("Painful sheath", () => engine.stimulus("sheath", 1))}
        {b("Engage left", () => {
          lab.lab.side = "left";
          engine.setTip({ location: "ostium", side: "left", gap: 0.8 });
          audio.click("valve");
        })}
        {b("Engage right", () => {
          lab.lab.side = "right";
          engine.setTip({ location: "ostium", side: "right", gap: 0.8 });
          audio.click("valve");
        })}
        {b("Damp the trace", () => engine.setTip({ ...engine.tipInput, location: "ostium", side: lab.lab.side, gap: 0.12 }))}
        {b("Back to the aorta", () => engine.setTip({ location: "aorta" }))}
        {b("LV injection 30 mL", () => engine.contrast(30, "lv"), "Power injector run into the LV")}
        {b("Adenosine 200 µg IC", () => engine.give({ drug: "adenosine", dose: 200, route: "ic", side: "left" }), "Given by the operator, outside the team")}
        {b("Inflate in the LAD", () => {
          engine.setOcclusion("balloon", { vessel: "LAD", param: 0.35, fraction: 1 });
          engine.stimulus("balloon", 0.3);
          lab.lab.atmTarget = 12;
        })}
        {b("Deflate", () => {
          engine.clearOcclusion("balloon");
          lab.lab.atmTarget = 0;
          lab.lab.atm = 0;
          audio.indeflatorRelease();
        })}
        {b("Stopcock", () => audio.click("stopcock"))}
        {b("Torque lock", () => audio.click("torquer"))}
        {b("VF", () => engine.forceRhythm("vf"))}
        {b("Five minutes of screening", () => lab.pending.push({ tWall: team.t, tPatient: engine.time, kind: "dose.fluoro-5min", data: { fluoroMin: 5 } }))}
        {b("Next item wrong", () => (team.P.wrongItemP = 1))}
        {b("Next read-back misheard", () => (team.P.mishearP = 1))}
        {b("Normal error rates", () => {
          team.P.wrongItemP = 0.03;
          team.P.mishearP = 0.02;
        })}
        {b("Use last item", () => {
          const it = team.st.items[team.st.items.length - 1];
          if (it) team.itemUsed(it.id);
        })}
      </div>
    </section>
  );
}

function LabState({ lab }: { lab: Lab }) {
  useTick(250);
  const { carm, imaging, team, engine, input } = lab;
  const a = carm.angles;
  const v = engine.vitals();
  const pedal = input.pedalState();
  const items: TableItem[] = team.st.items.slice(-4);
  const syr: PreparedSyringe[] = team.st.syringes.filter((s) => s.givenAt === undefined);
  const row = (k: string, val: string) => (
    <div className="flex justify-between gap-3 text-[13px]">
      <span className="text-ink-faint">{k}</span>
      <span className="text-right font-mono text-ink">{val}</span>
    </div>
  );
  return (
    <section className="panel">
      <div className="panel-head">Lab state</div>
      <div className="flex flex-col gap-1 px-4 py-3">
        {row("C-arm", `${a.laoRao >= 0 ? "LAO" : "RAO"} ${Math.abs(a.laoRao).toFixed(1)}, ${a.cranialCaudal >= 0 ? "cranial" : "caudal"} ${Math.abs(a.cranialCaudal).toFixed(1)}`)}
        {row("Protocol", `fluoro ${imaging.fluoroPps}, cine ${imaging.cinePps}, field ${imaging.fieldCm}, ${imaging.fluoroLevel}`)}
        {row("Pedals", `${pedal.fluoro ? "fluoro " : ""}${pedal.cine ? "cine" : ""}` || "up")}
        {row("Screening", `${(lab.lab.fluoroS / 60).toFixed(1)} min`)}
        {row("Breath", engine.clockState().breathHold ? "held" : "free")}
        {row("Pinned", input.view().left.pinnedDevice ?? "none")}
        {row("Inflation", `${lab.lab.atm.toFixed(1)} atm`)}
        {row("Chest pain", `${v.symptoms.chestPain.toFixed(1)} / 10`)}
        {row("Conscious", v.symptoms.conscious.toFixed(2))}
        <div className="mt-1 text-xs text-ink-faint">On the table</div>
        {items.length === 0 && <div className="text-[13px] text-ink-faint">Nothing opened.</div>}
        {items.map((it) => (
          <div key={it.id} className="text-[13px] text-ink-soft">
            {it.asked.name}
            {it.replaced ? " (returned)" : ""}
            {it.labelCheckedAt !== undefined ? " · label checked" : ""}
          </div>
        ))}
        {syr.map((s) => (
          <div key={s.id} className="text-[13px] text-ink-soft">
            Syringe: {s.drug} {s.dose} {s.route.toUpperCase()}
          </div>
        ))}
      </div>
    </section>
  );
}

function Report({ lab }: { lab: Lab }) {
  const [rep, setRep] = useState<ReturnType<Team["report"]> | null>(null);
  return (
    <section className="panel">
      <div className="panel-head">
        <span>Communication</span>
        <button type="button" className="btn px-2.5 py-1 text-xs" onClick={() => setRep(lab.team.report())}>
          Score now
        </button>
      </div>
      <div className="flex flex-col gap-1.5 px-4 py-3 text-[13px]">
        {!rep && <span className="text-ink-faint">The debrief summary appears here.</span>}
        {rep?.lines.map((l) => (
          <span key={l} className="text-ink">
            {l}
          </span>
        ))}
        {rep?.findings.map((f, i) => (
          <span key={i} className={f.severity === "safety" ? "text-[#f2938c]" : "text-ink-soft"}>
            {lab.team.clock(f.t)} {f.text}
          </span>
        ))}
      </div>
    </section>
  );
}

function Demo() {
  const seed = useMemo(() => new URLSearchParams(location.search).get("seed") ?? "c4-demo", []);
  const lab = useMemo(() => makeLab(seed), [seed]);
  const stage = useRef<HTMLDivElement | null>(null);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__teamDemo = {
      ...lab,
      /** run the loop by hand (hidden tab) */
      step(seconds: number, dt = 1 / 60) {
        for (let t = 0; t < seconds; t += dt) lab.frame(dt);
      },
    };
    // attach here (not in makeLab) so React's development double effect re-attaches after its cleanup
    const offAudio = [lab.audio.attachInput(lab.input.bus), lab.audio.attachTeam(lab.team)];
    const off = lab.input.attach(stage.current ?? document.body);
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (dt > 0) lab.frame(dt);
    };
    raf = requestAnimationFrame(loop);
    // the first key press or click turns sound on (browsers need a gesture)
    const unlock = () => void lab.audioEngine.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      cancelAnimationFrame(raf);
      off();
      offAudio.forEach((f) => f());
      lab.audio.exposure.set("off");
    };
  }, [lab]);

  return (
    <div className="min-h-screen bg-base-900 px-5 py-4 text-ink" ref={stage} tabIndex={-1}>
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">Team and audio</h1>
        <span className="chip">Development page</span>
        <span className="text-[13px] text-ink-soft">{vignette(lab.profile)}</span>
        <button type="button" className="btn btn-accent ml-auto" onClick={() => setPalette(true)}>
          Speak to the team (Ctrl K)
        </button>
      </header>
      <p className="mb-4 text-[13px] text-ink-faint">Hold F for fluoroscopy and C for cine (exposure tone). Hold J to push contrast. Click once anywhere to allow sound.</p>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <HaemoMonitor engine={lab.engine} />
          <Scenario lab={lab} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Captions team={lab.team} height={560} limit={60} />
          <section className="panel">
            <div className="panel-head">Quick orders</div>
            <div className="px-3 py-3">
              <TeamButtons team={lab.team} compact />
            </div>
          </section>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <AudioMixer engine={lab.audioEngine} voices={lab.audio.voices} />
          <LabState lab={lab} />
          <Report lab={lab} />
        </div>
      </div>
      <CommandPalette team={lab.team} open={palette} onOpenChange={setPalette} />
    </div>
  );
}

// one root per page, also when a hot update re-runs this module
const host = document.getElementById("root")! as HTMLElement & { __root?: ReturnType<typeof createRoot> };
host.__root ??= createRoot(host);
host.__root.render(
  <StrictMode>
    <Demo />
  </StrictMode>
);
