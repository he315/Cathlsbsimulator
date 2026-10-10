import { TRACKS, ALL_CASES } from "./content.mjs";
const allQ = TRACKS.flatMap(t=>t.modules.flatMap(m=>m.quiz));
const positional = allQ.filter(q=>/\b(option [A-E]|(first|second|third|fourth|fifth|last) option)\b/i.test(q.explanation));
console.log("positional (unshuffled) quiz items", positional.length);
// length ratio of correct vs mean distractor
const ratios = allQ.map(q=>{const L=q.options.map(o=>o.length); const d=L.filter((_,i)=>i!==q.answer); return L[q.answer]/(d.reduce((a,b)=>a+b,0)/d.length);}).sort((a,b)=>a-b);
console.log("correct/mean-distractor length ratio median", ratios[Math.floor(ratios.length/2)].toFixed(2), "p25", ratios[Math.floor(ratios.length/4)].toFixed(2), "p75", ratios[Math.floor(3*ratios.length/4)].toFixed(2));
// by difficulty
for (const d of [1,2,3]) { const Q=allQ.filter(q=>q.difficulty===d); let n=0; for(const q of Q){const L=q.options.map(o=>o.length); const mx=Math.max(...L); if(L[q.answer]===mx && L.filter(x=>x===mx).length===1) n++;} console.log("difficulty",d,"longest-correct",n,"/",Q.length, (100*n/Q.length).toFixed(1)+"%"); }
// expected score of "always pick the longest option"
let exp=0; for(const q of allQ){const L=q.options.map(o=>o.length); const mx=Math.max(...L); const idx=L.map((l,i)=>l===mx?i:-1).filter(i=>i>=0); exp+= idx.includes(q.answer)?1/idx.length:0;} console.log("expected score of always-pick-longest strategy", (100*exp/allQ.length).toFixed(1)+"%");
// cases: best option longest
let cs=0,ct=0; for(const c of ALL_CASES) for(const s of c.steps){ const L=s.options.map(o=>o.text.length); const mx=Math.max(...L); const b=s.options.findIndex(o=>o.best); if(b<0) continue; ct++; if(L[b]===mx && L.filter(x=>x===mx).length===1) cs++; }
const optsPerStep = ALL_CASES.flatMap(c=>c.steps.map(s=>s.options.length));
const avgOpts = optsPerStep.reduce((a,b)=>a+b,0)/optsPerStep.length;
console.log("case steps with a best option", ct, "best is uniquely longest", cs, (100*cs/ct).toFixed(1)+"%", "mean options/step", avgOpts.toFixed(2));
// steps with more than one best
let multi=0; for(const c of ALL_CASES) for(const s of c.steps){ if(s.options.filter(o=>o.best).length>1) multi++; } console.log("steps with >1 best", multi);
// branching: do any options jump (next) to non-sequential step?
let jumps=0,stepsTot=0; for(const c of ALL_CASES){ const ids=c.steps.map(s=>s.id); c.steps.forEach((s,i)=>{stepsTot++; for(const o of s.options){ if(o.next && o.next!==ids[i+1]) {jumps++; break;} }}); } console.log("steps with a non-linear branch", jumps, "of", stepsTot);
// diagnostic + pci-core quiz items mentioning views/projection
const vq = TRACKS.filter(t=>["diagnostic","pci-core"].includes(t.id)).flatMap(t=>t.modules.flatMap(m=>m.quiz)).filter(q=>/(RAO|LAO|cranial|caudal|projection|view)/i.test(q.stem));
console.log("diagnostic+pci-core quiz items about views/projections", vq.length);
