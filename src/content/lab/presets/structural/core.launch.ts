// Launch metadata for the structural heart lab's core scenarios (structural-tips-and-tavi-course).
// Engine-free: types only. The scenario ids match TAVI_SCENARIOS (src/simulation/tavi.ts),
// TEER_SCENARIOS (src/simulation/teer.ts) and LAAO_SCENARIOS (src/simulation/laao.ts);
// src/ui/lab/structuralTips.scenario.test.ts checks both ways.
//
// A .launch.ts names one sim, and the structural lab is one section with three procedures, so every
// core scenario is declared here under "tavi". The lab resolves a scenario to its procedure whichever
// of its three sims a link names (resolveStructuralLaunch in src/ui/sections/StructuralLab.tsx), as
// the MCS lab does for its consoles. Runs are logged by the procedure that ran them (useLabRun with
// sim tavi, teer or laao), so the shared sim does not misfile a run.
//
// Starts name the step a case opens at (the step option of the launch): every scenario opens at its
// first step ("plan" for TAVI and TEER, "measure" for LAAO), and the coronary obstruction scenario
// opens at "assess" with its valve already released. A later step needs the earlier steps' choices,
// so no other start is offered. The titles are the scenarios' own, written so that the practice list
// does not give the diagnosis away.
//
// Every TAVI scenario practises the candidate, work-up and procedure lessons (its plan step shows the
// tips of hb-tavi-candidate and hb-tavi-workup, its later steps those of hb-tavi-procedure); the
// coronary, vascular and paravalvular lessons list the scenarios built for them.
import type { LaunchFile, LaunchStart } from "../../../schema";

const TAVI_LESSONS = ["hb-tavi-candidate", "hb-tavi-workup", "hb-tavi-procedure"];
const FROM_PLAN: LaunchStart[] = [{ id: "plan", title: "From the CT plan" }];
const FROM_TOE: LaunchStart[] = [{ id: "plan", title: "From the TOE plan" }];
const FROM_MEASURE: LaunchStart[] = [{ id: "measure", title: "From the TOE measurements" }];

export const launch: LaunchFile = {
  sim: "tavi",
  scenarios: [
    // TAVI
    { id: "tavi-standard", title: "Tricuspid AS, straightforward anatomy", lessonIds: [...TAVI_LESSONS, "hb-tavi-pvl-pulmonary"], starts: FROM_PLAN },
    { id: "tavi-small-annulus", title: "Small annulus, larger patient", lessonIds: [...TAVI_LESSONS], starts: FROM_PLAN },
    { id: "tavi-low-coronary", title: "Low left main, narrow sinuses", lessonIds: [...TAVI_LESSONS, "hb-tavi-coronary"], starts: FROM_PLAN },
    { id: "tavi-bicuspid-lvot", title: "Bicuspid valve with LVOT calcium", lessonIds: [...TAVI_LESSONS, "hb-tavi-pvl-pulmonary"], starts: FROM_PLAN },
    { id: "tavi-conduction", title: "Pre-existing RBBB, short membranous septum", lessonIds: [...TAVI_LESSONS], starts: FROM_PLAN },
    { id: "tavi-hostile-access", title: "Hostile iliofemoral access", lessonIds: [...TAVI_LESSONS, "hb-tavi-vascular-stroke", "cp-complex-patients-tavr-before"], starts: FROM_PLAN },
    {
      id: "tavi-coronary-obstruction",
      title: "Hypotension after valve deployment",
      lessonIds: [...TAVI_LESSONS, "hb-tavi-coronary"],
      starts: [{ id: "assess", title: "Valve just released" }],
    },
    // TEER
    { id: "teer-p2-flail", title: "Degenerative MR: P2 flail", lessonIds: ["hb-mitral-tricuspid-laa-teer-select", "hb-mitral-tricuspid-laa-teer-procedure", "hb-mitral-tricuspid-laa-ts-setup", "hb-mitral-tricuspid-laa-ts-cross"], caseIds: ["hb-mitral-tricuspid-laa-case-teer-flail"], starts: FROM_TOE },
    { id: "teer-fmr", title: "Secondary MR: tethered leaflets", lessonIds: ["hb-mitral-tricuspid-laa-teer-select", "hb-mitral-tricuspid-laa-teer-procedure"], starts: FROM_TOE },
    { id: "teer-commissural", title: "Medial commissural jet", lessonIds: ["hb-mitral-tricuspid-laa-teer-procedure"], starts: FROM_TOE },
    { id: "teer-small-mva", title: "Small baseline mitral valve area", lessonIds: ["hb-mitral-tricuspid-laa-teer-select"], starts: FROM_TOE },
    // LAAO
    { id: "laao-windsock", title: "Windsock appendage", lessonIds: ["hb-mitral-tricuspid-laa-laao-plan", "hb-mitral-tricuspid-laa-laao-implant"], starts: FROM_MEASURE },
    { id: "laao-chicken-wing", title: "Chicken wing with an early bend", lessonIds: ["hb-mitral-tricuspid-laa-laao-plan", "hb-mitral-tricuspid-laa-laao-implant"], caseIds: ["hb-mitral-tricuspid-laa-case-laao-reverse-wing"], starts: FROM_MEASURE },
    { id: "laao-cactus", title: "Cactus appendage", lessonIds: ["hb-mitral-tricuspid-laa-laao-plan"], starts: FROM_MEASURE },
    { id: "laao-cauliflower", title: "Cauliflower appendage", lessonIds: ["hb-mitral-tricuspid-laa-laao-plan", "hb-mitral-tricuspid-laa-laao-implant"], starts: FROM_MEASURE },
  ],
};
