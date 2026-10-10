import { useState, type ReactNode } from "react";
import {
  assumedVO2,
  bsaDuBois,
  bsaMosteller,
  cardiacPower,
  egfrCkdEpi2021,
  fickCO,
  flammMixedVenous,
  gorlinAVA,
  gorlinMVA,
  hakki,
  maxContrastCigarroa,
  meanPressure,
  mehranBand,
  mehranScore,
  papi,
  pvrWU,
  qpQs,
  svrWU,
  WU_TO_DYN,
} from "../../simulation/calc";
import SectionShell from "../SectionShell";

function Num({ label, value, onChange, unit, step = 1 }: { label: string; value: number; onChange: (v: number) => void; unit?: string; step?: number }) {
  return (
    <label className="flex items-center justify-between gap-2 text-[13px]">
      <span className="text-ink-soft">{label}</span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          value={Number.isFinite(value) ? value : ""}
          step={step}
          onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
          className="w-20 bg-base-800 border border-line rounded px-1.5 py-0.5 text-right font-mono text-ink"
        />
        {unit && <span className="text-ink-faint w-14 text-[12px]">{unit}</span>}
      </span>
    </label>
  );
}

function Out({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "good" | "warn" | "danger" }) {
  const col = tone === "good" ? "text-good" : tone === "warn" ? "text-warn" : tone === "danger" ? "text-danger" : "text-ink";
  return (
    <div className="flex items-baseline justify-between gap-2 border-t border-line/60 pt-1.5">
      <span className="text-[13px] text-ink-soft">{label}</span>
      <span className="text-right">
        <span className={`font-mono text-[15px] ${col}`}>{value}</span>
        {note && <div className="text-[10.5px] text-ink-faint">{note}</div>}
      </span>
    </div>
  );
}

function Card({ title, formula, children }: { title: string; formula?: string; children: ReactNode }) {
  return (
    <div className="panel p-4 space-y-2">
      <div className="text-[14px] font-semibold text-ink">{title}</div>
      {formula && <div className="font-mono text-[12px] text-ink-faint">{formula}</div>}
      {children}
    </div>
  );
}

const fx = (x: number, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "—");

export default function Calculators() {
  // shared patient size
  const [h, setH] = useState(175);
  const [w, setW] = useState(80);
  const bsa = bsaDuBois(h, w);

  // Fick
  const [hb, setHb] = useState(13.5);
  const [sao2, setSao2] = useState(97);
  const [svo2, setSvo2] = useState(68);
  const [vo2, setVo2] = useState(NaN);
  const vo2Used = Number.isFinite(vo2) ? vo2 : assumedVO2(bsa);
  const co = fickCO(vo2Used, hb, sao2 / 100, svo2 / 100);

  // resistances
  const [sys, setSys] = useState(110);
  const [dia, setDia] = useState(65);
  const [rap, setRap] = useState(8);
  const [pas, setPas] = useState(40);
  const [pad, setPad] = useState(18);
  const [pawp, setPawp] = useState(16);
  const [coR, setCoR] = useState(4.5);
  const map = meanPressure(sys, dia);
  const mpap = meanPressure(pas, pad);

  // shunt
  const [svc, setSvc] = useState(70);
  const [ivc, setIvc] = useState(76);
  const [paSat, setPaSat] = useState(86);
  const [aoSat, setAoSat] = useState(97);
  const [pvSat, setPvSat] = useState(98);
  const mv = flammMixedVenous(svc / 100, ivc / 100);
  const qq = qpQs(aoSat / 100, mv, pvSat / 100, paSat / 100);

  // valves
  const [coV, setCoV] = useState(4.8);
  const [hr, setHr] = useState(72);
  const [sep, setSep] = useState(0.32);
  const [grad, setGrad] = useState(45);
  const [dfp, setDfp] = useState(0.4);
  const [mgrad, setMgrad] = useState(10);

  // renal
  const [creat, setCreat] = useState(110);
  const [age, setAge] = useState(72);
  const [female, setFemale] = useState(false);
  const [contrast, setContrast] = useState(150);
  const egfr = egfrCkdEpi2021(creat, age, female);
  const macd = maxContrastCigarroa(w, creat);
  const [mh, setMh] = useState({ hypotension: false, iabp: false, heartFailure: false, anaemia: false, diabetes: true });
  const ms = mehranScore({ ...mh, age, contrastMl: contrast, egfr });
  const band = mehranBand(ms);

  return (
    <SectionShell title="Calculators" subtitle="Cath lab formulas with the working shown. Check every result against the clinical picture.">
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card title="Body surface area" formula="DuBois: 0.007184 × W^0.425 × H^0.725 · Mosteller: √(H × W / 3600)">
          <Num label="Height" value={h} onChange={setH} unit="cm" />
          <Num label="Weight" value={w} onChange={setW} unit="kg" />
          <Out label="BSA (DuBois)" value={`${fx(bsa, 2)} m²`} />
          <Out label="BSA (Mosteller)" value={`${fx(bsaMosteller(h, w), 2)} m²`} />
        </Card>

        <Card title="Fick cardiac output" formula="CO = VO₂ ÷ [13.6 × Hb × (SaO₂ − SvO₂)]">
          <Num label="Haemoglobin" value={hb} onChange={setHb} unit="g/dL" step={0.1} />
          <Num label="Arterial saturation" value={sao2} onChange={setSao2} unit="%" />
          <Num label="Mixed venous (PA) saturation" value={svo2} onChange={setSvo2} unit="%" />
          <Num label="Measured VO₂ (blank = assumed)" value={vo2} onChange={setVo2} unit="mL/min" />
          <Out label="VO₂ used" value={`${fx(vo2Used, 0)} mL/min`} note={Number.isFinite(vo2) ? "measured" : "assumed 125 mL/min/m²: a common source of error"} />
          <Out label="Cardiac output" value={`${fx(co, 2)} L/min`} />
          <Out label="Cardiac index" value={`${fx(co / bsa, 2)} L/min/m²`} tone={co / bsa < 2.2 ? "danger" : "good"} note="< 2.2 is low (SCAI stage C marker)" />
        </Card>

        <Card title="Resistances and gradients" formula="SVR = (MAP − RAP)/CO · PVR = (mPAP − PAWP)/CO · ×80 for dyn·s·cm⁻⁵">
          <Num label="Systolic" value={sys} onChange={setSys} unit="mmHg" />
          <Num label="Diastolic" value={dia} onChange={setDia} unit="mmHg" />
          <Num label="RA mean" value={rap} onChange={setRap} unit="mmHg" />
          <Num label="PA systolic" value={pas} onChange={setPas} unit="mmHg" />
          <Num label="PA diastolic" value={pad} onChange={setPad} unit="mmHg" />
          <Num label="Wedge (PAWP)" value={pawp} onChange={setPawp} unit="mmHg" />
          <Num label="Cardiac output" value={coR} onChange={setCoR} unit="L/min" step={0.1} />
          <Out label="MAP · mPAP" value={`${fx(map, 0)} · ${fx(mpap, 0)} mmHg`} note="(sys + 2 × dia) / 3 approximation" />
          <Out label="SVR" value={`${fx(svrWU(map, rap, coR))} WU · ${fx(svrWU(map, rap, coR) * WU_TO_DYN, 0)} dyn`} />
          <Out label="PVR" value={`${fx(pvrWU(mpap, pawp, coR), 2)} WU`} tone={pvrWU(mpap, pawp, coR) > 2 ? "warn" : "good"} note="> 2 WU abnormal (ESC/ERS 2022)" />
          <Out label="TPG · DPG" value={`${fx(mpap - pawp, 0)} · ${fx(pad - pawp, 0)} mmHg`} />
          <Out label="PAPi" value={fx(papi(pas, pad, rap), 2)} tone={papi(pas, pad, rap) < 0.9 ? "danger" : undefined} note="(PASP − PADP) / RAP; low values suggest RV failure" />
          <Out label="RA / PAWP" value={fx(rap / pawp, 2)} />
          <Out label="Cardiac power output" value={`${fx(cardiacPower(map, coR), 2)} W`} tone={cardiacPower(map, coR) < 0.6 ? "danger" : "good"} note="< 0.6 W commonly used (Fincke's SHOCK cut-off was 0.53 W)" />
        </Card>

        <Card title="Shunt: Qp : Qs" formula="Qp:Qs = (SaO₂ − MvO₂) / (PvO₂ − PaO₂) · Flamm MvO₂ = (3 × SVC + IVC) / 4">
          <Num label="SVC" value={svc} onChange={setSvc} unit="%" />
          <Num label="IVC" value={ivc} onChange={setIvc} unit="%" />
          <Num label="Pulmonary artery" value={paSat} onChange={setPaSat} unit="%" />
          <Num label="Systemic arterial" value={aoSat} onChange={setAoSat} unit="%" />
          <Num label="Pulmonary vein (or arterial)" value={pvSat} onChange={setPvSat} unit="%" />
          <Out label="Mixed venous (Flamm)" value={`${fx(mv * 100, 1)}%`} note="use when the shunt is at atrial level" />
          <Out label="Qp : Qs" value={fx(qq, 2)} tone={qq >= 1.5 ? "warn" : undefined} note="≥ 1.5 usually considered significant" />
        </Card>

        <Card title="Valve areas" formula="Gorlin AVA = CO×1000 / (HR × SEP × 44.3 × √mean) · MVA uses DFP and 37.7 · Hakki ≈ CO / √gradient">
          <Num label="Cardiac output" value={coV} onChange={setCoV} unit="L/min" step={0.1} />
          <Num label="Heart rate" value={hr} onChange={setHr} unit="/min" />
          <Num label="Systolic ejection period" value={sep} onChange={setSep} unit="s/beat" step={0.01} />
          <Num label="Mean aortic gradient" value={grad} onChange={setGrad} unit="mmHg" />
          <Num label="Diastolic filling period" value={dfp} onChange={setDfp} unit="s/beat" step={0.01} />
          <Num label="Mean mitral gradient" value={mgrad} onChange={setMgrad} unit="mmHg" />
          <Out label="Aortic valve area (Gorlin)" value={`${fx(gorlinAVA(coV, hr, sep, grad), 2)} cm²`} tone={gorlinAVA(coV, hr, sep, grad) < 1 ? "danger" : undefined} />
          <Out label="Aortic valve area (Hakki)" value={`${fx(hakki(coV, grad), 2)} cm²`} />
          <Out label="Mitral valve area (Gorlin)" value={`${fx(gorlinMVA(coV, hr, dfp, mgrad), 2)} cm²`} note="invalid with significant regurgitation" />
        </Card>

        <Card title="Kidney function and contrast" formula="eGFR CKD-EPI 2021 (race-free) · Cigarroa limit = 5 mL × kg ÷ creatinine (mg/dL), max 300 mL">
          <Num label="Creatinine" value={creat} onChange={setCreat} unit="µmol/L" />
          <Num label="Age" value={age} onChange={setAge} unit="years" />
          <Num label="Weight" value={w} onChange={setW} unit="kg" />
          <label className="flex items-center gap-2 text-[13px] text-ink-soft">
            <input type="checkbox" checked={female} onChange={(e) => setFemale(e.target.checked)} /> female
          </label>
          <Num label="Planned contrast" value={contrast} onChange={setContrast} unit="mL" />
          <Out label="eGFR" value={`${fx(egfr, 0)} mL/min/1.73 m²`} tone={egfr < 30 ? "danger" : egfr < 60 ? "warn" : "good"} />
          <Out label="Maximum contrast (Cigarroa)" value={`${fx(macd, 0)} mL`} />
          <Out label="Contrast ÷ eGFR" value={fx(contrast / egfr, 1)} tone={contrast / egfr > 3 ? "danger" : contrast / egfr > 2 ? "warn" : "good"} note="lower is safer; ratios above about 2–3 are associated with more kidney injury" />
        </Card>

        <Card title="Mehran contrast nephropathy risk" formula="Hypotension 5 · IABP 5 · heart failure 5 · age > 75 4 · anaemia 3 · diabetes 3 · 1 per 100 mL contrast · eGFR 40–60: 2, 20–40: 4, < 20: 6">
          {(
            [
              ["hypotension", "Hypotension"],
              ["iabp", "IABP"],
              ["heartFailure", "Heart failure"],
              ["anaemia", "Anaemia"],
              ["diabetes", "Diabetes"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-[13px] text-ink-soft">
              <input type="checkbox" checked={mh[k]} onChange={(e) => setMh((m) => ({ ...m, [k]: e.target.checked }))} /> {label}
            </label>
          ))}
          <div className="text-[12px] text-ink-faint">Age, contrast volume and eGFR come from the kidney card.</div>
          <Out label="Score" value={`${ms}`} />
          <Out label="Risk band (Mehran 2004)" value={band.band} note={`contrast nephropathy ${band.cin} · dialysis ${band.dialysis} in the derivation cohort`} tone={ms > 10 ? "danger" : ms > 5 ? "warn" : "good"} />
        </Card>
      </div>
    </SectionShell>
  );
}
