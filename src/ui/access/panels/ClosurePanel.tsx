// Closure of the access site, and the pleth strip the recovery panel shares.
// (split from src/ui/access/panels.tsx by proc-foundation-scenarios-ledger; panels.tsx re-exports it).
//
// Several access sites (access-multi-site): the panel closes the active site, with a site selector
// when the case has more than one, and names the sites still to close. A femoral vein sheath is closed
// by taking it out and holding pressure. The case moves on to recovery only once no other site is open.
//
// Femoral artery closure (access-closure-femoral-manual): the ACT, the femoral angiogram (read in the
// fluoroscopy workspace), the four questions of the closure algorithm and the closure chosen
// (src/simulation/access/closurePlan.ts), then hands-on manual compression: the fingers dragged on the
// groin (GroinView), the pressure held and adjusted, time passing a minute at a time, what the
// operator feels under the fingers, the timer against the chosen rule, and the release; then the groin,
// the foot pulses and a clear dressing. The preparation and protamine are orders (orders/Compression.tsx).
// Nothing here grades the learner during the case: the answers and choices are recorded and shown in
// the debrief; in guided mode only, the algorithm's answers are shown once given. Under the femoral
// angiogram button the learner's own report of it (session.femoralAngioReport, made on the fluoroscopy
// workspace) is shown again, so the puncture height read there is at hand for the closure; its grade only in
// guided mode.
//
// Radial closure (access-closure-radial; lesson pm-closure-radial, Brilakis 11.2's five steps): the sheath comes
// out at the end of the case whatever the ACT (measuring and waiting are offered, and waiting is scored); a
// vasodilator through the side arm mixed with blood; the band dragged along the wrist (WristView) and applied
// over the sheath at a chosen inflation; the sheath pulled under it, which a sheath gripped by spasm does not
// answer (pulling it by force is offered, and is a critical error through spasm); the spasm rescue (warmth, a
// lubricious solution, the upper-arm cuff above systolic for 5 minutes; sedation and more vasodilator from
// the orders); the band's air let out or added, the band moved or a second band added against it; the ulnar
// artery compressed with the finger pleth live on the monitor strip, and a recorded pleth check; the band
// timer and the time it is to come off. A follow-up vignette (late radial problems) is answered here once the
// case is closed: the vignettes open on this workspace, and the form then takes the place of the band's controls. What the wrist shows is what the operator sees; the arterial hole is drawn in guided mode only.
import { useMemo, useState } from "react";
import { useProcedureStore } from "../../../state/useProcedureStore";
import { SOURCED_DOSES, type CaseSession } from "../../../simulation/session/caseSession";
import { CLOSURE_CHOICES, CLOSURE_CHOICE_LABEL, type ClosureAnswers, type AnswerGrade } from "../../../simulation/access/closurePlan";
import { pressureWord } from "../../../simulation/access/compression";
import { ANGIO_REPORT_FIELDS } from "../../../simulation/access/upsizing";
import { MP_BAND, MP_BAND_POSITION, RADIAL_LATE, RADIAL_LATE_DX_LABEL, RADIAL_LATE_PLAN_LABEL, RADIAL_SPASM_RESCUE, type RadialLateDx, type RadialLatePlan } from "../../../simulation/access/closure";
import { bleedText } from "../../../simulation/session/caseSession";
import { clock, useSession } from "../panels";
import { GroinView } from "../GroinView";
import { WristView } from "../WristView";
import { SiteSelector, siteShortName } from "./AccessPicker";

/** The wait with the sheath sutured in, for the ACT to fall (s; a control setting). */
const WAIT_S = 600;

/** Sites other than the active one that still have a sheath to close. */
const othersOpen = (x: CaseSession) => x.openSites().filter((o) => o.id !== x.activeSiteId);

export function ClosurePanel() {
  const s = useSession();
  const act = useProcedureStore((x) => x.act);
  const setWorkspace = useProcedureStore((x) => x.setWorkspace);
  const vein = s.activeSite.siteKind === "femoral-vein";
  const femoral = s.access === "femoral";
  const multi = s.sites.length > 1;
  const left = othersOpen(s);
  /** after closing this site: recovery once no other site is open, else stay here for the next one */
  const next = () => {
    const x = useProcedureStore.getState().session;
    if (!x || othersOpen(x).length === 0) setWorkspace("recovery");
  };
  const r = s.radial;
  const busy = s.busy;
  return (
    <div className="panel h-full flex flex-col overflow-hidden">
      <div className="panel-head">
        <span>Closure</span>
        <span className="flex items-center gap-2 normal-case tracking-normal text-ink-faint text-[12px]">
          <SiteSelector />
          {multi ? siteShortName(s.activeSite).toLowerCase() : femoral ? `${s.site.side} groin` : "wrist"}
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2 max-w-2xl">
        {s.catheter?.inBody && (
          <button className="btn" disabled={busy} onClick={() => act((x) => x.removeCatheter())}>
            Take the catheter out
          </button>
        )}
        {!s.sheath && !s.compression && !s.closureDone() && <p className="text-[13px] text-ink-faint">{s.siteClosed(s.activeSite) ? "This site is closed." : "There is no sheath in."}</p>}
        {multi && left.length > 0 && <p className="text-[13px] text-ink-soft">Still to close: {left.map((o) => siteShortName(o).toLowerCase()).join(", ")}.</p>}
        {vein && s.sheath && (
          <button
            className="btn btn-accent"
            disabled={busy || !!s.catheter?.inBody}
            onClick={() => {
              act((x) => x.removeSheathAndCompress());
              next();
            }}
          >
            Pull the venous sheath and hold pressure
          </button>
        )}
        {/* a follow-up vignette (the case long closed) is the screen's whole task: the old band's controls are not shown */}
        {s.radialLate && <RadialFollowUp />}
        {!femoral && !vein && !s.radialLate && (s.sheath || r) && <RadialClosure onClosed={next} />}
        {femoral && !vein && (s.sheath || s.compression) && <FemoralClosure onClosed={next} />}
      </div>
    </div>
  );
}

/** A small pleth strip (monitor colours: this is a monitor). */
export function Pleth({ present, text, amplitude }: { present: boolean; text: string; amplitude?: number }) {
  const a = amplitude ?? (present ? 1 : 0);
  // rebuilt only when the amplitude changes, not on every session update while the band is on
  const pts = useMemo(
    () =>
      Array.from({ length: 121 }, (_, i) => {
        const t = (i / 120) * 3;
        const ph = t % 1;
        const y = a > 0 ? a * (ph < 0.2 ? Math.sin((ph / 0.2) * Math.PI * 0.5) : Math.exp(-(ph - 0.2) / 0.35)) : 0.02 * Math.sin(i);
        return `${(i / 120) * 300},${50 - y * 38}`;
      }).join(" "),
    [a],
  );
  return (
    <div className="monitor rounded-md p-2">
      <svg viewBox="0 0 300 56" className="w-full h-14">
        <polyline points={pts} fill="none" className="stroke-spo2" stroke="currentColor" strokeWidth="2" style={{ color: "#4FD6EE" }} />
      </svg>
      <div className="text-[12px] text-ink-soft">{text}</div>
    </div>
  );
}

/** A yes or no question of the closure algorithm. */
function YesNo({ label, value, onChange, yes = "Yes", no = "No" }: { label: string; value: boolean | undefined; onChange: (v: boolean) => void; yes?: string; no?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <span className="text-[13px] text-ink-soft">{label}</span>
      <div className="seg">
        <button className={`seg-btn ${value === true ? "seg-btn-active" : ""}`} onClick={() => onChange(true)}>
          {yes}
        </button>
        <button className={`seg-btn ${value === false ? "seg-btn-active" : ""}`} onClick={() => onChange(false)}>
          {no}
        </button>
      </div>
    </div>
  );
}

/** The femoral artery closure: plan, then a device, a sutured sheath or hands-on compression. */
function FemoralClosure({ onClosed }: { onClosed: () => void }) {
  const s = useSession();
  const act = useProcedureStore((x) => x.act);
  const setWorkspace = useProcedureStore((x) => x.setWorkspace);
  const [ans, setAns] = useState<Partial<ClosureAnswers>>({});
  const [grade, setGrade] = useState<AnswerGrade | null>(null);
  const [line, setLine] = useState<string | null>(null);
  const busy = s.busy;
  const c = s.compression;
  const guided = s.policy.overlays.labels;
  const plan = s.activeSite.closure.plan;
  const lastAct = s.acts.length ? s.acts[s.acts.length - 1] : null;
  const say = (t: string | null | undefined) => t && setLine(t);

  if (c) {
    const live = c.releasedAt === null;
    const timer = s.compressionTimer();
    const feel = s.compressionFeel();
    const ac = s.activeSite.closure.aftercare;
    const needle = s.pm.st.needle;
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-md border border-line p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] text-ink">Manual compression</span>
            {timer && (
              <span className="font-mono text-[13px] text-ink" data-compression-timer>
                {timer.minutes.toFixed(1)} min <span className="text-ink-faint font-sans text-[12px]">rule: {timer.text}</span>
              </span>
            )}
          </div>
          <div className="flex gap-3 items-start flex-wrap">
            <GroinView
              c={c}
              creaseMm={needle ? -needle.entryX : 0}
              side={s.site.side}
              bleeding={live && c.oozeMlMin > 0}
              showHole={guided}
              disabled={!live || busy}
              onMove={(xMm, yMm) => act((x) => x.setHands({ xMm, yMm }))}
            />
            <div className="flex-1 min-w-[180px] flex flex-col gap-2">
              {live && (
                <>
                  <label className="flex flex-col gap-1 text-[13px] text-ink-soft">
                    <span>
                      Pressure: <span className="text-ink">{pressureWord(c.hands.pressure)}</span>
                    </span>
                    <input type="range" min={0} max={1} step={0.05} value={c.hands.pressure} disabled={busy} onChange={(e) => act((x) => x.setHands({ pressure: +e.target.value }))} aria-label="Pressure under the fingers" />
                  </label>
                  {feel && <p className="text-[13px] text-ink leading-snug" data-compression-feel>{feel}</p>}
                  <div className="flex gap-1.5 flex-wrap">
                    <button className="btn" disabled={busy} onClick={() => act((x) => x.holdCompression(1))}>
                      Hold 1 min
                    </button>
                    <button className="btn" disabled={busy} onClick={() => act((x) => x.holdCompression(2))}>
                      Hold 2 min
                    </button>
                    <button
                      className="btn btn-accent"
                      disabled={busy}
                      onClick={() => {
                        const r = act((x) => x.releaseCompression());
                        if (r) setLine(r.held ? "The puncture holds." : "It bleeds as the fingers lift.");
                      }}
                    >
                      Release
                    </button>
                  </div>
                </>
              )}
              <div className="flex gap-1.5 flex-wrap">
                <button className="btn" disabled={busy} onClick={() => say(act((x) => x.checkGroin()))}>
                  Look at the groin
                </button>
                <button className="btn" disabled={busy} onClick={() => say(act((x) => x.checkFootPulses()))}>
                  Feel the foot pulses
                </button>
                {!live && (
                  <button className="btn" disabled={busy || ac?.dressingT != null} onClick={() => act((x) => x.applyDressing()) && setLine("Clear dressing on.")}>
                    Clear sterile dressing
                  </button>
                )}
              </div>
              {line && <p className="text-[13px] text-ink-soft leading-snug">{line}</p>}
              {!live && (
                <button className="btn btn-good self-start" disabled={busy} onClick={onClosed}>
                  Done at this groin
                </button>
              )}
            </div>
          </div>
          {live && <p className="text-[12px] text-ink-faint">The emergency orders stay open while you press.</p>}
        </div>
      </div>
    );
  }

  const q = (k: keyof ClosureAnswers, v: ClosureAnswers[keyof ClosureAnswers]) => setAns((a) => ({ ...a, [k]: v }));
  const answerable = ans.sheath === "stays" || (ans.sheath === "out" && ans.deviceOk !== undefined && (ans.deviceOk ? ans.highStick !== undefined : ans.actBelow180 !== undefined));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap items-center">
        <button className="btn" disabled={busy} onClick={() => act((x) => x.measureAct())}>
          Measure ACT
        </button>
        {lastAct && <span className="font-mono text-[13px] text-ink">ACT {Math.round(lastAct.act)} s</span>}
        <button className="btn" disabled={busy} onClick={() => say(act((x) => x.femoralAngiogram()))}>
          Femoral angiogram through the sheath
        </button>
        <button className="btn btn-ghost" onClick={() => setWorkspace("fluoro")}>
          Read it on fluoroscopy
        </button>
        <button className="btn" disabled={busy || !!s.catheter?.inBody} onClick={() => act((x) => x.wait(WAIT_S, "Waiting for the ACT to fall, the sheath sutured in"))} data-closure-wait>
          Wait {WAIT_S / 60} min (sheath sutured), then recheck
        </button>
      </div>
      {line && <p className="text-[13px] text-ink-soft">{line}</p>}
      <AngioReportLine guided={guided} />

      <div className="rounded-md border border-line p-2.5 flex flex-col gap-2" data-closure-algorithm>
        <div className="text-[13px] text-ink">The closure algorithm</div>
        <YesNo label="1. Can the sheath come out now?" value={ans.sheath === undefined ? undefined : ans.sheath === "out"} onChange={(v) => setAns({ sheath: v ? "out" : "stays" })} yes="Comes out" no="Stays" />
        {ans.sheath === "out" && <YesNo label="2. Can a closure device be used?" value={ans.deviceOk} onChange={(v) => setAns({ sheath: "out", deviceOk: v })} />}
        {ans.sheath === "out" && ans.deviceOk === true && <YesNo label="3. Was the stick high?" value={ans.highStick} onChange={(v) => q("highStick", v)} />}
        {ans.sheath === "out" && ans.deviceOk === false && <YesNo label="4. Is the ACT below 180 s?" value={ans.actBelow180} onChange={(v) => q("actBelow180", v)} />}
        <button className="btn self-start" disabled={!answerable || busy} onClick={() => setGrade(act((x) => x.answerClosureQuestions(ans as ClosureAnswers)) ?? null)}>
          {plan?.answers ? "Answered" : "Record the answers"}
        </button>
        {grade && guided && (
          <ul className="flex flex-col gap-0.5" data-closure-guided>
            {grade.items.map((i) => (
              <li key={i.key} className={`text-[12px] ${i.correct ? "text-ink-soft" : "text-warn"}`}>
                {i.label} {i.expected}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-md border border-line p-2.5 flex flex-col gap-1.5">
        <div className="text-[13px] text-ink">Closure</div>
        <button className="btn self-start" disabled={busy} onClick={() => act((x) => x.reprepSkin())}>
          Prepare the groin again with antiseptic
        </button>
        <div className="grid grid-cols-1 gap-1.5">
          {CLOSURE_CHOICES.map((ch) => (
            <button
              key={ch}
              className={`btn text-left leading-snug ${plan?.choice?.choice === ch ? "border-accent text-accent" : ""}`}
              disabled={busy || !!s.catheter?.inBody || (!!plan?.choice && !(plan.choice.choice === "wait-then-compress" && ch === "manual-compression"))}
              onClick={() => {
                act((x) => x.chooseClosure(ch));
                const x = useProcedureStore.getState().session;
                if (x && x.siteClosed(x.activeSite)) onClosed();
              }}
              data-closure-choice={ch}
            >
              {CLOSURE_CHOICE_LABEL[ch]}
            </button>
          ))}
        </div>
        <button className="btn btn-accent self-start mt-1" disabled={busy || !!s.catheter?.inBody || !s.sheath} onClick={() => act((x) => x.startCompression({ xMm: 0, yMm: 0 }))}>
          Fingers on, pull the sheath
        </button>
      </div>
    </div>
  );
}

/** The learner's own report of the femoral angiogram at this groin, shown again for the closure (its grade only in guided mode). */
function AngioReportLine({ guided }: { guided: boolean }) {
  const s = useSession();
  const rep = s.femoralAngioReport;
  if (!rep) return s.activeSite.femoralAngio ? <p className="text-[12px] text-ink-faint">The angiogram has not been reported yet: read it on fluoroscopy.</p> : null;
  const words = ANGIO_REPORT_FIELDS.map((f) => `${f.label.toLowerCase()}: ${(f.options.find((o) => o.value === rep.given[f.key])?.label ?? "").toLowerCase()}`);
  return (
    <div className="text-[12px] text-ink-soft leading-snug" data-closure-angio-report>
      <span className="text-ink">Your angiogram report.</span> {words.join("; ")}.
      {guided && (
        <span className={rep.grade.correct === rep.grade.total ? " text-good" : " text-warn"}>
          {" "}
          {rep.grade.correct} of {rep.grade.total} as the angiogram shows.
        </span>
      )}
    </div>
  );
}

/** Radial closure: the vasodilator, the band on the wrist, the sheath out, patent haemostasis and the band timer. */
function RadialClosure({ onClosed }: { onClosed: () => void }) {
  const s = useSession();
  const act = useProcedureStore((x) => x.act);
  const [ml, setMl] = useState(15);
  const [hours, setHours] = useState<number>(SOURCED_DOSES.bandHours);
  const [plan, setPlan] = useState<number | null>(null);
  const [line, setLine] = useState<string | null>(null);
  const [check, setCheck] = useState<string | null>(null);
  const busy = s.busy;
  const r = s.radial;
  const g = s.radialPunctureGeometry();
  const guided = s.policy.overlays.labels;
  const lastAct = s.acts.length ? s.acts[s.acts.length - 1] : null;
  const st = s.bandNow();
  const pleth = s.plethNow();
  const live = !!r && r.bandOffAt === null;
  const done = !!r && r.sheathOut && s.delayed.length > 0;
  const skinX = g?.skinX ?? 0;
  // before the band goes on, where it is to be centred (default: on the skin nick, as the operator first sees it)
  const bandX = r?.centreX ?? plan ?? skinX;
  const sinceOut = r?.sheathOutAt != null ? s.tS - r.sheathOutAt : null;
  const sheathIn = !!s.sheath && !r?.sheathOut;
  // what the operator sees of a bleed: the forearm only once its swelling shows
  const seenBleed = live && st?.bleeding ? bleedText(st.bleedSite, r?.forearmMl ?? 0) : "";
  return (
    <div className="flex flex-col gap-2" data-radial-closure>
      {sheathIn && (
        <div className="flex gap-2 flex-wrap items-center">
          <button className="btn" disabled={busy} onClick={() => act((x) => x.measureAct())}>
            Measure ACT
          </button>
          {lastAct && <span className="font-mono text-[13px] text-ink">ACT {Math.round(lastAct.act)} s</span>}
          <button className="btn" disabled={busy || !!s.catheter?.inBody} onClick={() => act((x) => x.waitWithSheathIn(WAIT_S, "Waiting for the ACT to fall, the sheath in"))} data-radial-wait>
            Wait {WAIT_S / 60} min, then recheck
          </button>
        </div>
      )}
      {sheathIn && (
        <div className="rounded-md border border-line p-2.5 flex flex-col gap-1.5">
          <div className="text-[13px] text-ink">Through the side arm, mixed with blood drawn back</div>
          <div className="flex gap-1.5 flex-wrap">
            <button className="btn" disabled={busy || !!s.catheter?.inBody} onClick={() => act((x) => x.sideArmVasodilator("verapamil"))}>
              Verapamil
            </button>
            <button className="btn" disabled={busy || !!s.catheter?.inBody} onClick={() => act((x) => x.sideArmVasodilator("gtn"))}>
              Glyceryl trinitrate
            </button>
            <button className="btn" disabled={busy || !!s.catheter?.inBody} onClick={() => act((x) => x.sideArmVasodilator("both"))}>
              Both
            </button>
          </div>
        </div>
      )}
      <div className="flex gap-3 items-start flex-wrap">
        {g && (
          <WristView
            skinX={skinX}
            bandX={bandX}
            bandOn={!!r}
            secondX={r?.second?.centreX ?? null}
            sheathIn={sheathIn}
            bleedSite={live && st ? st.bleedSite : "none"}
            swelling={(r?.forearmMl ?? 0) >= MP_BAND_POSITION.visibleSwellingMl}
            holeX={guided ? g.holeX : null}
            disabled={busy || done || (!!r && !live)}
            onMove={setPlan}
            onCommit={r ? (x) => act((y) => y.setBandPosition(x)) : undefined}
          />
        )}
        <div className="flex-1 min-w-[200px] flex flex-col gap-2">
          {sheathIn && !r && (
            <>
              <label className="flex items-center gap-2 text-[13px] text-ink-soft">
                Band inflation {ml} mL
                <input type="range" min={4} max={MP_BAND.maxMl} step={0.5} value={ml} onChange={(e) => setMl(+e.target.value)} className="flex-1" />
              </label>
              <button className="btn btn-accent self-start" disabled={busy || !!s.catheter?.inBody} onClick={() => act((x) => x.applyBand(ml, bandX))}>
                Apply the band over the sheath
              </button>
            </>
          )}
          {r && sheathIn && (
            <div className="flex gap-1.5 flex-wrap">
              <button className="btn btn-accent" disabled={busy} onClick={() => setLine(act((x) => x.pullRadialSheath()) === "gripped" ? "The sheath will not come: it is held fast, and the patient winces." : null)}>
                Pull the sheath out under the band
              </button>
              <button className="btn" disabled={busy} onClick={() => act((x) => x.forceRadialSheath())} data-radial-force>
                Pull it out by force
              </button>
            </div>
          )}
          {r && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[13px] text-ink">Band {r.volumeMl} mL</span>
              <button className="btn" disabled={!live} onClick={() => act((x) => x.setBandVolume(r.volumeMl - 1))}>
                Let out 1 mL
              </button>
              <button className="btn" disabled={!live} onClick={() => act((x) => x.setBandVolume(r.volumeMl + 1))}>
                Add 1 mL
              </button>
              <button className="btn" disabled={!live} onClick={() => act((x) => x.setBandVolume(r.volumeMl + 2))}>
                Add 2 mL
              </button>
              {!r.second && (
                <button className="btn" disabled={busy || !live} onClick={() => act((x) => x.addSecondBand())}>
                  Second band against the first
                </button>
              )}
            </div>
          )}
          {r?.sheathOut && live && <div className={`notice ${seenBleed ? "notice-warn" : "notice-info"}`}>{seenBleed || "The wrist is dry."}</div>}
          {line && sheathIn && <p className="text-[13px] text-ink-soft leading-snug">{line}</p>}
        </div>
      </div>
      {sheathIn && r && (
        <div className="rounded-md border border-line p-2.5 flex flex-col gap-1.5">
          <div className="text-[13px] text-ink">If the sheath will not come</div>
          <div className="flex gap-1.5 flex-wrap">
            <button className="btn" disabled={busy} onClick={() => act((x) => x.warmForearm())}>
              Warm the forearm
            </button>
            <button className="btn" disabled={busy} onClick={() => act((x) => x.lubricateSheath())}>
              Lubricious solution
            </button>
            <button className="btn" disabled={busy} onClick={() => act((x) => x.upperArmCuff())}>
              Upper-arm cuff above systolic, {RADIAL_SPASM_RESCUE.cuffMin} min
            </button>
          </div>
          <p className="text-[12px] text-ink-faint">More vasodilator above; sedation from the orders.</p>
        </div>
      )}
      {r && live && (
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-[13px] text-ink-soft">
            <input type="checkbox" checked={r.ulnarCompression} onChange={(e) => act((x) => x.setUlnarCompression(e.target.checked))} />
            Compress the ulnar artery at the wrist
          </label>
          <Pleth present={pleth.amplitude > 0} amplitude={pleth.amplitude} text="Pulse oximeter on the index finger" />
          <button
            className="btn self-start"
            disabled={busy}
            onClick={() => {
              const res = act((x) => x.plethCheck());
              if (res) setCheck(res.cls === "D" ? "Recorded: trace lost with the ulnar artery compressed." : `Recorded: trace present with the ulnar artery compressed (pattern ${res.cls}).`);
            }}
          >
            Record a pleth check
          </button>
          {check && <p className="text-[12px] text-ink-soft">{check}</p>}
        </div>
      )}
      {r?.sheathOut && live && (
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {sinceOut !== null && (
            <span className="font-mono text-[13px] text-ink" data-band-timer>
              Band on {clock(sinceOut)}
            </span>
          )}
          {!done && (
            <>
              <label className="flex items-center gap-2 text-[13px] text-ink-soft flex-1 min-w-[180px]">
                Band off after {hours} h
                <input type="range" min={1} max={6} step={0.5} value={hours} onChange={(e) => setHours(+e.target.value)} className="flex-1" />
              </label>
              <button
                className="btn btn-good"
                disabled={busy}
                onClick={() => {
                  act((x) => x.finishRadialClosure(hours));
                  onClosed();
                }}
              >
                Haemostasis done
              </button>
            </>
          )}
        </div>
      )}
      {done && <p className="text-[13px] text-ink-faint">Haemostasis at the wrist; the band comes off in recovery.</p>}
    </div>
  );
}

const LATE_DX: readonly RadialLateDx[] = ["pseudoaneurysm", "sterile-granuloma", "infection", "radial-occlusion"];
const LATE_PLANS: readonly RadialLatePlan[] = ["duplex-compress-thrombin-surgery", "wait-steroid-excise", "antibiotics-debride", "anticoagulate-duplex"];

/** A follow-up vignette after the case: name the problem and the plan (the grade only in guided mode). */
export function RadialFollowUp() {
  const s = useSession();
  const act = useProcedureStore((x) => x.act);
  const [dx, setDx] = useState<RadialLateDx | null>(null);
  const [plan, setPlan] = useState<RadialLatePlan | null>(null);
  const v = s.radialLate;
  if (!v) return null;
  const guided = s.policy.overlays.labels;
  const shown = RADIAL_LATE[v.kind].presentation;
  return (
    <div className="rounded-md border border-line p-2.5 flex flex-col gap-2" data-radial-follow-up>
      <div className="text-[13px] text-ink">Follow-up</div>
      <p className="text-[13px] text-ink-soft leading-snug">{shown}</p>
      <div className="flex flex-col gap-1">
        <span className="text-[12px] text-ink-soft">What is it?</span>
        <div className="seg flex-wrap">
          {LATE_DX.map((d) => (
            <button key={d} className={`seg-btn ${dx === d ? "seg-btn-active" : ""}`} disabled={!!v.assessed} onClick={() => setDx(d)}>
              {RADIAL_LATE_DX_LABEL[d]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[12px] text-ink-soft">The plan</span>
        <div className="grid grid-cols-1 gap-1">
          {LATE_PLANS.map((p) => (
            <button key={p} className={`btn text-left leading-snug ${plan === p ? "border-accent text-accent" : ""}`} disabled={!!v.assessed} onClick={() => setPlan(p)}>
              {RADIAL_LATE_PLAN_LABEL[p]}
            </button>
          ))}
        </div>
      </div>
      <button className="btn btn-accent self-start" disabled={!dx || !plan || !!v.assessed || s.busy} onClick={() => dx && plan && act((x) => x.assessRadialLate(dx, plan))}>
        {v.assessed ? "Recorded" : "Record the assessment"}
      </button>
      {v.assessed && guided && <div className={`notice ${v.assessed.correct ? "notice-good" : "notice-warn"}`}>{v.assessed.correct ? "As the module teaches." : "Not as the module teaches: see the debrief."}</div>}
    </div>
  );
}
