// IVUS and OCT bench, step 4: post-dilatation with the catalogue's non-compliant
// balloon, over the whole stent or the proximal half (POT), each inflation
// re-imaged (pci-bench-imaging-unify). pci-bench-stent-platforms-sizing: the
// limit shown is the deployed platform's labelled post-dilatation limit for its
// size (src/simulation/bench/platforms.ts), and the panel warns when the balloon
// at the chosen pressure reaches beyond it (the box's "do not dilate beyond",
// operator knowledge, not a finding); an aorto-ostial stent can be flared with a
// short balloon half in the aorta (cp-ostial-stent).
import { useState } from "react";
import { BALLOON_SPEC, balloonDiameter, balloonPressures, balloonSizes, maxStentDiameter, stentPlatform, type BenchLesion, type PostDil, type Stent } from "../../simulation/pciBench";
import { checkPostDilatation } from "../../simulation/bench/platforms";
import { BenchPicker } from "./ImagePanel";

export interface OptimisePanelProps {
  post: readonly PostDil[];
  /** the deployed stent's labelled dilatation limit (mm); superseded by the stent's platform when `stent` is given */
  stentLimitMm: number;
  onInflate: (p: PostDil) => void;
  onClear: () => void;
  finish: () => void;
  /** the deployed stent: its platform gives the limit and the label */
  stent?: Stent;
  /** the lesion: an aorto-ostial lesion offers the flaring inflation */
  lesion?: BenchLesion;
}

const WHERE_LABEL: Record<PostDil["where"], string> = { full: "whole stent", proximal: "proximal half", flare: "ostial flare" };

export default function OptimisePanel({ post, stentLimitMm, onInflate, onClear, finish, stent, lesion }: OptimisePanelProps) {
  const sizes = balloonSizes("non-compliant");
  const [d, setD] = useState(3.25);
  const [atm, setAtm] = useState(18);
  const [where, setWhere] = useState<PostDil["where"]>("full");
  const p = balloonPressures("non-compliant", d);
  const reached = balloonDiameter("non-compliant", d, atm);
  const platform = stent ? stentPlatform(stent) : null;
  const limitMm = stent ? maxStentDiameter(stent.diameter, stent.platformId ?? null) : stentLimitMm;
  const over = platform && stent ? checkPostDilatation(platform, stent.diameter, reached).over : reached > limitMm + 1e-6;
  const ostial = !!lesion?.ostial;
  const options: PostDil["where"][] = ostial ? ["full", "proximal", "flare"] : ["full", "proximal"];
  return (
    <div className="panel p-4 space-y-3 text-[13px]">
      <div className="stat-label">Post-dilatation ({BALLOON_SPEC["non-compliant"].label.toLowerCase()})</div>
      <BenchPicker label="Diameter (mm)" values={sizes} value={d} fmt={(v) => v.toFixed(2)} onChange={setD} />
      <div>
        <div className="flex justify-between text-ink-soft">
          <span>Pressure</span>
          <span className="font-mono">
            {atm} atm → {reached.toFixed(2)} mm · stent limit {limitMm.toFixed(2)} mm
          </span>
        </div>
        <input type="range" aria-label="Post-dilatation pressure (atm)" min={8} max={p.rbpAtm + 6} step={1} value={atm} onChange={(e) => setAtm(Number(e.target.value))} className="w-full" />
        <div className="text-[12px] text-ink-faint">
          Device chart: nominal {p.nominalAtm} atm, rated burst {p.rbpAtm} atm.
          {platform && stent ? ` ${platform.label}, ${stent.diameter.toFixed(2)} mm: do not dilate beyond ${limitMm.toFixed(2)} mm.` : ""}
        </div>
        {over && where !== "flare" && (
          <div className="text-[12px] text-warn" role="status">
            {reached.toFixed(2)} mm is beyond the stent&apos;s labelled post-dilatation limit of {limitMm.toFixed(2)} mm.
          </div>
        )}
      </div>
      <div className="seg" role="group" aria-label="Where">
        {options.map((w) => (
          <button key={w} type="button" className={`seg-btn ${where === w ? "seg-btn-active" : ""}`} onClick={() => setWhere(w)}>
            {w === "proximal" ? "proximal half (POT)" : w === "flare" ? "flare the ostium" : "whole stent"}
          </button>
        ))}
      </div>
      {where === "flare" && <div className="text-[12px] text-ink-faint">Balloon half in the aorta, half in the stent: flares the struts at the ostium.</div>}
      <div className="flex gap-2">
        <button type="button" className="btn" onClick={() => onInflate({ diameter: d, atm, where })}>
          Inflate
        </button>
        <button type="button" className="btn btn-accent" onClick={finish}>
          Final imaging →
        </button>
      </div>
      {post.length > 0 && (
        <div className="border-t border-line pt-2 text-[12px] text-ink-soft space-y-0.5">
          {post.map((x, i) => (
            <div key={i}>
              NC {x.diameter.toFixed(2)} mm at {x.atm} atm · {WHERE_LABEL[x.where]}
            </div>
          ))}
          <button type="button" className="btn btn-ghost !px-0 !text-[12px]" onClick={onClear}>
            clear
          </button>
        </div>
      )}
    </div>
  );
}
