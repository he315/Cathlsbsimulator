# physiology-post-pci-handover: model parameters

The post-PCI presets, the post-PCI algorithm and the builder of a post-PCI case from a deployed stent (`src/simulation/physiology.ts`, section "Post-PCI physiology"), the decision panel and the post-PCI study (`src/ui/physiology/DecisionPanel.tsx`) and the bench's mapping of its stent (`src/ui/bench/AssessPanel.tsx`).

Sourced values are not repeated as model parameters: the trigger for a pullback after PCI, FFR 0.80 or less or iFR 0.89 or less (`CUTOFF.ffr`, `CUTOFF.nhpr`; lesson pm-physiology-after-pci, Brilakis Fig 12.1); the four actions of the algorithm (loss inside the stent: post-dilate or add a stent; focal step outside it: stent it; diffuse fall outside it: no further treatment); `POST_PCI_GOOD_FFR` = 0.91, the value Brilakis links with the best outcomes (Brilakis 12.1, an observational link as the lesson says); the causes of a disappointing post-PCI FFR quoted in the teaching (Brilakis 12.1.2, the lesson's table); TARGET-FFR as the lesson reports it; the bench's underexpansion threshold of 80% (`EXPANSION_MIN_PCT`, src/simulation/imaging/criteria.ts, cited there).

## The presets (physiology.ts `POST_PCI_PRESETS`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `POST_PCI_LAD` | src/simulation/physiology.ts | reference 3.0, length 110, CFR potential 3.6, MAP 92 | mm, mm, ratio, mmHg | MODEL PARAMETER: the teaching cases' mid-LAD vessel (`lad-intermediate`) |
| `POST_PCI_STENT` | src/simulation/physiology.ts | 0.30 to 0.50 | position along the vessel (22 mm) | MODEL PARAMETER: a mid-LAD stent |
| in-stent step: in-stent lesion | src/simulation/physiology.ts | pos 0.40, ds 0.61, 8 mm; diffuse 0.05 | position, diameter stenosis, mm, relative units | MODEL PARAMETER: chosen so the final FFR is 0.80 or less (about 0.78) with the largest pullback step inside the stent |
| focal edge step: in-stent residual and edge lesion | src/simulation/physiology.ts | in-stent pos 0.40, ds 0.10, 10 mm; edge pos 0.53, ds 0.62, 8 mm; diffuse 0.05 | as above | MODEL PARAMETER: chosen so the final FFR is 0.80 or less (about 0.76) with the step 3 mm beyond the distal edge |
| diffuse loss | src/simulation/physiology.ts | no lesion; diffuse 1.45 | relative units | MODEL PARAMETER: chosen so the final FFR is 0.80 or less (about 0.78) with no step above 0.02 anywhere on the pullback |
| good result | src/simulation/physiology.ts | in-stent pos 0.40, ds 0.10, 10 mm; diffuse 0.05 | as above | MODEL PARAMETER: chosen so the final FFR is above 0.91 (about 0.98) |
| `STEP_EPS` | src/simulation/physiology.ts | 1e-6 | position | MODEL PARAMETER (numerical): a lesion's step is read just proximal and just distal to its position |

## The algorithm (physiology.ts `postPciAlgorithm`, `postPciEvents`, `postPciTipContext`)

| Rule | File | Value | Rests on |
|---|---|---|---|
| Where the pressure is lost | src/simulation/physiology.ts | the largest of: the Pd/Pa lost across the stent; the largest single lesion step outside it; the rest of the loss outside it | MODEL PARAMETER: this model's reading of "find where the remaining pressure is lost" (Brilakis Fig 12.1) |
| `stent-underexpanded` after the pullback | src/simulation/physiology.ts | raised when the value is low and the loss lies inside the stent | an undersized or underexpanded stent is among the causes Brilakis lists (12.1.2); the event is this model's inference |
| Tip context phase | src/simulation/physiology.ts | "optimise" only | MODEL CHOICE, and a deliberate departure from the plan's tipIntegration line, which says phase "physiology": the post-PCI study is part of the optimisation step, and the set-up tips of phase "physiology" do not apply to a wire already across the stent. Adding "physiology" to the context pushed the lab request's own post-PCI tip down to rank 28 of the shortlist. The physiologyTips.ts follow-up should not add "physiology" to the stented presets' context without weighing that ranking cost. |

## A post-PCI case from a deployed stent (physiology.ts `postPciCaseFromStent`, AssessPanel.tsx `postPciInputFromBench`)

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| In-stent residual diameter stenosis | src/simulation/physiology.ts `inStentResidual` | 1 − √(expansion / 100) | ratio | MODEL CHOICE, labelled: the stent's narrowest diameter against the reference lumen its expansion was judged by (the plan's "minimum stent diameter to residual ds") |
| In-stent waist length | src/simulation/physiology.ts `inStentResidual` | ∫ (d_min / d)⁴ dx over the stent narrower than that reference | mm | MODEL CHOICE, labelled: the Poiseuille-equivalent length of a tapering waist at its narrowest diameter; the exit loss is taken once |
| `MP_WAIST_MIN_MM` | src/simulation/physiology.ts | 2 | mm | MODEL PARAMETER: shortest in-stent waist |
| `MP_EDGE_RESIDUAL_MIN_DS` | src/simulation/physiology.ts | 0.2 | diameter stenosis against the side's reference lumen | MODEL PARAMETER: a native narrowing beside the stent counts as a residual lesion from here |
| `MP_EDGE_MIN_MM` | src/simulation/physiology.ts | 1 | mm | MODEL PARAMETER: shortest residual edge lesion |
| `EDGE_STEP_MM` | src/simulation/physiology.ts | 0.5 | mm | MODEL PARAMETER (numerical): sampling of the native lumen beside the stent |
| `MP_POST_PCI_SEGMENT_OFFSET_MM` | src/simulation/physiology.ts | 20 | mm | MODEL PARAMETER: normal vessel proximal to the bench's segment |
| `MP_POST_PCI_VESSEL_MM` | src/simulation/physiology.ts | 110 | mm | MODEL PARAMETER: the shortest vessel (the teaching cases' LAD length) |
| `MP_POST_PCI_DISTAL_MM` | src/simulation/physiology.ts | 30 | mm | MODEL PARAMETER: normal vessel kept beyond the segment |
| `MP_POST_PCI_DIFFUSE` | src/simulation/physiology.ts | 0.05 | relative units | MODEL PARAMETER: the teaching cases' near-normal diffuse disease |
| `MP_POST_PCI_CFR`, `MP_POST_PCI_MAP` | src/simulation/physiology.ts | 3.6; 92 | ratio; mmHg | MODEL PARAMETER: the teaching cases' values |
| Reference diameter of the built case | src/ui/bench/AssessPanel.tsx | mean of the bench's proximal and distal reference lumens (`preImaging`) | mm | MODEL CHOICE: the engine's vessel has one diameter |
| Native lumen beside the stent | src/ui/bench/AssessPanel.tsx | the bench's native lumen (`lumen`), before any treatment | mm | MODEL CHOICE: the bench keeps no lumen gained outside the stent |

## The preset the bench's hand-over names (AssessPanel.tsx `benchPostPciVariant`)

| Rule | File | Value | Rests on |
|---|---|---|---|
| In-stent step | src/ui/bench/AssessPanel.tsx | worse-half expansion below 80% (recoil included) | `EXPANSION_MIN_PCT` (sourced in criteria.ts) |
| Focal edge step | src/ui/bench/AssessPanel.tsx | a geographic miss, or a residual edge lesion (`edgeResiduals`) | MODEL CHOICE |
| Good result | src/ui/bench/AssessPanel.tsx | otherwise | MODEL CHOICE; the diffuse variant has no bench counterpart (the bench models no disease beyond its segment) |

## What the physics gives for bench stents (recorded, not tuned)

Under the engine's geometry calibration (`GEOM_A`, `GEOM_B`), the case built from a bench stent at about 70% expansion (focal LAD, 9.8 atm, no post-dilatation) reads FFR about 0.97, and the calcified RCA stented without calcium modification (about 31% expansion, minimal stent area 3.2 mm²) about 0.96: the largest pullback step lies inside the stent in both, but the value does not trigger the algorithm, so the built case is graded "accept the result" and the bench says that the imaging criteria judge the expansion separately. The preset `post-pci-instent-step` is where the low-value in-stent branch is practised. The residual-ds mapping was not scaled to force a low value.

Because of this, the bench and the lab grade one stent result the same way: the bench's 'Measure post-PCI physiology' studies the preset chosen from the lumen (`benchPostPciHandover(...).case`, the preset's own case), and the hand-over asks the physiology lab to open that same preset (`params.scenario`). The case built from the stent (`builtCase`) is context only, carried in the payload (`postPci.lumenVariant`, `postPci.presetId`, `postPci.physicsDecision`, `postPci.builtCase`) and never graded, since its own decision ("accept-result" under the current calibration) differs from the preset's. `postPci.test.ts` pins the built cases' values above the cut-off and their "accept-result" decision, so a recalibration that changes them fails a test rather than passing silently, and checks that the studied case's decision is the one the lumen variant names. The residual-ds mapping was not recalibrated so that every stent below 80% expansion reads FFR 0.80 or less: a 21% area shortfall is an 11% diameter stenosis, which no calibration of this engine should make haemodynamically significant. Once the learner has decided, for a stent below the 80% expansion criterion whose own case reads above the cut-off, the bench says that in this model the stent's residual waist reads that value, so imaging, not the pressure wire, shows that it still needs optimising (the imaging lesson: an underexpanded stent is more likely to restenose or thrombose). Nothing of this is shown before the decision.

## Display rules (physiology.ts `postPciShown`, DecisionPanel.tsx `StentBand`)

| Rule | File | Value | Rests on |
|---|---|---|---|
| Cut-offs compared on the shown value | src/simulation/physiology.ts `postPciShown`, `postPciAboveGood`, `postPciLow` | the value rounded to two decimals before comparison with 0.80, 0.89 and 0.91 | MODEL CHOICE: a value the screen shows as 0.91 is never called above 0.91, nor one shown as 0.80 above the cut-off |
| Stent band under the pullback | src/ui/physiology/DecisionPanel.tsx `StentBand` | the stented segment drawn on the pullback plot's own horizontal scale (viewBox 760, positions 0 to 1 at 50 to 740) | display only; PullbackPlot's own marks stay as they are (that file belongs to another package) |

The preset briefs share one setting that claims nothing about the angiogram, because two presets leave a narrowing that angiography would show (a 61% diameter stenosis inside the stent; a 62% lesion 3 mm beyond its distal edge), and nothing about the vessel beyond the stent.
