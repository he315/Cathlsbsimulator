// The full case's orders, with the order sections registered in src/ui/access/orders/.
// (split from src/ui/access/panels.tsx by proc-foundation-scenarios-ledger; panels.tsx re-exports it).
import { useState } from "react";
import { useProcedureStore } from "../../../state/useProcedureStore";
import { SOURCED_DOSES, type OrderId } from "../../../simulation/session/caseSession";
import { ORDER_SECTIONS } from "../orders";
import { useSession } from "../panels";

const DOSED: { id: OrderId; label: string; unit: string }[] = [
  { id: "midazolam", label: "Midazolam IV", unit: "mg" },
  { id: "fentanyl", label: "Fentanyl IV", unit: "µg" },
  { id: "atropine", label: "Atropine IV", unit: "mg" },
  { id: "metaraminol", label: "Metaraminol IV", unit: "mg" },
  { id: "hydrocortisone", label: "Hydrocortisone IV", unit: "mg" },
  { id: "chlorphenamine", label: "Chlorphenamine IV", unit: "mg" },
  { id: "fluid", label: "Crystalloid IV", unit: "mL" },
];

export function OrdersPanel() {
  const s = useSession();
  const act = useProcedureStore((x) => x.act);
  const [drug, setDrug] = useState<OrderId>("midazolam");
  const [dose, setDose] = useState("");
  const kgU = Math.round((s.profile.weightKg * SOURCED_DOSES.radialHeparinUPerKg) / 100) * 100;
  const lastAct = s.acts[s.acts.length - 1];
  const radial = s.access !== "femoral";
  const o = (id: OrderId) => act((x) => x.order(id));
  return (
    <div className="panel p-3 flex flex-col gap-2">
      <div className="panel-head -mx-3 -mt-3 mb-1">
        <span>Orders</span>
        <span className="normal-case tracking-normal text-ink-faint text-[12px]">heparin {s.heparinU} U{lastAct ? ` · ACT ${lastAct.act} s` : ""}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button className="btn" disabled={s.local.given || s.busy} onClick={() => o("local")}>
          Local anaesthetic
        </button>
        <button className="btn" disabled={s.busy} onClick={() => act((x) => x.measureAct())}>
          Measure ACT
        </button>
        <button className="btn" disabled={s.busy} onClick={() => o("heparin-radial")}>
          Heparin {SOURCED_DOSES.radialHeparinU} U
        </button>
        <button className="btn" disabled={s.busy} onClick={() => o("heparin-weight")}>
          Heparin {kgU} U ({SOURCED_DOSES.radialHeparinUPerKg} U/kg)
        </button>
        {radial && (
          <>
            <button className="btn" disabled={!s.sheath || s.busy} onClick={() => o("verapamil")}>
              Verapamil {SOURCED_DOSES.verapamilMg} mg IA
            </button>
            <button className="btn" disabled={!s.sheath || s.busy} onClick={() => o("gtn")}>
              GTN {SOURCED_DOSES.gtnUg} µg IA
            </button>
            <button className="btn" disabled={!s.sheath || s.busy} onClick={() => o("verapamil-high")}>
              Verapamil {SOURCED_DOSES.verapamilHighMg} mg IA
            </button>
            <button className="btn" disabled={!s.sheath || s.busy} onClick={() => o("gtn-low")}>
              GTN {SOURCED_DOSES.gtnLowUg} µg IA
            </button>
          </>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <select className="field flex-1 min-w-0" value={drug} onChange={(e) => setDrug(e.target.value as OrderId)}>
          {DOSED.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
        <input className="field w-20" inputMode="decimal" placeholder={DOSED.find((d) => d.id === drug)!.unit} value={dose} onChange={(e) => setDose(e.target.value)} />
        <button
          className="btn"
          disabled={!(+dose > 0) || s.busy}
          onClick={() => {
            act((x) => x.order(drug, +dose));
            setDose("");
          }}
        >
          Give
        </button>
      </div>
      {ORDER_SECTIONS.filter((sec) => sec.applies?.(s) ?? true).map((sec) => (
        <section key={sec.id} className="border-t border-line pt-2 mt-1" aria-label={sec.title} data-section={sec.id}>
          <div className="text-[12px] text-ink-faint mb-1.5">{sec.title}</div>
          <sec.Component session={s} act={act} />
        </section>
      ))}
    </div>
  );
}
