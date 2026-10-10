# pci-wire-microcatheter: model parameters

The wire engine (`src/simulation/pci/coronaryWire.ts`), its actions (`src/simulation/pci/actions/wire.ts`), the wire event sources (`src/ui/lab/pciEvents/wire.ts`) and the drawing (`src/ui/pci/render/wire.ts`) gained a microcatheter, the tortuous-vessel mechanics (prolapse, a bend that catches the wall, the reversed hairpin wire, the deflection balloon, pseudolesions), trapping and the other ways of removing a microcatheter, and a selective microcatheter injection. Device dimensions and categories come from the catalogue (`src/simulation/pci/equipment.ts`, already sourced: microcatheter categories, `trapMinFrench`, the trapping balloon's sizes and chart, the guides' inner diameters, the wire specs). The values the module text gives are cited below; every other value is a MODEL PARAMETER chosen so that the mechanics behave as the module text describes, not taken from a source.

## Values from the module text

| Value | File | Value | Source |
|---|---|---|---|
| Reversed (hairpin) wire bent about 3 cm from the tip | `coronaryWire.ts` `TipShape.reversed`; `WireConsole.tsx` (30 mm) | 30 mm | pm-wiring-tortuosity: "Hairpin: polymer-jacketed wire bent 180 degrees about 3 cm from the tip, bend loaded first, overshoot, pull back; risk of dissection" |
| Trapping balloon at least 20 mm long (full grip) | `coronaryWire.ts` `TRAP_MIN_LENGTH_MM` | 20 mm | pm-wiring-microcatheters 'Size, length and place': "2.5 mm in a 6-7 Fr guide, 3.0 mm in a 7-8 Fr guide; ideally at least 20 mm long, which matters most with slippery polymer-jacketed wires" |
| Trapping balloon sizes by guide | `coronaryWire.ts` `removeMicro` default balloon | 2.5 mm (6 Fr), 3.0 mm (7-8 Fr) | the same passage; equipment.ts `trap` |
| Hydraulic exchange pressure | `coronaryWire.ts` `HYDRAULIC_ATM` | 14-20 atm | pm-wiring-microcatheters: "Pressurise to 14-20 atm under fluoroscopy" |
| Hydraulic exchange never over polymer-jacketed or stiff-tip wires | `coronaryWire.ts` `removeMicro` | rule | pm-wiring-microcatheters (lab request pm-wiring#9) |
| Short and exchange-length wires | `coronaryWire.ts` `SHORT_WIRE_CM`, `EXCHANGE_LENGTH_CM` | 190 cm, 300 cm | pm-wiring-wire-choice: "Short wires are about 180-190 cm; exchange lengths are 300 cm" (equipment.ts `WIRE_LENGTHS`) |
| Plaque modification microcatheter turn limit | `coronaryWire.ts` `MC_PLAQUE_MAX_TURNS` | 20 turns | pm-wiring-microcatheters: "no more than 20 turns in one direction, and contrast cannot be injected through it" (equipment.ts `mc-plaque`) |
| A guide smaller than the device's trapping minimum cannot trap it | `coronaryWire.ts` `removeMicro` | equipment.ts `trapMinFrench` (deflectable type 8 Fr) | pm-wiring-microcatheters, eq-balloons-stents-cart (catalogue sources) |
| A subintimal wire: abnormal course and motion, ventricular ectopics; a distal microcatheter injection extends the dissection | `actions/wire.ts` (operator messages), `render/wire.ts` | rules | pm-wiring-navigate (Oxford's hints that a wire has left the lumen; lab request pm-wiring#7). The lab shows the course and the motion; the monitor is not yet coupled to a subintimal wire, so the operator message names only the tip's free, out-of-step motion and no ectopics |
| Pseudolesions resolve when the wire is withdrawn so its soft distal segment lies across the bends; pulling it behind the lesion is an error | `actions/wire.ts` `refreshPseudo` | rule | pm-wiring-tortuosity, pm-wiring-navigate |

## MODEL PARAMETERS

| Parameter | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_MC_SUPPORT_GAIN` | `coronaryWire.ts` | 0.6 | share of the tip load | A microcatheter right behind the tip lets the wire deliver up to 1.6 times its tip load before it buckles (support for crossing, pm-wiring-microcatheters 'What a microcatheter does for you'). Chosen so a polymer-jacketed tapered wire crosses the rca-cto cap with a microcatheter 2 mm behind and not 20 mm behind |
| `MP_MC_SUPPORT_DECAY_MM` | `coronaryWire.ts` | 5 | mm | Distance over which that support fades as the microcatheter tip falls behind |
| `MP_MC_MIN_GAP_MM` | `coronaryWire.ts` | 1 | mm | The microcatheter stops this far behind the wire tip (it cannot lead the wire) |
| `MP_MC_EXCHANGE_KEEP_MM` | `coronaryWire.ts` | 10 | mm | A wire exchanged or reshaped through the microcatheter keeps its position only when its tip is at most this far beyond the microcatheter tip; further out, the new wire comes out MP_MC_MIN_GAP_MM beyond the microcatheter tip and the course beyond (route, crossing, a subintimal course) is lost (the microcatheter keeps the course only as far as its own tip). Without the geometry the action refuses and asks for the microcatheter to be advanced first |
| `MP_MC_PARK_MM` | `coronaryWire.ts` | -30 | mm (route; negative inside the guide) | Where a withdrawn microcatheter waits inside the guide for removal |
| `MP_MC_DRAG_COUPLING` | `coronaryWire.ts` | 0.25 | share of the microcatheter's travel | An unpinned wire comes back with a withdrawn microcatheter by this share of its travel in the vessel |
| `MP_MC_MAX_TURNS` | `coronaryWire.ts` | 10 | net turns | Over-rotation of the other categories deforms them (the module text says over-spinning damages them, without a number) |
| `MP_MC_BRANCH_REACH_MM` | `coronaryWire.ts` | 5 | mm | A microcatheter tip this close proximal to a branch origin (or in the branch) acts on the wire entering it |
| `MP_MC_ANGULATED_CAPTURE`, `MP_MC_DUAL_CAPTURE` | `coronaryWire.ts` | 0.6, 0.3 | rad | Extra capture cone an angulated or deflectable, or a dual-lumen, microcatheter gives at a branch origin |
| `MP_MC_PROLAPSE` | `coronaryWire.ts` | large 0.5, small 0.55, angulated 0.25, deflectable 0.25, dual-lumen 0.3, plaque modification 0.5 | prolapse multiplier | How much each category at the origin cuts prolapse (pm-wiring-tortuosity solution 2: straight, angulated or dual-lumen microcatheter) |
| `MP_PROLAPSE_MIN_D` | `coronaryWire.ts` | 1.6 | mm | Branches at least this wide take part in the prolapse model; narrower ones keep the earlier enter-or-pass rule |
| `MP_PROLAPSE_POLAR` | `coronaryWire.ts` | 1.4 | rad from the parent's axis | An acutely angled branch for the prolapse model and the hairpin hook |
| `MP_PROLAPSE_PER_MM` | `coronaryWire.ts` | 0.09 | chance per mm | Prolapse chance per mm pushed while the tip is in the first `MP_PROLAPSE_ZONE_MM` of such a branch, for a workhorse with a 40 degree bend; scaled by the coating friction (polymer-jacketed wires prolapse less: pm-wiring-tortuosity), the bend (a larger bend prolapses less), the angle, a microcatheter and a deflection balloon |
| `MP_PROLAPSE_ZONE_MM` | `coronaryWire.ts` | 8 | mm | Length of branch the wire needs before it has purchase |
| `MP_DEFLECT_PROLAPSE` | `coronaryWire.ts` | 0.2 | multiplier | A deflection balloon beyond the origin cuts prolapse (solution 4) |
| `MP_WALL_CATCH_PER_MM`, `MP_WALL_CATCH_MAX` | `coronaryWire.ts` | 0.25, 0.6 | chance per mm per unit of excess | A primary bend longer than the lumen is wide catches the wall (pm-wiring-shape-load pitfall: "A distal bend longer than the vessel is wide"); applies in lumens of at least the danger-zone diameter (1.5 mm) |
| `MP_FORCE_DISSECT_GF` | `coronaryWire.ts` | 2 | gf (tip capability with support) | A caught tip forced on with at least this capability goes under the intima; a softer one folds (pm-wiring-navigate: forcing a restrained tip dissects) |
| `MP_HAIRPIN_HOOK`, `MP_HAIRPIN_AZ_EXTRA`, `MP_HAIRPIN_DISSECT` | `coronaryWire.ts` | 0.8, 0.8 rad, 0.15 | chance, rad, chance | The reversed tip hooks an acute branch on the pull-back when its free end faces it within a wide window; a share of hooks dissect (the module text names the risk) |
| `MP_SOFT_SEGMENT_MM` | `coronaryWire.ts` | 30 | mm | Soft distal segment of a support wire; the stiff shaft behind it straightens bends |
| `MP_PSEUDO_KAPPA` | `coronaryWire.ts` | 0.15 | 1/mm | Curvature (radius under about 6.7 mm) at which the stiff shaft makes a pseudolesion |
| `MP_TRAP_OVERSIZE_FULL` | `coronaryWire.ts` | 0.25 | (balloon diameter at pressure / guide inner diameter) - 1 | Oversize at which the balloon presses the wire on the guide wall with its full pressure; below it the contact pressure falls in proportion |
| `MP_TRAP_HOLD_PER_ATM` | `coronaryWire.ts` | 1/12 | share of the withdrawal drag per atm | So the sourced pairings (2.5 mm in 6-7 Fr, 3.0 mm in 7-8 Fr, 20 mm, 15-20 atm) hold the wire and an undersized balloon (2.0 mm in 7 Fr) does not |
| `MP_TRAP_SLIPPERY` | `coronaryWire.ts` | 0.8 | hold multiplier | Polymer-jacketed wires slip more under a trapping balloon (pm-wiring-microcatheters) |
| `MP_TRAP_SLIP_MM`, `MP_TRAP_ELASTIC_MM` | `coronaryWire.ts` | 40, 0.3 | mm | Wire migration with no hold at all, and the give of a held wire |
| `MP_HYDRAULIC_MM`, `MP_HYDRAULIC_LOW_MM`, `MP_HYDRAULIC_ADVANCE_MM` | `coronaryWire.ts` | 0.5, 12, 10 | mm | Hydraulic exchange: migration in range, migration when the pressure is below the range, and how far a polymer-jacketed or stiff-tip wire is driven forward. A pressure above the cited range (above 20 atm) is refused (outcome `pressure-high`, nothing moves) |
| `MP_MC_INJECTION_ML` | `actions/wire.ts` | 2 | mL | Contrast of one selective microcatheter injection |
| `MICRO_NEEDED_STALLS` | `src/ui/lab/pciEvents/wire.ts` | 3 | stalls | The plan's design value for microcatheter-needed (three stalled pushes in the lesion with a workhorse). A stalled push is one stall episode: a push from a free tip (no stored compression) that stalls; the hand steps of one continued push count once |
| `SUBINTIMAL_OFFSET_MM` | `src/ui/pci/render/wire.ts` | 0.4 | mm outside the lumen contour | The plan's design value (r + 0.4 mm) |
| `SUBINTIMAL_SWING_MM` | `render/wire.ts` | 12 | mm per unit of segment stretch | The beat-locked swing of a subintimal wire (the scene gives no cardiac phase; the stretch of the placed segment against its rest length stands in for it). A teaching approximation: the swing is in phase with the segment's stretch, not the phase lag the plan describes |
| `MC_R`, `MC_MU`, `MC_MARKER_MM`, `MC_MARKER_MU` | `render/wire.ts` | 0.43 mm, 0.35, 1 mm, 3.2 | mm, attenuation | Microcatheter tube (about the large type's 0.034 in. tip) and its marker band (the device markers' attenuation in core.ts) |
| `MC_INJECTION_S`, `MC_INJECTION_MG`, `MC_INJECTION_LUMEN` | `render/wire.ts` | 3 s, 220 mg, 0.92 | s, mg, lumen share | How long and how densely a selective injection shows |
| `MC_STAIN_R`, `MC_STAIN_MG` | `render/wire.ts` | 1.6 mm, 90 mg | mm, mg | A subintimal injection's wall stain |

## Scenario values

The wiring pack (`src/simulation/pci/scenarios/packs/wiring.ts`) is synthetic. Its lesion severities, lengths and positions are teaching values; the side branch of lcx-om-tortuous (`sideBranch: OM2, 96 degrees, 1.7 mm`) records the take-off of the second obtuse marginal in that case's own generated tree. The marginal is about 1.7 mm wide there, so the treated lesion is the circumflex just beyond its origin: the PCI tests require a target reference diameter above 2 mm, and the tree generator gives no case id-seeded tree a wide, acutely angled marginal.

## Realism re-capture

The baseline capture set was re-captured after the change as `wp-pwm` (9 October 2026: `__xrayCapture.baseline("wp-pwm")`, `live("pci", "wp-pwm")` on lad-focal, `live("diagnostic", "wp-pwm")`, at a 1600 x 1000 viewport) and scored with `python3 scripts/realism/report.py wp-pwm`: 189 of 236 rows inside the real band, as the baseline. `python3 scripts/realism/compare_sets.py baseline wp-pwm` lists no lost and no gained rows, so no row was re-scored. render/wire.ts leaves core's wire alone for the default tip shape and a true-lumen wire, and draws nothing else without a microcatheter, so the device scenes and live paths of the baseline draw the same tubes.

## Notes after the in-app verification

- Danger zone. `isDanger` in `coronaryWire.ts` compares `MP_DANGER_D` (1.5 mm, unchanged) with the reference (unstenosed) lumen at the tip, not the stenosed lumen, so a wire crossing a tight lesion is no longer taken for a wire in a small distal vessel. The terminal-end test (`MP_DANGER_END_MM`) is unchanged. The distal-push exposure uses the same test, so pushes inside a lesion no longer count as distal exposure.
- Trapping link. The plan names the trapping start `{scenario:'rca-cto', start:'post-crossing'}`. rca-cto has no start of that id; its `wire-across` start (the wire across the occlusion) is the post-crossing state, so `wiring.launch.ts` links `wire-across` for the trapping lessons.
- Held-out variants. The wiring-ladder exam variants XA to XD are, for now, seeds of the same case: `resolveScenario` (`scenarios/generate.ts`) changes only the random draws for a seed, so each variant has the practised lesion. A different task per variant needs per-variant targets in `scenarios/generate.ts` or the ladder catalogue (`src/content/mentor/catalogue.ts`), which this package does not own.
