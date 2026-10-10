// The full case's radial orders (access-radial-sequence): an order section (src/ui/access/orders/index.ts)
// for a radial site. It is what the operator asks for around a radial puncture, in the lessons' order
// (pm-access-radial-puncture steps 4-5, pm-access-radial-sheath steps 9-10): the local anaesthetic at the
// wrist as a volume, injected after aspirating or not; nitroglycerin for spasm before the sheath (under the
// tongue, under the skin, or around the artery mixed with lidocaine: the module text gives no dose, so none
// is shown); once the sheath is in, the side arm aspirated, Oxford's cocktail into the artery, and the
// sheath secured. Verapamil, nitroglycerin, heparin and sedation are the standing orders above it. Nothing
// here says whether an order was right or what the artery is doing: that is the ledger's, in the debrief.
// Names are generic; the cocktail's doses are the module text's (MP_RADIAL_SEQUENCE.cocktail).
import { useState } from "react";
import type { CaseSection, CaseSectionProps } from "./index";
import { MP_RADIAL_SEQUENCE, NITRATE_ROUTES, SHEATH_SECURES } from "../../../simulation/session/caseSession";

function RadialSection({ session, act }: CaseSectionProps) {
  const [ml, setMl] = useState("");
  const s = session;
  const rs = s.radialSeq;
  const sheath = s.sheath;
  const busy = s.busy;
  const given = rs.localGiven.filter((l) => !l.byTeam);
  const totalMl = Math.round(given.reduce((a, l) => a + l.ml, 0) * 10) / 10;
  const team = rs.localGiven.filter((l) => l.byTeam);
  const c = MP_RADIAL_SEQUENCE.cocktail;
  const vol = +ml;
  const inject = (aspirate: boolean) => {
    act((x) => x.giveLocal(vol, { aspirate }));
    setMl("");
  };
  return (
    <div className="flex flex-col gap-3" data-radial-orders>
      {!sheath && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[12px] font-medium text-ink-soft">Local anaesthetic at the wrist</div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] text-ink-soft">Lidocaine 1%</span>
            <input className="field w-20" inputMode="decimal" placeholder="mL" value={ml} onChange={(e) => setMl(e.target.value)} aria-label="Local anaesthetic volume, mL" />
            <button className="btn" disabled={!(vol > 0) || busy} onClick={() => inject(true)} data-radial-local="aspirate">
              Aspirate, then inject
            </button>
            <button className="btn" disabled={!(vol > 0) || busy} onClick={() => inject(false)} data-radial-local="inject">
              Inject
            </button>
          </div>
          {(given.length > 0 || team.length > 0) && (
            <div className="text-[12px] text-ink-faint">
              {given.length > 0 ? `Given at the wrist: ${totalMl} mL` : ""}
              {team.length > 0 ? `${given.length ? "; " : ""}by the team: ${team.map((l) => `${l.ml} mL`).join(", ")}` : ""}
            </div>
          )}
        </div>
      )}

      {!sheath && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[12px] font-medium text-ink-soft">Nitroglycerin before the sheath</div>
          <div className="grid grid-cols-1 gap-1.5">
            {NITRATE_ROUTES.map((r) => (
              <button key={r.id} className="btn text-left leading-snug" disabled={busy} onClick={() => act((x) => x.giveNitrate(r.id))} data-radial-nitrate={r.id}>
                {r.label} (local protocol dose)
              </button>
            ))}
          </div>
          {rs.nitrates.length > 0 && <div className="text-[12px] text-ink-faint">Given {rs.nitrates.length} time{rs.nitrates.length === 1 ? "" : "s"}.</div>}
        </div>
      )}

      {sheath && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[12px] font-medium text-ink-soft">Through the side arm</div>
          <div className="grid grid-cols-1 gap-1.5">
            <button className="btn text-left leading-snug" disabled={busy} onClick={() => act((x) => x.aspirateSheath())} data-radial-aspirate>
              Aspirate 3-4 mL and discard
            </button>
            <button className="btn text-left leading-snug" disabled={busy} onClick={() => act((x) => x.order("radial-cocktail"))} data-radial-cocktail>
              Cocktail into the artery: heparin {c.heparinU} IU, verapamil {c.verapamilMg} mg, nitroglycerin {c.gtnUg} µg
            </button>
          </div>
        </div>
      )}

      {sheath && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[12px] font-medium text-ink-soft">Secure the sheath</div>
          <div className="grid grid-cols-2 gap-1.5">
            {SHEATH_SECURES.map((m) => (
              <button key={m.id} className={`btn text-left leading-snug ${rs.secured === m.id ? "btn-accent" : ""}`} disabled={busy} onClick={() => act((x) => x.secureSheath(m.id))} data-radial-secure={m.id}>
                {m.label}
              </button>
            ))}
          </div>
          {rs.secured && <div className="text-[12px] text-ink-faint">Secured.</div>}
        </div>
      )}
    </div>
  );
}

export const section: CaseSection = {
  id: "radial-access",
  title: "Radial access",
  order: 15,
  applies: (s) => s.activeSite.siteKind === "radial" && !s.siteClosed(s.activeSite),
  Component: RadialSection,
};
