# PCI equipment facts: the device catalogue

This file lists every value in `src/simulation/pci/equipment.ts` and where it comes from. Each value is one of four kinds.

1. **Module text.** Written in a lesson of the manual curriculum (`src/content/manual/**`). The lesson id and the place in it are given; the lesson in turn cites Brilakis (Manual of PCI) or the Oxford handbook.
2. **Facts file.** Written in `docs/SIM_FACTS.md` or another file in `docs/realism/facts/`.
3. **Inherited, unverified.** Carried over from the earlier `equipment.ts`, whose header cited FDA labels through a facts file (`C3.md`) that is not in the repository. These values have not been checked against the labels by this package. They stay until a later package opens the labels; until then treat them as unverified.
4. **MODEL PARAMETER.** A teaching value with no claim to a source. Each spec in the code lists its model-parameter fields in `modelParam`.

No value was taken from memory. Where the module text gives a range or a rule and the code needs one number, the number sits inside the range and is marked as a model parameter.

Product names are omitted throughout; devices are named by class.

## Guides

| Quantity | Value in code | Kind | Source |
|---|---|---|---|
| Sizes offered | 5, 6, 7, 8 Fr | Module text | eq-sheaths-guides-extension-device, 'Guide lumens by size (Brilakis Table 30.4)' |
| Inner diameter | 5 Fr 0.058–0.059 in (1.47–1.50 mm); 6 Fr 0.070–0.072 in (1.78–1.83 mm); 7 Fr 0.081 in (2.06 mm); 8 Fr 0.090–0.091 in (2.29–2.31 mm) | Module text | eq-sheaths-guides-extension-device (Table 30.4); pm-wiring-guide-choice, 'French size, lumen and length' |
| Outer diameter | 5 Fr 0.066 in (1.67 mm); 6 Fr 0.079 in (2.0 mm); 7 Fr 0.092 in (2.33 mm); 8 Fr 0.105 in (2.67 mm) | Module text | pm-wiring-guide-choice, 'French size, lumen and length' |
| `GUIDE_ID_IN` | lower end of each printed range | Module text | as above |
| Lengths | 90, 100 (usual), 125 cm | Module text | pm-wiring-guide-choice, 'Length' |
| Side holes | carried as a guide option | Module text (qualitative) | pm-wiring-guide-choice, 'Side holes are a choice, not a default' |
| Shapes | EBU 3.0, 3.5, 3.75, 4.0, 4.5; JL3.5, 4, 5; AL1, AL2; AR1, AR2; JR4; Ikari left and right; Williams right; hockey stick; multipurpose | Module text | pm-wiring-guide-choice, shape table and 'Curve size and the aortic root' (JL made in 3.5, 4, 5 and 6) |
| Back-up ordering | larger French holds more (8 > 7 > 6); extra-backup over JL for the left; AL over JR for the RCA; Oxford's grading: LAD JL3.5/4 least, AL2 middle, XB/EBU 3.5 most; Cx JL4/5 least, AL2 middle, EBU 3.5–4 most; RCA JR4 least, AR1/2 middle, hockey stick or AL1/2 most | Module text | pm-wiring-guide-choice, 'Design choices that set support' and the shape table |
| Back-up ordering (physics) | catheter size, angle on the reverse side of the aorta and contact area set back-up | Facts file | docs/realism/facts/S7.md #15, Ikari 2005 (PMID 16327043, abstract) |
| `backupN` per guide (N) | JL3.5 0.30, JL4 0.26, JL5 0.24; EBU3.0 0.58, EBU3.5 0.62, EBU3.75 0.66, EBU4.0 0.68, EBU4.5 0.70; IKL 0.56; JR4 0.20; AR1 0.32, AR2 0.34; AL1 0.70; AL2 0.48 (left), 0.72 (right, `backupBySide`); IKR 0.50; Williams right 0.28; hockey stick 0.66; multipurpose 0.30 | MODEL PARAMETER | chosen to respect the ordering above; the Ikari left, Ikari right, Williams right and multipurpose have no grading in the sources |
| `curveTurning`, `deepSeatEase` | per guide | MODEL PARAMETER | |
| `MP_FRENCH_BACKUP_EXP` | 1.5 | MODEL PARAMETER | ordering sourced (Oxford 8 F > 7 F > 6 F) |
| `RX_MIN_GUIDE_ID_IN` | 0.056 in; kept in code but not printed on the box, because a 5 Fr guide (0.058 in) meets it while the catalogue asks for 6 Fr for balloons and stents; the box prints "6 F or larger" | Inherited, unverified | earlier header: FDA P070015, P110010 |

## Coronary wires

| Quantity | Value in code | Kind | Source |
|---|---|---|---|
| Categories | workhorse, polymer-jacketed, stiff tip, support, atherectomy, externalisation, pressure | Module text | pm-wiring-wire-choice, 'Brilakis's seven categories' table |
| Kinds | workhorse; polymer (soft, non-tapered); polymer-tapered (tapered and stiff jacketed); cto (stiff tip); support; support-waved; atherectomy; externalisation; pressure | Module text | pm-wiring-wire-choice, the table and 'The other families' |
| Lengths | short 180–190 cm, exchange 300 cm | Module text | pm-wiring-wire-choice, 'Short wires are about 180–190 cm; exchange lengths are 300 cm' |
| Externalisation lengths | 330 and 350 cm | Module text | pm-wiring-wire-choice, table |
| Atherectomy wire | 330 cm, 0.009 in shaft, 0.014 in spring tip | Module text | cp-calcium-rota, 'Components of the rotational atherectomy system' |
| Waved support wire | three waves starting 6 cm from the tip over the next 6 cm, each 3 mm high; not a crossing wire | Module text | pm-wiring-wire-choice, 'Support wires' |
| Crossing rule | waved support: no; atherectomy: discouraged ("possible but hard in practice") | Module text | pm-wiring-wire-choice, 'Atherectomy wires' and 'Support wires' |
| Tip load ranges | workhorse usually 1 g or less; soft non-tapered jacketed about 0.8–2.1 g; stiff jacketed about 1.7–4.1 g | Module text | pm-wiring-wire-choice, table and 'The other families' |
| `tipLoadGf` per kind | workhorse 0.7; polymer 1.0; polymer-tapered 2.5; cto 9; support 1.0; support-waved 0.8; atherectomy 1.2; externalisation 1.0; pressure 1.0 | MODEL PARAMETER | inside the ranges above where a range exists |
| `coating` | per kind | MODEL PARAMETER | categories sourced |
| Lengths other than the sourced ones (polymer-tapered, cto, support, support-waved, pressure) | as in code | MODEL PARAMETER | |
| `CROSSING_WIRE_KINDS` | the kinds whose crossing rule is "yes" | Derived | from the crossing rules above; for a live selector until the engine scores the crossing rule |
| `tipIn` 0.014 | standard | Module text | pm-wiring-wire-choice ('0.014 inch wire') |
| `tipIn` tapered (0.010, 0.009) | | MODEL PARAMETER | |
| Pressure sensor 3 cm from the tip | `sensorMm` 30 | Module text | pm-physiology-setup, 'The wire': sensor about 3 cm from the tip, where the radiopaque tip meets the shaft (Oxford and Brilakis) |
| Friction, stiffness, support, injury, branch-seeking, opaque coil length | per kind | MODEL PARAMETER | the higher injury of polymer-jacketed and stiff tips is sourced qualitatively (pm-wiring-wire-choice) |

## Balloons

| Device (id) | Value in code | Kind | Source |
|---|---|---|---|
| Semi-compliant (sc) | nominal 6 atm, RBP 14 atm, lengths 6–30 mm, profile 0.031 in at 3.0 mm | Inherited, unverified | earlier header: FDA K211349 |
| | growth 1.25% per atm (`MP_SC_FRAC_PER_ATM`); profile scaled by √(d/3) | MODEL PARAMETER | |
| Non-compliant (nc) | nominal 12 atm, RBP 20 atm (2–4 mm), growth 0.8% per atm (`NC_FRAC_PER_ATM`), deflation ≤ 15 s | Inherited, unverified | earlier header: FDA P200041 SSED, K222538 |
| | RBP 18 atm above 4 mm | MODEL PARAMETER | |
| | less deliverable than semi-compliant (higher profile, less flexible) | Module text | eq-balloons-stents-cart-standard, compliance table (Brilakis 19.9.3) |
| Scoring (spiral) | nominal 12, RBP 20 | Inherited, unverified | as nc |
| | no slow inflation needed; less deliverable | Module text | eq-balloons-stents-cart-specialty, plaque modification table |
| Lithotripsy (ivl) | 2.5, 3.0, 3.5, 4.0 mm × 12 mm; 0.014 in wire; 6 Fr; 138 cm; crossing profile 0.043 in (2.5 mm) to 0.046 in (4.0 mm); 80 pulses per catheter | Module text | cp-calcium-ivl, 'The coronary lithotripsy catheter as printed' |
| | pulses at 4 atm or less, nominal 6 atm, RBP 10 atm, 10 pulses per cycle | Facts file | docs/SIM_FACTS.md §16 |
| | profile linear between the printed end values; growth 0.4% per atm | MODEL PARAMETER | |
| Small (small) | 1.0, 1.25, 1.5 mm; single central marker, thickest at the marker; longer balloons (20–30 mm) help; lose profile after inflation | Module text | eq-balloons-stents-cart-standard, 'Small balloons for crossing' table and 'Profile' list |
| | pressures 6/14 atm, chart, profile, profile loss factor 1.25 | MODEL PARAMETER | |
| Microdilation catheter (microdilation) | 1.20 × 12 mm; entry profile 0.017 in; crossing profile 0.024 in | Module text | eq-balloons-stents-cart-standard, 'Profile' list |
| | pressures, chart, profile loss factor | MODEL PARAMETER | |
| Over-the-wire (otw) | over-the-wire shaft; pushes less well than rapid exchange; allows wire exchange and contrast; too bulky to trap in a 6 Fr guide | Module text | eq-balloons-stents-cart-standard ('From the hub to the tip', 'Profile'); eq-balloons-stents-cart-cart, compatibility table |
| | sizes, pressures, chart, profile; trapping from 7 Fr | MODEL PARAMETER | 6 Fr is stated too small; 7 Fr is the next size, not a stated value |
| Cutting (cutting) | blades 0.005 in; about 1 atm every 5 s (`maxInflateAtmPerS` 0.2); usually 6–8 atm; RBP 12 atm (Brilakis 9.7.9; 14 atm in 23.2.3); high profile | Module text | eq-balloons-stents-cart-specialty, plaque modification table; cp-calcium-balloons |
| | nominal 6 atm (low end of 6–8), sizes, chart, profile | MODEL PARAMETER | |
| Wire-alongside scoring (scoring-wire) | 0.6 mm, 5 mm long; nominal 25 atm; RBP 30 atm | Module text | eq-balloons-stents-cart-specialty, plaque modification table |
| Very-high-pressure (vhp) | twin-layer non-compliant; usually 30–35 atm; RBP 35 atm (2010 case report); more than 40 atm possible; rupture risk 2–3% | Module text | eq-balloons-stents-cart-specialty, 'Very-high-pressure and lithotripsy balloons' |
| | nominal 10 atm; growth 0.4% per atm; sizes | MODEL PARAMETER | |
| Drug-coated (dcb) | paclitaxel or sirolimus; devices differ | Module text | eq-balloons-stents-cart-specialty, 'Drug-coated, trapping and ostial balloons' |
| | sizes, pressures, chart | MODEL PARAMETER | |
| Trapping (trap) | 2.5 mm for 6–7 Fr, 3.0 mm for 7–8 Fr; 20 mm or longer; 15–20 atm; no wire lumen | Module text | eq-balloons-stents-cart-specialty, 'Trapping balloons'; pm-wiring-microcatheters, 'Trapping a microcatheter' |
| | nominal 8 atm; RBP 20 atm (top of the trapping range); usable 115 cm | MODEL PARAMETER | |
| Ostial flaring catheter (flare) | anchoring balloon up to 14 mm with a 1 mL syringe; distal balloon 8 mm long, 3.0–4.5 mm; three markers | Module text | eq-balloons-stents-cart-specialty, 'Dual-balloon ostial flaring catheter' |
| | pressures, chart, minimum guide | MODEL PARAMETER | |
| Unfolding below the chart (folded shape by about 2 atm) | `chartDiameter` | MODEL PARAMETER | |

Engine behaviour: each catalogue balloon type (`balloonType`) maps onto one of the four engine kinds (`balloon`): cutting and wire-alongside scoring act as scoring; very-high-pressure and flaring as non-compliant; the rest as semi-compliant. The four standard specs stay first in the list, so `deviceFor()` still returns them.

## Stents and covered stents

| Device (id) | Value in code | Kind | Source |
|---|---|---|---|
| Drug-eluting stent (des) | compliance chart 2.5–4.0 mm (Table 14-1), nominal 8/9 atm, RBP 16 atm, dilatation limits 3.5 and 4.5 mm, deflation 16–21 s | Inherited, unverified | earlier header: FDA P070015, P110010 |
| | largest 5.0 mm, expandable to 5.75 mm (the limit for 5.0 mm); longest 60 mm in Europe, 40 mm in the US; shafts 140–145 cm | Module text | eq-balloons-stents-cart-stent-build, 'Size facts' table (Brilakis 10.1, 10.2, 22.3) |
| | 2.25, 4.5, 5.0 mm charts; dilatation limit 5.75 mm applied to the 4.5 mm stent (sourced only for 5.0 mm); lengths 33–48 mm (inside the sourced 60 mm); profile | MODEL PARAMETER | |
| Covered, two-layer PTFE (covered) | diameters 2.8, 3.5, 4.0, 4.5, 4.8 mm only; lengths 16, 19, 26 mm; 6 Fr for 2.8–4.0 mm, 7 Fr for 4.5 and 4.8 mm; at least 15 atm (nominal); shortens up to 1.6 mm at each end; with a blocking balloon through an 8 Fr guide | Module text | cm-perforation-large-vessel, covered stent comparison table; eq-balloons-stents-cart-cart, compatibility table |
| | RBP 18 atm; chart; dilatation limit 5 mm; profile; deflation 21 s | MODEL PARAMETER | |
| Covered, single-layer polyurethane (covered-pu) | diameters 2.5–5.0 mm in 0.5 mm steps; lengths 15, 20, 26 mm; 5 Fr for 2.5–4.0 mm, 6 Fr for 4.5 and 5.0 mm; post-dilatable to 3.50, 4.65 and 5.63 mm; can come off its balloon | Module text | cm-perforation-large-vessel; eq-balloons-stents-cart-stent-build |
| | nominal 11 atm; RBP 16 atm; chart; profile | MODEL PARAMETER | |

The earlier covered stent (3.0–4.5 mm, 6 F up to 3.5 mm, 14 atm, cited to FDA H000001) was replaced by the two designs above, because the module text gives different diameters, guide sizes and pressure.

## Microcatheters

| Quantity | Value in code | Kind | Source |
|---|---|---|---|
| Categories | large, small, angulated (fixed 45, 90 or 120 degree tips), deflectable, dual-lumen, plaque modification | Module text | pm-wiring-microcatheters, 'Microcatheter categories (Brilakis 30.6)' |
| Deflectable tip | up to 90 degrees, 2.5 mm radius; fits 6 Fr; trapping or parallel wiring needs 8 Fr (`trapMinFrench` 8) | Module text | as above |
| Plaque modification | advance anticlockwise, withdraw clockwise, no more than 20 turns; no contrast | Module text | as above |
| Wire | 0.014 in | Module text | pm-wiring-microcatheters, 'What a microcatheter does for you' |
| Lengths | 135 and 150 cm | Module text | eq-sheaths-guides-extension-device, trapping version ('135 cm microcatheters'; '150 cm ... often too long') |
| Trapping in 6 Fr | low-profile microcatheters can be trapped in 6 Fr guides with a 0.071 in lumen | Module text | eq-balloons-stents-cart-cart, compatibility table |
| Tip outer diameter and lumen | large 0.034/0.018 in; small 0.026/0.016; angulated 0.031/0.017; deflectable 0.038/0.017; dual-lumen 0.042/0.017; plaque modification 0.029/0.015 | MODEL PARAMETER | the box shows them as teaching values |
| Stiffness, minimum guide (other than the deflectable type) | | MODEL PARAMETER | |

## Guide extensions

| Quantity | Value in code | Kind | Source |
|---|---|---|---|
| Inner diameters (`EXTENSION_ID_IN`, `EXTENSION_ID_MM`) | 5 Fr 0.041–0.046 in (1.04–1.17 mm); 5.5 Fr 0.051 in (1.30 mm); 6 Fr 0.056–0.057 in (1.42–1.45 mm); 7 Fr 0.062–0.063 in (1.57–1.60 mm); 8 Fr 0.071–0.072 in (1.80–1.83 mm) | Module text | eq-sheaths-guides-extension-device, 'Inner diameters of guide extensions by size (Brilakis Table 30.5)' |
| Catheter-in-catheter (5 in 6) | 0.059 in (1.50 mm); 120 cm, 5 Fr through a 6 Fr guide | Module text | as above, and 'The device' |
| Cylinder | 25 cm in most designs, 40 cm in some; 13 cm in the trapping version; usable 145–150 cm (code: 150) | Module text | eq-sheaths-guides-extension-device, 'The device' |
| Trapping version | 6–8 Fr; best with 135 cm microcatheters; the 8 Fr size lets an orbital crown be trapped | Module text | as above, and 'What fits' |
| Matching | an extension is matched to the guide ('a matched 6 Fr extension'); it leaves a lumen about two French smaller | Module text | eq-sheaths-guides-extension-use (drill: 'add a matched guide extension'); case eq-sheaths-guides-case-stuck-stent; eq-sheaths-guides-extension-device |
| 5.5 Fr extension goes into a 6 Fr guide | `minFrench` | MODEL PARAMETER | |
| Inner diameters of the trapping version | taken as Table 30.5 for the same size | MODEL PARAMETER | |
| Sizes not in Table 30.5 | `extensionInnerDiameterIn` throws; `lumenLeftMm` returns 0, so `fitsThrough` passes nothing | Rule | no other row's value is substituted |
| Profile, stiffness | | MODEL PARAMETER | |

## Aspiration, imaging, atherectomy and laser

| Device (id) | Value in code | Kind | Source |
|---|---|---|---|
| Aspiration (aspiration) | 6 and 7 Fr; 7 Fr needs a 7 Fr guide; a 6 Fr catheter will not go into a 6 Fr guide that holds a buddy wire; dual lumen with a locking vacuum syringe; can damp a 6 Fr guide | Module text | cp-acs-thrombus-aspiration, aspiration catheter list |
| | profile, stiffness, usable length | MODEL PARAMETER | |
| Rotational IVUS (ivus) | flush first; lower profile; higher resolution; length on a motorised pullback; pullback 0.5–1.0 mm/s (Oxford), usually 1–10 mm/s (Brilakis) | Module text | pm-imaging-ivus, 'The two IVUS catheter families' and the pullback step |
| | 40–60 MHz | Module text | pm-imaging-when-which, rotational IVUS |
| Phased-array IVUS (ivus-phased) | no preparation; harder to deliver; lower resolution (20 MHz example); jumps | Module text | pm-imaging-ivus |
| | short-tip version 2.5 mm from the tip | Module text | pm-imaging-when-which, solid-state IVUS |
| OCT (oct) | guide usually 6 Fr or larger for a hand injection, 5 Fr needs a power injector (`guideHandInjectionMinFrench` 6); 36 mm/s (75 mm) and 18 mm/s (54 mm) pullbacks | Module text | pm-imaging-oct, 'Before you start' and 'The two acquisition modes' |
| Imaging catheter profiles, stiffness, minimum guide, usable length | | MODEL PARAMETER | rotational below phased-array is sourced as an order |
| Rotational burr (rota) | eight sizes 1.25, 1.5, 1.75, 2.0, 2.15, 2.25, 2.38, 2.5 mm; diamonds on the leading edge only | Module text | cp-calcium-rota, 'Components of the rotational atherectomy system' |
| | 1.25–1.75 mm through 6 Fr, 2.0 mm at least 7 Fr, 2.15–2.25 mm at least 8 Fr (`burrMinFrench`) | Module text | cp-calcium-setup (Table 19.1); cp-calcium-rota |
| | 2.38 and 2.5 mm: no 5–8 Fr guide (minimum `null`) | Derived | neither fits the 2.29–2.31 mm lumen of an 8 Fr guide (Table 30.4); the module text gives no guide for them |
| | speed 135,000–180,000 rpm | Facts file | docs/SIM_FACTS.md §15 |
| Orbital crown (orbital) | eccentric 1.25 mm crown; 6 Fr compatible; 80,000 and 120,000 rpm, glide 5,000 rpm; trapped with a balloon in 7 or 8 Fr, not 6 Fr, not alongside a standard extension; through an 8 Fr trapping extension it can be | Module text | cp-calcium-orbital, device table; cp-calcium-setup (Table 19.2) |
| Laser (laser) | 0.9, 1.4, 1.7, 2.0 mm; 0.9 mm compatible with 6 Fr and nearly always used; 25–80 Hz; 30–80 mJ/mm²; 10 s on, 5 s off; console warm-up about 5 minutes | Module text | cp-calcium-laser, 'The laser system'; cp-calcium-setup, 'The team' |
| | minimum guide for 1.4–2.0 mm (`laserMinFrench`): the smallest guide whose Table 30.4 lumen (lower end) is at least the catheter diameter, with no clearance allowance, never below 6 Fr (1.4 and 1.7 mm 6 Fr, 2.0 mm 7 Fr); none (`null`) when no 5–8 Fr guide takes it | MODEL PARAMETER (derived) | |
| Stiffness and usable lengths of these devices | | MODEL PARAMETER | |

## Retrieval and bail-out devices

| Device (id) | Value in code | Kind | Source |
|---|---|---|---|
| Coronary snare (snare-coronary) | 2–4 mm; three-loop preferred; keep the collapsing tool | Module text | eq-balloons-stents-cart-cart, compatibility table |
| | steps 2, 3, 4 mm; profile; minimum guide | MODEL PARAMETER | |
| Aortic snare (snare-aortic) | 18–30 mm or 27–45 mm | Module text | as above |
| Sheath-delivered filter (epd-sheath) | two sizes 2.25–3.5 and 3.5–5.5 mm; landing zone 25 or 30 mm; 6 Fr; 110 µm pores; crossing profile 3.2 Fr; wires 190 and 300 cm | Module text | cp-prior-cabg-epd, 'The two filters' |
| Over-the-wire filter (epd-otw) | at least 6 Fr; land 4–5 cm beyond the lesion; capture wire 190 cm or 320/190 cm; sizes 3, 4, 5, 6, 7 mm against vessel ranges (Table 18.1, `OTW_FILTER_RANGES`) | Module text | cp-prior-cabg-epd, 'The two filters' and 'Sizing the over-the-wire filter' |
| Coils (coil-014, coil-018) | 0.014 in coils pass through standard CTO microcatheters; 0.018 in coils need a larger microcatheter (about 2.4–2.5 Fr); detachable coils retrievable until released | Module text | eq-balloons-stents-cart-cart; pm-wiring-microcatheters |
| | coil diameters, minimum guide | MODEL PARAMETER | |
| Re-entry balloon (reentry) | flat 2.5 × 10 mm, two opposed side ports, 4 atm; too large to trap in 6 Fr | Module text | eq-balloons-stents-cart-cart, 'More on the rescue devices' and compatibility table |
| | RBP 6 atm; chart; profile; trapping from 7 Fr | MODEL PARAMETER | |
| Crossing catheter (reentry-crossing) | 1 mm blunt, rounded, hydrophilic tip, spun rapidly | Module text | eq-balloons-stents-cart-cart, 'More on the rescue devices' |

## Box label and expiry

- Every box prints its use-by date. The default (`MP_DEFAULT_USE_BY`, 2028-06-30) is a MODEL PARAMETER; a scenario plants its own date through `boxLabel(..., { useBy })`. Whether a box has expired on the case date is returned as `expired` for the engine and the debrief, and is not printed: the learner reads the date. Checking dates is sourced as a cart task (eq-balloons-stents-cart-cart, 'Check presence, stock and dates').
- Inflatable devices print nominal and rated burst pressure, with the compliance chart. The chart note says whether the chart was carried from a published label or is a teaching model. Because the label chart is inherited and unverified (C3.md is not in the repository), the note reads "In vitro chart carried from a published label (to be re-verified); lesion resistance not included" until a package re-verifies the FDA P070015 Table 14-1 rows; the chart keeps source `ifu`.
- The guide line prints the device's minimum French size as "N F or larger" for every class.

## Compatibility rules in code

- `fitsThrough`: the guide must be at least the device's minimum French size; through an extension, the extension must fit the guide (matched or smaller) and the device's crossing profile, or the diameter of a rigid device, must not exceed the extension's bore (lower end of Table 30.5). The rule reproduces the module text's examples: a 1.5 mm burr does not pass a 6 Fr extension (1.42 mm), a 1.25 mm burr does, and a 1.5 mm burr passes a 7 Fr extension (1.57 mm). Using the crossing profile for non-rigid devices is a MODEL PARAMETER.
- `trappingBalloonFor`: 2.5 mm for 6–7 Fr, 3.0 mm for 7–8 Fr (module text).
- `canTrapIn`: the device's trapping minimum where the text gives one; orbital crown as above.

## Tip vocabulary

`deviceTipEvents` maps the active device onto events of `src/content/lab/tips.ts`: rotational and orbital atherectomy while running, laser while lasing, lithotripsy while inflated, an extension, a deployed filter and a snare while in the artery, a balloon stalled at the lesion (balloon-uncrossable), a balloon with a waist at or above its rated burst pressure (balloon-undilatable), and a stent with a waist after an earlier inflation or at or above its nominal pressure, never while still being inflated towards nominal (stent-underexpanded). `deviceImaging` gives the imaging modality. These are definitions, not sourced values.
