import { CARM_PARAMS } from "../../../../simulation/imaging/carm";
import { angleText } from "../../useLab";
import type { ControlTab, ControlTabProps } from "../types";

// C-arm and table: the angulation joystick and its memories (driven while held), the table top and its
// height. Every hold-to-run control stops when released, as on a real table (dead-man).

function CArmAndTable({ target, kit: { Hold } }: ControlTabProps) {
  const v = CARM_PARAMS.maxSpeed;
  const cArm = target.cArmAngles();
  const tableHeight = target.tableHeightMm();
  const jog = (a: number, b: number) => () => target.jogCArm(a, b);
  const stopJog = () => target.jogCArm(0, 0);
  const tbl = (x: number, y: number) => () => target.table.setCommandedVelocity(x, y);
  const stopTbl = () => target.table.setCommandedVelocity(0, 0);
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      <div className="space-y-1">
        <div className="text-[12px] text-ink-faint">Angulation (arrows)</div>
        <div className="grid grid-cols-3 gap-1">
          <span />
          <Hold onStart={jog(0, v)} onStop={stopJog}>
            CRA
          </Hold>
          <span />
          <Hold onStart={jog(-v, 0)} onStop={stopJog}>
            RAO
          </Hold>
          <div className="flex items-center justify-center font-mono text-[12px] text-ink-soft">{angleText(cArm).replace("  ", "\n")}</div>
          <Hold onStart={jog(v, 0)} onStop={stopJog}>
            LAO
          </Hold>
          <span />
          <Hold onStart={jog(0, -v)} onStop={stopJog}>
            CAU
          </Hold>
          <span />
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-[12px] text-ink-faint">Memories (hold to drive; keys 6 to 9 for 1 to 4)</div>
        <div className="grid grid-cols-4 gap-1">
          {target.memories.map((m, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <Hold onStart={() => target.driveMemory(i)} onStop={() => target.driveMemory(null)} disabled={!m} title={m ? angleText(m) : "Empty"} className="!h-7 font-mono !text-[12px]">
                {i + 1}
              </Hold>
              <span className="truncate text-center font-mono text-[12px] text-ink-faint">{m ? angleText(m).replace(/ +/g, " ").replace("LAO ", "L").replace("RAO ", "R").replace("CRA ", "+").replace("CAU ", "-") : "empty"}</span>
              <button className="btn btn-ghost !h-6 !px-1 text-[12px]" onClick={() => target.storeMemory(i)} title="Store the present position in this memory">
                Store
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-[12px] text-ink-faint">Table (Shift and arrows; X centres)</div>
        <div className="grid grid-cols-3 gap-1">
          <span />
          <Hold onStart={tbl(0, 40)} onStop={stopTbl}>
            Head
          </Hold>
          <span />
          <Hold onStart={tbl(-40, 0)} onStop={stopTbl}>
            Right
          </Hold>
          <button className="btn h-8 px-2 text-[13px]" onClick={() => target.table.set({ x: 0, y: 0 })}>
            Centre
          </button>
          <Hold onStart={tbl(40, 0)} onStop={stopTbl}>
            Left
          </Hold>
          <span />
          <Hold onStart={tbl(0, -40)} onStop={stopTbl}>
            Feet
          </Hold>
          <span />
        </div>
        <div className="flex items-center gap-1">
          <Hold onStart={() => target.table.setHeightCommand(1)} onStop={() => target.table.setHeightCommand(0)}>
            Up
          </Hold>
          <Hold onStart={() => target.table.setHeightCommand(-1)} onStop={() => target.table.setHeightCommand(0)}>
            Down
          </Hold>
          <span className="font-mono text-[12px] text-ink-faint">height {tableHeight >= 0 ? "+" : ""}{Math.round(tableHeight)} mm</span>
        </div>
      </div>
    </div>
  );
}

export const tab: ControlTab = {
  id: "carm",
  label: "C-arm and table",
  order: 10,
  labs: ["diagnostic", "pci"],
  Component: CArmAndTable,
};
