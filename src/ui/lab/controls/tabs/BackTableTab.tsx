import type { ControlTab, ControlTabProps } from "../types";

// The back table: the catheters waiting there (exchange over the wire), and,
// where the lab offers it (the 'suction' capability; the diagnostic lab,
// diag-pressure-transducer), the sheath's side arm aspirated and the catheter
// removed under continuous suction, a fresh one of the same type brought in
// over the wire. What comes back shows on the gauze on the table strip.

/** What the Back table tab asks of the lab for the sheath and a catheter that will not aspirate. */
export interface SuctionControls {
  /** aspirate the sheath's side arm (what comes back goes onto the gauze) */
  aspirateSheath(): unknown;
  /** remove the catheter under continuous suction and bring in a fresh one of the same type over the wire */
  removeUnderSuction(): void;
}

declare module "../types" {
  interface LabCapabilities {
    /** the sheath's side arm and removal of the catheter under suction (the diagnostic lab) */
    suction: SuctionControls;
  }
}

function BackTable({ target }: ControlTabProps) {
  const bt = target.backTable();
  const suction = target.capability("suction");
  return (
    <div className="space-y-1.5">
      <div className="text-[12px] text-ink-faint">Catheters on the back table (exchange over the wire)</div>
      <div className="flex flex-wrap gap-1">
        {bt.items.map((c) => (
          <button key={c.id} className={`btn h-7 px-2 text-[12px] ${c.id === bt.selectedId ? "!border-accent !text-ink" : ""}`} aria-pressed={c.id === bt.selectedId} onClick={() => target.selectBackTableItem(c.id)}>
            {c.name}
          </button>
        ))}
      </div>
      {bt.note && <div className="text-[12px] text-ink-faint">{bt.note}</div>}
      {suction && (
        <div className="space-y-1 border-t border-line pt-1.5" data-suction>
          <div className="text-[12px] text-ink-faint">Sheath and catheter (what comes back shows on the gauze)</div>
          <div className="flex flex-wrap gap-1">
            <button className="btn h-7 px-2 text-[12px]" onClick={() => suction.aspirateSheath()} title="Draw back on the sheath's side arm">
              Aspirate side arm
            </button>
            <button
              className="btn h-7 px-2 text-[12px]"
              disabled={!bt.selectedId}
              onClick={() => suction.removeUnderSuction()}
              title="Withdraw the catheter under continuous suction, then load a fresh one of the same type over the wire"
            >
              Remove under suction
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const tab: ControlTab = {
  id: "table",
  label: "Back table",
  order: 30,
  labs: ["diagnostic"],
  Component: BackTable,
};
