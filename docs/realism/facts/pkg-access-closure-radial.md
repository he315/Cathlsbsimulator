# access-closure-radial: model parameters

The radial closure of the full case: the band's position, a second band, the finger pleth, the gripped sheath and its rescue, and the late radial problems (`src/simulation/access/closure.ts`), the session (`src/simulation/session/caseSession.ts`) and the radial closure scenarios (`src/simulation/session/scenarios/closureRadial.ts`).

Sourced values carry their module-text location in the code and are not repeated as model parameters: the radial sheath comes out at the end of the case whatever the ACT, with a glycoprotein IIb/IIIa inhibitor or cangrelor running (pm-closure-radial, 'Start with the hardest case', Brilakis 11.2; Oxford); the vasodilator through the side arm mixed 1:1 with blood (step 2; the session's existing SOURCED_DOSES verapamil 2.5 mg and GTN 200 micrograms are used); the band immediately above the puncture, the arterial hole usually proximal to the skin hole, more so at a shallow needle angle, too distal bleeds into the forearm, too proximal at the wrist (step 3; cm-access-complications-radial-bleeding); 10-15 mL as the sheath comes out, deflate to the bleeding point and add back 2-3 mL (step 4); the pleth on the index finger with the ulnar artery compressed, loosen until it returns, the band off at 1-2 hours (step 5); the spasm rescue (vasodilator, intravenously if the side arm will not aspirate; sedation; warmth; a lubricious solution; an upper-arm cuff above systolic for 5 minutes) and never pulling hard because forced removal can avulse the artery (the lesson's 'When things go wrong at the wrist' table, Brilakis 11.2.4 and 29.2.3, Oxford ch 3); a second band against the first for a haematoma just proximal to it (Oxford ch 3); the EASY haematoma grades already in closure.ts (Garg 2019); the radial pseudoaneurysm and sterile granuloma presentations and plans (cm-access-complications-radial-other, Brilakis 29.2.5); tirofiban 25 µg/kg over 3 minutes then 0.15 µg/kg/min (pm-antithrombotics, 03-antithrombotics.ts). Everything below is a MODEL PARAMETER.

## The band (closure.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `MP_BAND_POSITION.flatHalfMm` | 4 | mm | The band presses the hole fully within this distance of its centre marker; the lesson gives the rule ('immediately above the puncture'), not a bladder size |
| `MP_BAND_POSITION.edgeMm` | 5 | mm | Pressure on the hole falls linearly to nothing over this distance beyond the flat part, so a band centred 8 mm off the hole leaves it bleeding at the planned volume (lab request pm-closure#4) |
| `MP_BAND_POSITION.secondBandSpacingMm` | 10 | mm | A second band 'against the first': its centre this far proximal to the first's |
| `MP_BAND_POSITION.visibleSwellingMl` | 4 | mL | Blood under the skin above the band seen as a swelling (raises 'haematoma') |
| `MP_BAND.bleedAntiplatelet` | 0.06 | share of mean arterial pressure | An intravenous antiplatelet infusion raises the band's bleeding threshold, as the ACT and sheath size terms do |
| `radialHoleOffsetMm` | depth / tan(angle) | mm | Geometry of a straight needle from the skin nick to the artery's near wall; the session takes the puncture model's own skin entry and arteriotomy where it has them |
| Bleed site | under the band, forearm (band distal to the hole), wrist (band proximal) | n/a | The lesson's 'too distal ... into the forearm; too proximal ... at the wrist' |
| Radial flow under the band | the highest band pressure against the occlusion threshold, wherever the band sits | n/a | The band presses the artery against the radius under its own centre |
| `plethNow` | trace kept with the ulnar artery open | n/a | With the ulnar artery compressed the finger fills only through the radial (the lesson's check question) |
| `MP_BAND.thresholdSmoothingS` | 10 | s of patient time | MODEL PARAMETER. The bleeding and occlusion thresholds are read from the mean and systolic pressures smoothed by an exponential mean with this time constant (caseSession.ts `bandPressures`, updated in slowTick), not from the beat now, so a band at a threshold holds or loses the finger pleth steadily and two checks at the same volume agree unless the pressure itself drifts. About ten beats; no source gives a value |

## Spasm on removal (closure.ts `MP_RADIAL_CLOSURE`, caseSession.ts)

| Parameter | Value | Unit | Rests on |
|---|---|---|---|
| `gripAt` | 0.9 | tone of the shared spasm model (0-1) | Near the top of the scale, so several of the lesson's causes have to act together (a small artery for the sheath, anxiety, exchanges, no fresh vasodilator); a random case seldom reaches it |
| `lubricantMargin` | 0.05 | tone | A lubricious solution lets the sheath slide at a little more tone |
| `warmRelief` | 0.35 | vasodilator effect (0-1) | Warmth entered as lasting vasodilatation in the spasm model's vasodilator input |
| `cuffRelief`, `cuffTauS` | 0.95, 600 | vasodilator effect; s | Ischaemic vasodilatation after the 5-minute cuff, fading |
| `avulsionMl` | 180-380 | mL | Blood an avulsed radial artery loses into the forearm (EASY grade III by size) |
| `avulsionMin` | 2-8 | min | When the forearm swelling is reported after the closure |
| Side-arm vasodilator time | the order's 25 s (MP_SESSION.drugS) | s | Existing session timing |
| Warming, lubricant, band move | 60, 30, 30 | s | Session step times |
| Waiting counted against 'sheath out now' | only the learner's explicit wait for the ACT at the wrist (waitWithSheathIn, the closure panel's 'Wait 10 min'), with the sheath in and the catheter out; reset when a catheter goes back in. Emergency orders, planning and time between the labs are not counted | s | The femoral closure's 'Wait 10 min' control offered at the wrist too |
| `radial-band-position` correct | within `flatHalfMm` of the hole at the pull | mm | As above |
| `radial-band-time` correct | 1-2 h | h | Step 5 ('Leave the band on for 1-2 hours') |
| Gripped sheath in the RAO risk | counts as 'spasm during the case' (RAO_OR.spasm) | n/a | Existing model parameter |

## Scenarios (closureRadial.ts)

| Setting | Value | Rests on |
|---|---|---|
| Team's PCI time | 60 min | Long enough for the autopilot's verapamil to have faded, so step 2 matters |
| Team's catheter exchanges | 5 | 'Repeated catheter exchanges' as a spasm cause; at the spasm model's exchange cap |
| Patients | 2.1 mm artery, anxiety 0.8-0.9 (7 Fr and flat-needle cases); 2.0 mm, 34-year-old woman, anxiety 0.9 (gripped sheath) | The lesson's spasm causes |
| 7 Fr case ACT | above 300 s, at most 330 s at the start | The lesson's 'ACT above 300 seconds' |
| Flat needle | 15 degrees from the skin | A shallow angle: the hole lies some 12-15 mm above the nick |
| Proximal haematoma: band centred distal to the hole | 8 mm (PROXIMAL_HAEMATOMA_DISTAL_MM), at the lowest 0.5 mL step that keeps a centred band dry without occluding; the learner takes over once the forearm holds visibleSwellingMl | A band off the hole bleeds into the forearm above it (cm-access-complications-radial-bleeding); 8 mm is beyond the flat half-width of the bladder |
| Avulsion at the closure | the forearm set to at least visibleSwellingMl at once and 'haematoma' held; the scheduled major haematoma carries the progression in recovery | So the forearm can be inspected at the closure (pm-engaging lab request 4) |
| Follow-up vignettes (radial-late-psa, radial-late-granuloma) | open at 'closure' (the closure workspace, where the follow-up form is); the start state closes the wrist with the autopilot's clean technique and `setTeamCourseUneventful()`, so the closure draws no delayed events and the reverse Barbeau test is normal | A vignette weeks after a routine case: nothing from the case (an occlusion, a haematoma) competes with the late problem |
| Hand-over lines | logged at the end of the start state (`handOverNote`), after the team's work | So the line is the latest when the closure screen opens |
| Indication | stable angina | A planned case, so nothing competes with the drill (an acute coronary syndrome patient may develop VF during the long team time) |
