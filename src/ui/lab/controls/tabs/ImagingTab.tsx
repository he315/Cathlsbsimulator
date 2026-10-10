import { MAX_SHUTTER } from "../../../../simulation/imaging/collimation";
import { rateText } from "../../useLab";
import type { ControlTab, ControlTabProps, FluoroLevel } from "../types";

// Imaging: field size, fluoroscopy and cine rates, fluoroscopy dose level, collimation and wedge, and
// the X-ray release at the console.

const LEVELS: readonly FluoroLevel[] = ["low", "normal", "high"];

function Imaging({ target, kit: { Seg } }: ControlTabProps) {
  const im = target.imagingControls();
  const hShut = im.shutters[0];
  const vShut = im.shutters[2];
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      <div className="space-y-1.5">
        <Seg label="Field (G)" value={im.field} options={im.fields} onChange={(f) => target.setFieldSize(f)} fmt={(f) => `${f} cm`} />
        <Seg label="Fluoro rate" value={im.pulseRate} options={im.rates} onChange={(r) => target.setFluoroRate(r)} fmt={(r) => `${rateText(r)} p/s`} />
        <Seg label="Cine rate" value={im.cineRate} options={im.rates} onChange={(r) => target.setCineRate(r)} fmt={(r) => `${rateText(r)} f/s`} />
        <Seg label="Fluoro dose" value={im.fluoroLevel} options={LEVELS} onChange={(l) => target.setFluoroLevel(l)} />
      </div>
      <div className="w-[240px] space-y-1.5">
        <label className="flex items-center gap-2 text-[12px] text-ink-faint">
          <span className="w-[86px]">Shutters, sides</span>
          <input type="range" min={0} max={MAX_SHUTTER} step={0.01} value={hShut} onChange={(e) => target.setShutters([Number(e.target.value), Number(e.target.value), vShut, vShut])} className="flex-1" aria-label="Side shutters" />
        </label>
        <label className="flex items-center gap-2 text-[12px] text-ink-faint">
          <span className="w-[86px]">Shutters, top and bottom</span>
          <input type="range" min={0} max={MAX_SHUTTER} step={0.01} value={vShut} onChange={(e) => target.setShutters([hShut, hShut, Number(e.target.value), Number(e.target.value)])} className="flex-1" aria-label="Top and bottom shutters" />
        </label>
        <label className="flex items-center gap-2 text-[12px] text-ink-faint">
          <span className="w-[86px]">Wedge in</span>
          <input type="range" min={0} max={0.6} step={0.01} value={im.wedge.insertion} onChange={(e) => target.setWedge({ ...im.wedge, insertion: Number(e.target.value) })} className="flex-1" aria-label="Wedge insertion" />
        </label>
        <label className="flex items-center gap-2 text-[12px] text-ink-faint">
          <span className="w-[86px]">Wedge angle</span>
          <input type="range" min={0} max={359} step={1} value={im.wedge.angleDeg} onChange={(e) => target.setWedge({ ...im.wedge, angleDeg: Number(e.target.value) })} className="flex-1" aria-label="Wedge angle" />
        </label>
      </div>
      <div className="space-y-1.5">
        <div>
          <button className={`btn h-8 px-2 text-[13px] ${im.xrayEnabled ? "" : "!text-warn"}`} onClick={() => target.toggleXray()} title="X-ray release at the console">
            {im.xrayEnabled ? "X-ray enabled" : "X-ray disabled"}
          </button>
        </div>
      </div>
    </div>
  );
}

export const tab: ControlTab = {
  id: "imaging",
  label: "Imaging",
  order: 20,
  labs: ["diagnostic", "pci"],
  Component: Imaging,
};
