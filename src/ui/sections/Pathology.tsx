import { useUiStore } from "../../state/useUiStore";
import { CASE_LIBRARY } from "../../simulation/caseGenerator";
import type { PathologyKind } from "../../types";
import SectionShell from "../SectionShell";

interface PathInfo {
  kind: PathologyKind;
  label: string;
  vessel: string;
  view: string;
  teach: string;
  severity: "low" | "moderate" | "high";
}

const PATHOLOGIES: PathInfo[] = [
  {
    kind: "mild-irregularity",
    label: "Mild luminal irregularity",
    vessel: "LAD / RCA",
    view: "Standard set",
    severity: "low",
    teach: "Minor wall irregularity (<40%). Non-obstructive, but note it — it is early disease and changes the report.",
  },
  {
    kind: "moderate-stenosis",
    label: "Moderate stenosis",
    vessel: "LAD",
    view: "RAO / LAO cranial",
    severity: "moderate",
    teach: "A 50–70% narrowing. Often needs an orthogonal second view before calling it significant — one projection can over- or under-call it.",
  },
  {
    kind: "severe-stenosis",
    label: "Severe stenosis",
    vessel: "LAD / LCx / RCA",
    view: "Two orthogonal views",
    severity: "high",
    teach: "A >70% narrowing is flow-limiting. Confirm in two non-foreshortened projections and grade at its tightest point.",
  },
  {
    kind: "critical-lad",
    label: "Critical proximal LAD",
    vessel: "Proximal LAD",
    view: "AP cranial / LAO cranial",
    severity: "high",
    teach: "A tight proximal LAD threatens a large territory. Choose views that elongate the proximal LAD and separate it from the diagonals; avoid deep engagement.",
  },
  {
    kind: "left-main",
    label: "Left main disease",
    vessel: "Left main",
    view: "Spider (LAO caudal)",
    severity: "high",
    teach: "The highest-stakes lesion. Engage gently, keep the pressure clean, and never deep-seat — a damped left main can be catastrophic. The spider view shows the distal LM and bifurcation.",
  },
  {
    kind: "ostial-rca",
    label: "Ostial RCA disease",
    vessel: "RCA ostium",
    view: "LAO",
    severity: "high",
    teach: "Ostial narrowing damps easily on engagement. Use gentle, non-deep contact and read the pressure — a catheter-induced damping mimics disease.",
  },
  {
    kind: "mid-rca",
    label: "Mid RCA stenosis",
    vessel: "Mid RCA",
    view: "RAO",
    severity: "moderate",
    teach: "The mid RCA is elongated in the RAO projection — the best view to measure lesion length.",
  },
  {
    kind: "lcx-om",
    label: "Circumflex / OM disease",
    vessel: "LCx, OM1",
    view: "RAO caudal",
    severity: "moderate",
    teach: "The circumflex and its obtuse marginals overlap in most views. RAO caudal spreads them out for grading.",
  },
  {
    kind: "diffuse",
    label: "Diffuse disease",
    vessel: "Multiple",
    view: "Full set",
    severity: "high",
    teach: "Disease throughout the tree with no single focal lesion. Requires a complete, well-opacified study to characterise.",
  },
];

const SEV_TONE: Record<PathInfo["severity"], string> = {
  low: "text-good",
  moderate: "text-warn",
  high: "text-danger",
};

export default function Pathology() {
  const launch = useUiStore((s) => s.launch);

  const caseForPathology = (kind: PathologyKind) =>
    CASE_LIBRARY.filter((c) => c.pathology === kind);

  return (
    <SectionShell
      title="Pathology recognition"
      subtitle="Recognise the lesion, then choose the projection that proves it. Launch a case to practise each pattern."
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {PATHOLOGIES.map((p) => {
          const cases = caseForPathology(p.kind);
          return (
            <div key={p.kind} className="panel p-4 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-ink">{p.label}</span>
                <span className={`chip ${SEV_TONE[p.severity]}`}>{p.severity}</span>
              </div>
              <div className="text-[12px] text-ink-faint mb-2">
                {p.vessel} · best view: <span className="text-ink-soft">{p.view}</span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed flex-1">{p.teach}</p>
              <button
                className="btn mt-3 self-start"
                disabled={cases.length === 0}
                onClick={() => cases.length && launch(cases[0], "case")}
              >
                {cases.length ? "Practise this case" : "No library case"}
              </button>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
