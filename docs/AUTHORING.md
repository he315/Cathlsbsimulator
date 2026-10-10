# CathMaster Academy — content authoring guide

Read this whole file before writing anything.

## Who the learner is
A UK-based doctor starting an interventional fellowship who may never have done
cardiology. The curriculum must take them from zero to performing complex PCI
independently, then into structural interventions and mechanical circulatory
support. Write for an intelligent adult who is new to the field: define terms
on first use, then go deep. Advanced fellows should still find the later
modules demanding.

Orientation: ESC/EAPCI guidelines first, UK practice (radial-first, BCIS-style
pathways). Mention important US/other differences only where they matter.

## Where your content goes
- Your track file: `src/content/tracks/<track-id>.ts`. Replace the whole
  exported object. **Keep the export name exactly as it is in the stub.**
- Types: `src/content/schema.ts`. Read it. Use only the block kinds it defines.
- Do not edit any file other than the ones you are assigned.

## Sources
Plain-text extracts of the supplied books are in the session scratchpad:
`/private/tmp/claude-502/-Users-qc25212-Downloads-Misc-Games-and-apps-Cath-Simulator/44008407-56ca-4c73-9f50-2b40e2ca2b8c/scratchpad/refs/`
- `EH_views.txt` — views catalogue, view identification, LM/RCA views, grafts,
  LIMA, RCA branch anatomy, acute marginal vs true RCA, collaterals, SCAD.
- `Oxford_handbook.txt` — anatomy, catheter selection/engagement, contrast,
  stenosis grading, spasm, anomalies.
- `Medmastery_PCI.txt` — patient selection, periprocedural drugs, consent,
  access, anatomy, lesion assessment, guides/wires/balloons/stents/misc kit,
  PCI step by step, pressure wire, complex lesions, complications, aftercare.
- `Angio.txt` — labels from an annotated angiography atlas (RCA/LCA by view).

Read the parts relevant to your track **before** writing. Combine them with
established knowledge from the core texts (Hanna, *Practical Cardiovascular
Medicine*; Brilakis, *Manual of PCI* and *Manual of CTO*) and current ESC
guidelines.

## Copyright: write in your own words
The supplied books are copyrighted. Extract facts, procedures, thresholds and
reasoning, then express them in **original wording and original structure**.
Never paste or lightly reword sentences. Never reproduce figures or tables
verbatim; build your own tables from the facts.

## Accuracy rules (non-negotiable)
- Only state well-established facts. If you are not confident in a number,
  either omit it, give it qualitatively, or give a range with "approximately".
- Never invent trial results, effect sizes, percentages or citations.
- Device-specific numbers (sizes, flows, sizing ranges): only if you are
  confident they are correct and current; otherwise teach the principle and
  say "check the device's instructions for use".
- Where guidelines changed recently (e.g. ACS 2023, CCS 2024, AF 2024, VHD
  2021/2025), say which version you are describing.
- This is education, not patient-specific medical advice. Do not write dosing
  that someone could misuse out of context without stating it is typical and
  must follow local protocol.

## References
- Cite only ids that already exist in `src/content/refs.ts` (`refs: [...]` on
  lessons, quiz items, cases). Do **not** edit `refs.ts`; another author owns it.
- If you need a source that is not in the registry, add a comment at the top of
  your file: `// REF-REQUEST: <full citation as best you know it>`. Do not cite
  it until it is added.
- Prefer the supplied documents (`supplied-*`) where they cover the point.

## Style
- British English (haemodynamics, ischaemia, catheterisation, anaesthesia,
  oesophageal, centre, litre, -ise).
- Direct, precise, clinical. Short paragraphs. Use `keypoints`, `pitfalls`,
  `pearl`, `table` and `steps` generously; they are what makes the app useful.
- No filler, no motivational fluff, no emojis, no phrases like "it is important
  to note", "delve", "in today's world".
- Second person is fine ("advance the wire…").

## Size and shape targets
- 4–8 modules per track; 2–5 lessons per module.
- Each lesson roughly 400–900 words spread across blocks.
- **Quiz:** at least 6 single-best-answer items per module, 4–5 options each,
  plausible distractors, `explanation` that says why the answer is right **and**
  why the most tempting wrong option is wrong. Mix difficulty 1–3.
- **Cases:** 2–4 synthetic branching cases per track
  (`provenance: { kind: "synthetic" }`), 4–7 steps each, realistic vitals and
  findings in `info`, exactly one `best` option per step (others `acceptable`
  or wrong) with feedback that teaches. Reference them from modules via
  `caseIds`.
- Set `stage` honestly (1 foundations … 5 complex/structural/MCS).

## Ids
kebab-case, globally unique, prefixed by your track prefix:
foundations `fnd-`, diagnostic `dx-`, haemodynamics `hd-`, physiology-imaging
`phy-`, pci-core `pci-`, pci-complex `cx-`, complications `comp-`, acute-mcs
`mcs-`, structural `sh-`, procedures-career `bed-`. Quiz ids `<prefix>q-…`,
case ids `<prefix>case-…`.

## Figures and simulators
- Figures: only the `FigureId` values in `schema.ts`.
- Simulators: only the `SimId` values in `schema.ts`. Use `{ kind: "sim" }`
  blocks and module `sims` to send the learner to practise, with a concrete task
  (e.g. "Seat a JL4 in a small root without damping, then inject in LAO caudal").

## Validate before you finish
Run from the repo root (`export PATH="/opt/homebrew/bin:$PATH"` first):

    TRACK=<track-id> npx vitest run src/content/track.check.test.ts
    npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep "src/content/tracks/<track-id>"

Both must be clean for your file. Errors in other authors' files are not yours
to fix; ignore them.
