// ---------------------------------------------------------------------------
// Robustness matrix for the scripted manoeuvres: runs every procedure in
// manoeuvres.ts on a given geometry (the frozen fixture or the live
// buildAnatomy()/thorax.aorticCourse, with or without the arch branches) and
// solver configuration, and reports success counts as JSON.
//
//   ROBUST=1 npx vite-node src/physics/robustness.ts -- [live|fixture] [scale] [hz] [arch] [only]
//
// e.g.  ROBUST=1 npx vite-node src/physics/robustness.ts -- live 1.4 120 arch
// The table in docs/realism/wave1/S7.md was produced with this script.
// ---------------------------------------------------------------------------

import * as S from "./scenarios";
import * as M from "./manoeuvres";
import { FRICTION } from "./catheterShapes";

export interface MatrixCell {
  geometry: "live" | "fixture";
  archBranches: boolean;
  segmentScale: number;
  substepHz: number;
}

export interface MatrixResult extends MatrixCell {
  seconds: number;
  jl4?: M.Jl4Result;
  size?: Record<string, number>;
  jr4?: M.Jr4Result;
  whip?: ReturnType<typeof M.overTorque>;
  prolapse?: ReturnType<typeof M.prolapse>;
  backup?: ReturnType<typeof M.guideBackup>;
  deepLm?: ReturnType<typeof M.deepSeat>;
  deepRca?: ReturnType<typeof M.deepSeat>;
  tiger?: ReturnType<typeof M.tigerLeft>;
  ebu?: M.Jl4Result;
  amplatz?: M.AmplatzResult;
  amplatz2?: M.AmplatzResult;
  /** 12-start engagement counts: JL5 and JL4 in the dilated root, JL4 and JL5 in the normal root */
  dilated12?: { jl5Dilated: number; jl4Normal: number; jl5Normal: number; jl4Dilated: number };
}

/** Apply a matrix cell to the scenario defaults (returns a function restoring the previous ones). */
export function useCell(c: MatrixCell): () => void {
  const prev = { ...S.scenarioDefaults, cfg: { ...S.scenarioDefaults.cfg } };
  S.scenarioDefaults.live = c.geometry === "live";
  S.scenarioDefaults.archBranches = c.archBranches;
  S.scenarioDefaults.cfg = { ...prev.cfg, segmentScale: c.segmentScale, substepHz: c.substepHz };
  return () => {
    S.scenarioDefaults.live = prev.live;
    S.scenarioDefaults.archBranches = prev.archBranches;
    S.scenarioDefaults.cfg = prev.cfg;
  };
}

export function runCell(c: MatrixCell, only?: string[]): MatrixResult {
  const restore = useCell(c);
  const t0 = Date.now();
  const want = (k: string) => !only || only.includes(k);
  const r: MatrixResult = { ...c, seconds: 0 };
  try {
    if (want("jl4")) r.jl4 = M.jl4Engagement();
    if (want("size")) {
      r.size = {};
      for (const root of ["small", "normal", "dilated"] as const) {
        for (const cath of ["JL3.5", "JL4", "JL5"]) r.size[`${cath} ${root}`] = M.jl4Engagement(cath, root).engaged;
      }
    }
    if (want("jr4")) r.jr4 = M.jr4Torque();
    if (want("whip")) r.whip = M.overTorque();
    if (want("prolapse")) r.prolapse = M.prolapse();
    if (want("backup")) r.backup = M.guideBackup();
    if (want("deep")) {
      r.deepLm = M.deepSeat("JL4", "lm");
      r.deepRca = M.deepSeat("JR4", "rca");
    }
    if (want("tiger")) r.tiger = M.tigerLeft();
    if (want("ebu")) r.ebu = M.jl4Engagement("EBU3.75");
    if (want("amplatz")) {
      r.amplatz = M.amplatzEngagement("AL1", "normal");
      r.amplatz2 = M.amplatzEngagement("AL2", "dilated");
    }
    if (want("dilated12")) {
      r.dilated12 = {
        jl5Dilated: M.jl4Engagement("JL5", "dilated", M.STARTS12).engaged,
        jl4Normal: M.jl4Engagement("JL4", "normal", M.STARTS12).engaged,
        jl5Normal: M.jl4Engagement("JL5", "normal", M.STARTS12).engaged,
        jl4Dilated: M.jl4Engagement("JL4", "dilated", M.STARTS12).engaged,
      };
    }
  } finally {
    restore();
  }
  r.seconds = (Date.now() - t0) / 1000;
  return r;
}

const proc = (globalThis as { process?: { argv?: string[]; env?: Record<string, string | undefined> } }).process;
if (proc?.env?.ROBUST === "1") {
  const args = (proc.argv ?? []).slice(2).filter((a) => a !== "--" && !/robustness\.ts$/.test(a));
  const cell: MatrixCell = {
    geometry: args[0] === "live" ? "live" : "fixture",
    segmentScale: Number(args[1] ?? 1),
    substepHz: Number(args[2] ?? 120),
    archBranches: args[3] === "arch",
  };
  const only = args[4] && args[4] !== "all" ? args[4].split(",") : undefined;
  // experiment overrides (sensitivity studies; the defaults are the calibrated values)
  if (proc.env.JL_WITHDRAW === "0") M.protocol.jlWithdraw = false;
  if (proc.env.JR_WITHDRAW !== undefined) M.protocol.jrWithdraw = Number(proc.env.JR_WITHDRAW);
  if (proc.env.WHIP_LOAD !== undefined) M.protocol.whipLoad = Number(proc.env.WHIP_LOAD);
  if (proc.env.AZ_TOL) M.protocol.azTolDeg = Number(proc.env.AZ_TOL);
  if (proc.env.JR_STEPS) M.protocol.jrSteps = Number(proc.env.JR_STEPS);
  if (proc.env.MU_CS) FRICTION.catheter.s = Number(proc.env.MU_CS);
  if (proc.env.MU_CK) FRICTION.catheter.k = Number(proc.env.MU_CK);
  if (proc.env.ITER) S.scenarioDefaults.cfg.iterations = Number(proc.env.ITER);
  if (proc.env.MAXMOVE) S.scenarioDefaults.cfg.maxMove = Number(proc.env.MAXMOVE);
  console.log(JSON.stringify(runCell(cell, only)));
}
