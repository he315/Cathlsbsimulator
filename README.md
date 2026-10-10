# CathMaster — Coronary Angiography Mastery Simulator

An original, browser-based **educational** simulator for learning the fundamentals of
diagnostic coronary angiography: catheter handling, selective engagement of the
coronary ostia, fluoroscopic projections, pressure-waveform safety, and pattern
recognition of coronary anatomy and pathology.

It runs entirely in the browser — no backend, no accounts, no data leaves your machine.
Progress is stored in your browser's `localStorage`.

> ### ⚠️ Disclaimer
>
> **This is a simplified educational simulation for training pattern recognition,
> spatial reasoning and procedural judgement. It is not a medical device and must
> not be used for patient care. Real angiography must be learned under direct
> expert supervision.**

CathMaster is an independent, from-scratch teaching tool. It is **not** a copy of, and
is not affiliated with, any commercial simulator, product, or platform. It does not
reproduce any proprietary interface, asset, workflow, name, scoring system, or graphics.

---

## Quick start

Requirements: **Node.js 18+** and npm.

```bash
npm install     # install dependencies
npm run dev     # start the Vite dev server (opens http://localhost:5173)
```

Other scripts:

```bash
npm run build      # type-check (tsc -b) and build a production bundle into dist/
npm run preview    # serve the production build locally
npm run typecheck  # type-check only, no emit
```

---

## What it teaches

The design goal is *educational usefulness*, not visual mimicry. Every interaction is
backed by real geometry and physiology-inspired logic, and the coach continually
explains **why** — why the tip is where it is, why a view foreshortens a segment, why a
waveform is dangerous.

Core learning objectives:

- **Spatial reasoning** — understand the aortic root, the three sinuses/cusps, the
  valve plane, and where the coronary ostia sit relative to the catheter tip.
- **Catheter handling** — advance / withdraw / rotate / torque to seat a catheter
  coaxially in the left main or RCA ostium, and pick the right catheter for the root.
- **The LV danger zone** — recognise when the tip has crossed the valve plane into the
  left ventricle, and why you must never inject there.
- **Fluoroscopic projections** — how 3D anatomy becomes a 2D angiogram, and which
  standard view (RAO/LAO, cranial/caudal, spider) best lays out each segment.
- **Pressure & safety** — read aortic vs. damped vs. ventricularised vs. wedged
  waveforms and confirm a clean pressure **before every injection**.
- **Pattern recognition** — coronary dominance, ostial locations, take-off variants,
  and a spectrum of lesion severities.

---

## Keyboard controls

The simulator is fully keyboard-driven (controls are ignored while typing in an input,
select, or textarea). The on-screen control panel mirrors every key.

| Key(s)        | Action                                              |
| ------------- | --------------------------------------------------- |
| `W` / `S`     | Advance / withdraw the catheter                     |
| `A` / `D`     | Rotate the catheter (counter-clockwise / clockwise) |
| `Q` / `E`     | Torque the tip (−/+)                                 |
| `↑` / `↓`     | Advance / withdraw the guidewire                     |
| `←` / `→`     | Nudge the C-arm (LAO / RAO)                          |
| `Space`       | Inject contrast                                     |
| `P`           | Check pressure at the tip                           |
| `V`           | Cycle to the next fluoroscopy view preset           |
| `H`           | Request a hint from the coach                       |
| `R`           | Reset the current case                              |
| `1`–`9`       | Quick-select a catheter                             |

Orbit the 3D anatomy by dragging in the "3D Anatomy" panel.

---

## The app (15 sections)

**Overview**
- **Dashboard** — level, XP, streak, training time, safety/overall averages, recent
  cases, and quick jump-in actions.
- **Daily Training Plan** — the plan for the current curriculum day, scaled to your
  chosen training intensity.
- **Guided Curriculum** — the full 365-day, 9-phase syllabus and where you are in it.
- **Performance Analytics** — score trends over your last attempts and your most
  frequent mistakes (Recharts).

**Practice**
- **Free Cath Lab** — the full simulator: 3D anatomy + live fluoro + pressure waveform
  + coach, with any catheter/case.
- **Challenge Mode** — no-hint cases for assessment-style practice.
- **Case Library** — browse and launch built-in cases.
- **Pathology Recognition** — lesion cases across a severity spectrum, each with the
  view that best demonstrates it.

**Skills labs**
- **Anatomy Lab** — orbit the root, toggle overlays (ostia, labels, valve plane,
  cusps, transparency), and learn tip zones.
- **Catheter & Wire Lab** — the catheter and guidewire catalogue and what each is for.
- **Fluoroscopy View Trainer** — apply/nudge projections and see live foreshortening
  (elongation) for LAD / LCx / RCA.
- **Pressure & Safety Trainer** — animated aortic / damped / ventricularised / LV /
  wedged waveforms and the one safety rule.

**Reference**
- **Coronary Anatomy Atlas** — searchable left/right vessel reference with best views.
- **Mistake Review** — a ledger of your logged mistakes with drills, plus a
  longitudinal coach insight.
- **Settings** — training intensity, simulation difficulty, curriculum day, and
  export / import / reset of your progress JSON.

---

## Content & simulation depth

- **17 diagnostic catheters** (Judkins L/R in multiple sizes, Tiger, Amplatz L/R,
  multipurpose, EBU, internal mammary L/R, pigtail) and **5 guidewires**.
- **13 fluoroscopy view presets** (AP, RAO/LAO, cranial/caudal combinations, spider,
  LAT, RCA-specific views), each annotated with the segments it best displays.
- **9 curriculum phases** across 365 days:
  1. Orientation & Safety (days 1–14)
  2. Aortic Root & Catheter Level (15–45)
  3. Left Coronary Engagement (46–90)
  4. RCA Engagement (91–135)
  5. Fluoroscopy & Projections (136–180)
  6. Coronary Anatomy Mastery (181–225)
  7. Diagnostic Angiography Cases (226–270)
  8. Difficult Anatomy & Troubleshooting (271–315)
  9. Mastery & Stress Testing (316–365)
- **10 progression levels**, from *Aortic Root Novice* to *CathMaster*, each gated on
  case count and safety score.
- **Template-driven case library** (multiple seeded variations per anatomy template)
  plus a **seeded procedural generator** for unlimited fresh anatomy.
- **Adaptive coach** that gives contextual feedback, logs mistakes by pattern, and
  surfaces longitudinal recommendations.

---

## Architecture

Layered and deliberately decoupled: pure data and pure simulation logic at the bottom,
Zustand stores in the middle, React components on top.

```
src/
  data/            Static domain data (no logic)
    catheters.ts       17 catheter definitions
    wires.ts           guidewire definitions
    curriculum.ts      9 phases, 10 levels, intensities, drill blocks
    viewPresets.ts     fluoroscopy projections
    teachingText.ts    disclaimer + all teaching copy

  simulation/      Pure, framework-free engine (deterministic, unit-testable)
    anatomy.ts         aortic-frame geometry, vessels, ostia, valve plane
    engagement.ts      tip → ostium engagement / coaxiality / LV-danger math
    projection.ts      C-arm basis, orthographic projection, foreshortening
    pressure.ts        waveform shapes (aortic/damped/ventricularised/…)
    contrast.ts        contrast opacification / fade
    scoring.ts         safety / efficiency / anatomy / overall scoring
    adaptiveCoach.ts   contextual + longitudinal coaching, mistake mapping
    caseGenerator.ts   CASE_LIBRARY + generateRandomCase (seeded)
    curriculumEngine.ts day → plan expansion

  state/           Zustand stores (compose the engine; hold app state)
    useSimulatorStore.ts   live case: catheter, tip, C-arm, overlays, coach
    useProgressStore.ts    profile, XP/level, mistakes, attempts, persistence
    useUiStore.ts          active section, case launching

  ui/              React + React Three Fiber presentation
    SectionShell.tsx       shared section layout
    sim/                   simulator widgets
      Simulator.tsx          keyboard handling + tick loop, composes the lab
      AnatomyScene.tsx       3D root/coronary tree (R3F + drei)
      FluoroView.tsx         2D projected angiogram
      PressureWave.tsx       live pressure trace
      ControlPanel.tsx       on-screen controls
      CoachPanel.tsx         coach feedback + scores
    sections/              the 15 app sections

  types/index.ts   shared TypeScript types
  utils/           math, seeded RNG, localStorage helpers
```

**Coordinate frame.** Anatomy and engagement math live in an *aortic frame*
(`+x` = patient left, `+y` = superior, `+z` = anterior; valve plane at `y = 0`; the LV
danger zone is below it). `toWorld` tilts that frame for rendering and projection, so
the physics stays clean and readable.

**Persistence.** Progress is namespaced under `cathmaster:v1:` in `localStorage`.
Export/import round-trips a single JSON blob from **Settings**.

**Stack.** React 18 · TypeScript 5 · Vite 5 · React Three Fiber + drei + three ·
Zustand · Recharts · Tailwind CSS.

---

## Extending it

The layering makes each kind of addition local:

- **Add a catheter** → append to `src/data/catheters.ts` (tip curve + sizing); it shows
  up in the selector and the `1`–`9` shortcuts automatically.
- **Add a fluoroscopy view** → append to `src/data/viewPresets.ts` with its C-arm
  angles, the segments it's best for, and a teaching note.
- **Add anatomy/pathology** → add a template in `caseGenerator.ts`; variations and
  procedural cases are generated for you.
- **Tune difficulty** → engagement tolerances and pressure thresholds are centralised in
  `engagement.ts` / `pressure.ts`; difficulty presets scale them.
- **Add a section** → drop a component in `ui/sections/`, register it in `App.tsx`, and
  add its `SectionId` to `types/index.ts`.
- **Change teaching copy** → all text lives in `data/teachingText.ts`.

## Roadmap

Natural next steps beyond the current build:

- Formal **mastery exams / assessments** UI (the progress store already records exam
  results; the level-10 *Master Assessment* gate is defined).
- **Spaced-repetition** review of missed patterns (the `SrsItem` scaffolding exists in
  the progress profile).
- More pathology templates and rarer anatomical variants.
- Optional IndexedDB storage for larger histories.

---

*Educational use only. Not a medical device. Real angiography must be learned under
direct expert supervision.*
