import { analyse } from "./period.mjs";
import fs from "node:fs";
const labs = { RCA: ["cd-01032-RCA-5", "cd-01030-RCA-5", "cd-01046-RCA-6", "cd-01053-RCA-5"], LAD: ["cdm-00884-LCA-3", "cdm-00909-LCA-2", "cdm-00956-LCA-4", "cd-01033-LCA-3", "cd-01051-LCA-5"] };
const res = {};
for (const [k, ids] of Object.entries(labs)) {
  res[k] = [];
  for (const id of ids) {
    const set = id.startsWith("cdm") ? "dominance-main" : "dominance";
    const a = analyse(`tracks/${set}__${id}.json`);
    if (!a) { console.log(id, "none"); continue; }
    console.log(k, id, "hr", a.hr, "period", a.periodFrames, "ac", a.acPeak, a.lms.map((l) => `#${l.k}:${l.beatP2P}/${l.quiet}`).join(" "));
    res[k].push(a);
  }
}
fs.writeFileSync("motion_trace.json", JSON.stringify(res));
