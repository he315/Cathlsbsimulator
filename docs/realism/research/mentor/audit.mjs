import { TRACKS, PUBLISHED_CASES, ALL_CASES } from "./content.mjs";
import * as R from "./refs.mjs";
const refs = Object.values(R).find(v => Array.isArray(v) && v[0]?.citation) || Object.values(R).find(v=>v && typeof v==='object' && !Array.isArray(v) && Object.values(v)[0]?.citation);
const refList = Array.isArray(refs) ? refs : Object.values(refs||{});
let tot = {mod:0,les:0,quiz:0,cases:0,minutes:0,simBlocks:0,figBlocks:0,modSims:0,diff:{1:0,2:0,3:0},stage:{}};
const rows=[];
const blockKinds={};
for (const t of TRACKS) {
  let les=0,quiz=0,min=0,simB=0,figB=0,modS=0; const diff={1:0,2:0,3:0};
  for (const m of t.modules) {
    tot.stage[m.stage]=(tot.stage[m.stage]||0)+1;
    les+=m.lessons.length; quiz+=m.quiz.length; modS+=(m.sims||[]).length;
    for (const l of m.lessons){ min+=l.minutes; for(const b of l.blocks){ blockKinds[b.kind]=(blockKinds[b.kind]||0)+1; if(b.kind==='sim')simB++; if(b.kind==='figure')figB++; } }
    for (const q of m.quiz) diff[q.difficulty]++;
  }
  rows.push({track:t.id,stage:t.stage,modules:t.modules.length,lessons:les,quiz:quiz,cases:t.cases.length,readMin:min,simBlocks:simB,figBlocks:figB,moduleSims:modS,d1:diff[1],d2:diff[2],d3:diff[3]});
  tot.mod+=t.modules.length; tot.les+=les; tot.quiz+=quiz; tot.cases+=t.cases.length; tot.minutes+=min; tot.simBlocks+=simB; tot.figBlocks+=figB; tot.modSims+=modS; for(const k of [1,2,3]) tot.diff[k]+=diff[k];
}
console.table(rows);
console.log("totals", tot, "published cases", PUBLISHED_CASES.length, "all cases", ALL_CASES.length);
console.log("block kinds", blockKinds);
// quiz stems referencing images? 
const allQ = TRACKS.flatMap(t=>t.modules.flatMap(m=>m.quiz));
const imgWords = /(image|angiogram shown|this run|picture|figure|cine)/i;
console.log("quiz items", allQ.length, "with image-like stem words", allQ.filter(q=>imgWords.test(q.stem)).length);
console.log("quiz option count dist", allQ.reduce((a,q)=>{a[q.options.length]=(a[q.options.length]||0)+1;return a},{}));
console.log("answer index dist", allQ.reduce((a,q)=>{a[q.answer]=(a[q.answer]||0)+1;return a},{}));
// longest-option-is-correct bias
let longest=0; for(const q of allQ){ const L=q.options.map(o=>o.length); const mx=Math.max(...L); if(L[q.answer]===mx && L.filter(x=>x===mx).length===1) longest++; }
console.log("correct option is uniquely longest:", longest, "of", allQ.length, (100*longest/allQ.length).toFixed(1)+"%");
// cases
const cs = ALL_CASES;
const steps = cs.map(c=>c.steps.length);
const prov = cs.reduce((a,c)=>{a[c.provenance.kind]=(a[c.provenance.kind]||0)+1;return a},{});
const stageC = cs.reduce((a,c)=>{a[c.stage]=(a[c.stage]||0)+1;return a},{});
let opts=0,best=0,acc=0,term=0;
for(const c of cs) for(const s of c.steps) for(const o of s.options){opts++; if(o.best)best++; if(o.acceptable)acc++; if(!o.next) term++;}
console.log("cases",cs.length,"provenance",prov,"stage",stageC,"steps min/median/max", Math.min(...steps), steps.sort((a,b)=>a-b)[Math.floor(steps.length/2)], Math.max(...steps), "options",opts,"best",best,"acceptable",acc,"terminal",term);
// refs
console.log("refs", refList.length, "verified", refList.filter(r=>r.verified).length, "kinds", refList.reduce((a,r)=>{a[r.kind]=(a[r.kind]||0)+1;return a},{}));
// does any lesson/quiz mention entrustment / EPA / mastery / deliberate practice / debrief
const txt = JSON.stringify(TRACKS);
for (const w of ["entrust","EPA","deliberate practice","debrief","mastery learning","PEARLS","simulation-based","competenc","proficiency","time-out","WHO surgical safety","checklist","radiation","ALARA","mSv","Gy","dose area product","DAP","air kerma"]) {
  const m = txt.match(new RegExp(w,"gi")); console.log(w, m?m.length:0);
}
