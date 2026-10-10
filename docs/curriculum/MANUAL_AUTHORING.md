# Writing a manual-curriculum module

Read all of this before writing. It extends `docs/AUTHORING.md` (read that too: learner, style,
British English, quiz rules). Where the two differ, this file wins for the manual curriculum.

## What you are building

The manual curriculum teaches **every topic of two core manuals**, step by step, so that a fellow can
learn angiography and PCI from this app alone:

- Brilakis ES. *Manual of Percutaneous Coronary Interventions: A Step-by-Step Approach* (Elsevier;
  © 2021, ISBN 978-0-12-819367-9). Ref id `brilakis-manual-pci`. Source book id `brilakis-pci`.
- Mitchell A, De Maria GL, Banning A. *Cardiac Catheterization and Coronary Intervention*, 2nd ed.
  (Oxford Specialist Handbooks in Cardiology, OUP 2020). Ref id `oxford-cath-handbook`. Source book
  id `oxford-cath`.

plus the YouTube channels of Emmanouil Brilakis and Elias Hanna as linked further study. The owner
wants **all of the information** in these sources taught, **with no errors and nothing invented**,
in the app's existing format (lessons, checks, quizzes, branching cases, hands-on labs), and the
practical teaching **built into the labs** (for example, engagement tips appear in the cath lab
when the learner is engaging).

One module = one file: `src/content/manual/<track>/<NN>-<name>.ts` (path given in your task). Your
task lists the module id, title, stage, the coverage-map topics it must teach, the book sections
and chapters that cover them, and the videos matched to those topics.

## The source texts (read them; they are the ground truth)

Plain-text extracts with page markers (`=== PDF page N ===`) live outside the repository:

```
BOOKS=<a scratch folder>   # restored from $DATA_DIR/datasets/tmp/books-backup; copyrighted, never committed
$BOOKS/brilakis/chNN.txt      # Manual of PCI, chapter NN (01-30)
$BOOKS/oxford/chNN.txt        # Oxford Handbook, chapter NN (01-11)
$BOOKS/index.json             # chapter page ranges, Brilakis section start pages
$BOOKS/whole/                 # both books whole, for the copy check
```

The PDFs themselves (for figures, tables and algorithms that the text extract garbles; read them with
the Read tool and the `pages` parameter, at most 20 pages per call):

- Brilakis: the owner's local PDF of the book, outside the repository (PDF page numbers as in the extracts)
- Oxford: the owner's local PDF of the book, outside the repository (printed page = PDF page − 21)

Read **every page** of the sections your topics cover, in both books, before writing. Use grep across
both books for your topics: the same subject is often covered in more than one chapter (for example,
radial spasm appears under access, engagement and access complications).

## Accuracy: nothing invented, nothing wrong

1. **Every factual statement must be traceable** to (a) the pages of the two manuals you cite, or
   (b) a reference in `src/content/refs.ts` or one you add (rule 5). Numbers (doses, pressures, sizes,
   thresholds, times, percentages, French sizes, angles) must appear in the source exactly as you give
   them. If you cannot point to it, leave it out.
2. **Teach all of the source's teaching for your topics**: every step, technique, rule of thumb,
   caution, bail-out, algorithm branch and equipment point in those sections, in your own words and
   structure. Do not summarise away the practical detail; that detail is the point.
3. **Where the source is out of date** (the books predate the 2023 ESC ACS, 2024 ESC CCS and later
   guidelines), teach current practice only if you can cite a verified reference for it, and say what
   changed ("The 2023 ESC guideline now ..."). If you cannot verify the update, teach what the manual
   says and attribute it ("The manual recommends ...") rather than guessing.
4. **Do not describe videos beyond their titles.** You cannot watch them. A video block's `note` may
   only say what the title says the video is about.
5. **New references**: add them to your module's `refs` export (see the template), each checked
   against PubMed (use the PubMed tools: load them with ToolSearch, query "pubmed") or the publisher
   page. Put `PMID: ...` or `DOI: ...` in `note` and set `verified: true` only after checking authors,
   title, journal, year, volume and pages. Never cite from memory. Ids: kebab-case, `<firstauthor>-<topic>-<year>`; check the id is not already in `refs.ts`.
6. Drug doses: give them only as the source gives them, say they are typical and follow local
   protocol, and never strip the context (weight basis, route, ACT target).
7. Device names: use the generic class ("dissection re-entry system", "guide extension catheter",
   "scoring balloon"). Name a specific product only where the source names it as the only example of a
   technique, and never in titles. Catheter curve names (JL4, JR4, AL1, EBU 3.5, IM, MP, radial
   universal curves) are standard terms and are fine. ACT analyser names (Hemochron, HemoTec) may be
   used in body text where a manual's ACT target is specific to that device; never in titles.
8. If the two books disagree, say so and give both positions with their sources.

## Copyright: your own words

The books are copyrighted. Read, understand, then write **in original wording and original
structure**. Never copy or lightly reword sentences; never reproduce a figure, table or algorithm
diagram as drawn; build your own tables and steps from the facts. Run the copy check (below): **zero**
shared runs of 8+ words, except sequences that are only numbers, classification codes or proper names.

## Lesson design: step by step, interactive, practised

One lesson per topic (two closely related small topics may share a lesson; list both in `topics`).
Aim for 600–1,200 words of teaching per lesson. Each lesson, in roughly this order:

1. `p`: what this step or problem is and why it matters, in two or three sentences.
2. The core teaching as `steps` blocks (numbered actions, each with a precise `detail`), plus `table`,
   `list`, `formula` where the content is comparative or numeric. Name decision points explicitly
   ("If X, do Y; if Z, do W").
3. At least **two `check` blocks** placed straight after the material they test (not all at the end):
   applied questions ("The pressure damps as you engage the RCA. What next?"), 3–5 options, an
   explanation that says why the answer is right and why the tempting wrong option is wrong.
4. `pitfalls` (what goes wrong and how to avoid it) and `pearl` (the expert's trick), from the source.
5. `tip` blocks for the practical points that also live in the lab (see "Lab tips").
6. Practice: a `sim` or `drill` block that sends the learner to the lab where this is done, with a
   precise task ("In the cath lab, engage the RCA with a JR4 from the right radial: ..."). Only link
   labs that exist (list below). If the hands-on practice this topic needs does not exist yet, still
   link the nearest lab and describe the need in your lab-request file.
7. `video` blocks: one to four of the most relevant videos from your task's list, as "watch next".
8. `keypoints`: the five to eight things to remember.
9. `sources` on the lesson: every manual section or chapter heading you used, e.g.
   `{ book: "brilakis-pci", loc: "5.7" }`, `{ book: "oxford-cath", loc: "ch 6: Catheter manipulation" }`.
   `refs`: always include `brilakis-manual-pci` and/or `oxford-cath-handbook` when used, plus any other
   reference you relied on. `topics`: the coverage-map topic ids the lesson teaches.

Rich text: `**bold**` is supported inside strings.

## Quiz and cases

- Module quiz: 8–12 single-best-answer items, 4–5 options, difficulty mixed (at least a third at 3:
  an advanced fellow should find them demanding), explanations that teach. Obey the answer-length rule
  in `src/content/validate.ts` (the correct option must not be uniquely the longest; make distractors
  as long and as specific as the answer).
- Cases: for clinical modules, one or two branching `CaseStudy` objects (`trackId` = your track,
  `provenance: { kind: "synthetic", basedOn: "<book and section>" }`), 5–8 main steps, with
  consequence steps for the important wrong choices (at least 30% of steps must branch to different
  places), `stateDelta` on options (best options never worsen stability), outcome and
  learningPoints. The case must test the same techniques and tips the lessons teach. List case ids in
  the module's `caseIds`.

## Lab tips: the teaching inside the labs

Every practical point that applies while the learner is doing something in a lab (engagement tricks,
what to do when the pressure damps, how to cross with a wire, how to deliver a stent, how to bail out
of a complication) becomes a `LabTip` in your module's `tips` export, using the vocabulary in
`src/content/lab/tips.ts` (`LAB_PHASES`, `LAB_EVENTS`, `CATHETER_FAMILIES`, `TIP_VESSELS`, plus
engagement and pressure classes from `src/types/index.ts`). Choose triggers that are precise: the tip
should appear exactly when it helps (for example `{ phase: ["engage-right"], catheter: ["JR"], event:
["engage-fail"] }`). Each tip: 1–4 sentences, original words, `tone` do/caution/bailout, `lessonId`
= the lesson that teaches it, `sources`. Show the same tip in the lesson with a `tip` block. Ids:
`<lab short>-<subject>`, e.g. `diag-jr-clockwise-engage`, `pci-guide-extension-stent-delivery`.

Write as many tips as the practical teaching needs (often 5–20 for a hands-on module). Do not invent triggers: use only the vocabulary.

Other modules are written at the same time. If your topic overlaps another module's (see docs/curriculum/module-plan.json), teach what your topic needs and name the other module for the rest; never edit another module's file.

## Labs you can link now

`sim` blocks (`SimId`): `cathlab` (diagnostic cath lab: femoral or radial access route, catheter
choice from JL3.5/4/4.5/5, JR3.5/4, TIG, AL1/2, AR, MP, EBU 3.0/3.5/4.0, IKL, IKR, pigtail; advance,
withdraw, rotate; pressure trace; hand injection; C-arm angles; cine; attending, team; debrief),
`procedure` (full case: ultrasound puncture, access fluoroscopy, sheath, table steps, angiogram, hand-over
to PCI, closure, recovery), `views` (projection trainer), `haemo` (right and left heart study,
waveforms, calculations), `pci-bench` (balloon and stent sizing, deployment, IVUS/OCT optimisation,
schematic), `physiology` (pressure wire: FFR, resting indices, pullback, drift), `iabp`, `impella`,
`ecmo`, `tavi`, `teer`, `laao`, `pacing`, `pericardiocentesis`.

`drill` blocks: `{ target: "angio-real", drill: <artery|dominance|occlusion|collaterals|view|grade|locate|estimate|plan|review>, params? }`
open the real-angiogram reading drills (parameter rules in `src/content/schema.ts`);
`{ target: "angio-pci", task }` opens the fluoroscopic PCI lab (scenarios today: focal mid-LAD,
calcified mid-RCA, LCx STEMI, mid-RCA CTO). `cine` blocks show a real library run by id; use only
run ids you have confirmed exist in `datasets/library/*/index.json` (grep the index; never guess).

## Lab requests (what the labs still need)

Write `docs/curriculum/lab-requests/<module-id>.json`: an array of
`{ "lab": "...", "what": "the scenario or capability", "learnerDoes": "...", "success": "...", "tips": ["tip ids"], "lessonIds": ["..."], "priority": "P1|P2|P3" }`
for every hands-on experience your topics need that the labs cannot give yet (for example a
bifurcation scenario with provisional stenting and kissing balloon in the PCI lab). These drive the
lab build that follows; be concrete and keep to what the sources teach.

## Evidence file (for the checkers)

Write `docs/curriculum/evidence/<module-id>.md`: for each lesson, every specific claim (numbers,
thresholds, doses, sizes, sequences, named techniques, recommendations) with where it comes from:
`brilakis p.<PDF page>` or `oxford p.<PDF page>` or `ref <id>`. Two independent checkers will verify
every line against those pages, and will also look for claims you did not list.

## Module file template

```ts
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

export const module: Module = {
  id: "pm-engaging",
  title: "...",
  stage: 2,
  summary: "...",
  objectives: ["..."],
  lessons: [
    {
      id: "pm-engaging-left",            // <module id>-<short>, kebab-case, globally unique
      title: "...",
      minutes: 12,
      topics: ["dx-engage-left"],
      sources: [{ book: "brilakis-pci", loc: "5.7" }, { book: "oxford-cath", loc: "ch 6: Catheter manipulation" }],
      refs: ["brilakis-manual-pci", "oxford-cath-handbook"],
      blocks: [ /* p, steps, check, table, pitfalls, pearl, tip, sim, video, keypoints */ ],
    },
  ],
  quiz: [ /* QuizItem: id "<module id>-q1" ... */ ],
  sims: [{ sim: "cathlab", task: "..." }],
  caseIds: ["pm-engaging-case-..."],
};

export const cases: CaseStudy[] = [ /* trackId: "<your track>" */ ];
export const tips: LabTip[] = [ /* lessonId must be one of the lessons above */ ];
export const refs: Reference[] = [ /* only new, PubMed-checked references */ ];
```

## Checks you must pass before you finish

```
# 1. structure, ids, sources, topics, tips, quiz size (fast)
npx vitest run src/content/manual.test.ts
# 2. copy check: must print 0 shared runs (apart from numbers, codes and names)
python3 scripts/content/overlap.py --books "$BOOKS/whole" <your module file>
# 3. types (run once at the end; about a minute)
npx tsc -p tsconfig.app.json --noEmit
```

Machine limits: this Mac stalls under load. Run nothing else heavy (no builds, no dev server, no
browser, no whole test suite). Keep each command under about two minutes. Edit only your own module
file, its evidence file and its lab-request file.
