# haemo-aortic-stenosis-studies: model parameters

Crossing the stenotic aortic valve and the valve studies in the haemodynamics lab (`src/simulation/haemo/avCrossing.ts`), five aortic stenosis scenarios (`src/simulation/haemo.ts`) and the valve panel (`src/ui/haemo/ValvePanel.tsx`).

Sourced values carry their location in the code and are not repeated as model parameters: the crossing technique and its order of success (an AL1 aiming a straight hydrophilic wire crosses where a pigtail does not; an aortogram's landmark helps; lesson hb-specific-conditions-as, 'Crossing the stenotic valve', Oxford ch 5; Omran 2003), which the probabilities below only reproduce; the gradient methods (hb-specific-conditions-as, 'Measuring the gradient'); the thresholds in `LFLG` (severe at a valve area of 1.0 cm² or less with a mean gradient of 40 mmHg or more; flow reserve as a stroke volume rise of 20% or more; low flow at a stroke volume index of 35 mL/m² or less; hd-valves-as-area and hb-specific-conditions-as, 2025 ESC/EACTS); the CT calcium thresholds in `CT_CALCIUM_AU` (men severe 2000, very specific 3000, unlikely below 1600 AU; women 1200, 1600 and 800; hb-specific-conditions-as, 2025 ESC/EACTS); the peripheral amplification and delayed upstroke of the femoral trace (Academy lesson hd-waveforms-left, 'Aorta').

## Crossing (avCrossing.ts)

None of these is a clinical success rate, and the lab never shows them.

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `CROSS_P_CATHETER` | src/simulation/haemo/avCrossing.ts | AL1 0.4, JR4 0.25, pigtail 0.08 | chance per attempt (before the wire factor) | MODEL PARAMETERS ordered as the lesson orders the catheters |
| `CROSS_P_WIRE` | src/simulation/haemo/avCrossing.ts | straight hydrophilic 1, stiff straight 0.6, standard J 0.3 | multiplier | MODEL PARAMETERS |
| `CROSS_P_AORTOGRAM` | src/simulation/haemo/avCrossing.ts | 1.25 | multiplier | MODEL PARAMETER: once an aortogram has shown where the leaflets open |
| `CROSS_P_FORCEFUL`, `CROSS_P_MAX` | src/simulation/haemo/avCrossing.ts | 1; 0.7 | multiplier; ceiling | MODEL PARAMETERS: forceful pushing does not cross more often |
| `ATTEMPT_SECONDS` | src/simulation/haemo/avCrossing.ts | controlled 15, forceful 10 | s per attempt | MODEL PARAMETER |
| `RISK_SECONDS`, `RISK_PER_FORCEFUL`, `RISK_PER_PASSAGE` | src/simulation/haemo/avCrossing.ts | 120; 0.6; 0.3 | s per risk point; points | MODEL PARAMETERS of the embolic risk score |
| `RISK_RISING`, `RISK_HIGH` | src/simulation/haemo/avCrossing.ts | 1; 2 | risk score | MODEL PARAMETERS: the qualitative bands |
| `QUALITY_PER_FORCEFUL`, `QUALITY_ALLOWANCE_S`, `QUALITY_SECONDS_PER_POINT` | src/simulation/haemo/avCrossing.ts | 15; 90; 3 | points; s; s per point | MODEL PARAMETERS of the manipulation quality (100 less these) |
| `FEMORAL_DELAY_S` | src/simulation/haemo/avCrossing.ts | 0.06 | s | MODEL PARAMETER: the femoral trace's delay behind the central aortic one |
| `FEMORAL_PULSE_AMPLIFICATION` | src/simulation/haemo/avCrossing.ts | 1.12 | factor | MODEL PARAMETER: peripheral pulse amplification |
| `STAGE_SV_REL_TOLERANCE` | src/simulation/haemo/avCrossing.ts | 0.1 | share | MODEL PARAMETER: stroke volume entries in the stage table within 10% |
| `AVA_TOLERANCE` | src/simulation/haemo/avCrossing.ts | = `CALC_TOLERANCE.ava` (0.1 cm²) | cm² | The calculation panel's MODEL PARAMETER (pkg-haemo-study-session-and-tips.md) |

## Scenarios (haemo.ts)

Every pressure, saturation, stroke volume, valve opening, report value and calcium score of these five scenarios is a MODEL PARAMETER, chosen to sit clearly on one side of the sourced thresholds above. None is a measured patient. Pressures in mmHg; calcium in Agatston units.

| Scenario | File | Key values | Sits on this side of |
|---|---|---|---|
| `as-concordant-echo` | src/simulation/haemo.ts | HR 68; LV 206/19 (systolic/EDP); aorta 120/68 | Concordant severe stenosis: no need to cross |
| `as-discordant-cross` | src/simulation/haemo.ts | HR 74; LV 218/21; aorta 124/64; CT calcium 1000 (woman) | Inconclusive non-invasive data with calcium between a woman's thresholds: cross |
| `lflg-true` | src/simulation/haemo.ts | HR 70; LV 130/24; aorta 102/62; echo area 0.8 cm², mean gradient 24, SVI 27 mL/m²; CT calcium 2600 (man); dobutamine stages | True severe low-flow low-gradient stenosis |
| `lflg-pseudo` | src/simulation/haemo.ts | HR 70; LV 125/23; aorta 104/62; echo area 0.8, gradient 22, SVI 26; CT calcium 1100 (man) | Pseudo-severe stenosis |
| `lflg-no-reserve` | src/simulation/haemo.ts | HR 72; LV 120/25; aorta 98/60; echo area 0.8, gradient 22, SVI 27; CT calcium 3200 (man) | No flow reserve; the calcium score above 3000 AU decides |
