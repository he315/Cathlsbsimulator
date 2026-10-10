# proc-tip-context: model parameters

The full case's tip context: the session's events (`src/simulation/session/caseSession.ts`) and the case tips panel's selection (`src/ui/access/caseTips.ts`). The package added no dose, threshold or device dimension. The two `MP_TIPS` values decide when a patient or radial event is reported; the panel settings are display and ranking settings.

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `MP_TIPS.sampleS` | src/simulation/session/caseSession.ts | 1 | s of session time | MODEL PARAMETER: the patient events are sampled from the vitals at most this often |
| `MP_TIPS.spasmLevel` | src/simulation/session/caseSession.ts | 0.5 | radial spasm level `wire.spasm` (0-1) | MODEL PARAMETER: the level at which a spasm felt on a wire or catheter move in the arm raises 'radial-spasm'; it is the level raoFactors already counts as spasm |
| `CASE_TIP_LIMITS` | src/ui/access/caseTips.ts | per lab: access 5, diagnostic 2, PCI 2, haemodynamic 1; total 7 | tips shown | Display setting, not a clinical value |
| `CASE_TIP_LIMITS_AT_ACCESS` | src/ui/access/caseTips.ts | per lab: access 8, diagnostic 1, PCI 1, haemodynamic 1; total 10 | tips shown | Display setting: at the access workspace the other labs add to the access tips rather than displacing them |
| `STEP_BONUS` | src/ui/access/caseTips.ts | 2 | tip score points | Ranking setting: a site-only access tip scores at most 2.5 without an event and a step tip at least 1 + STEP_BONUS, so the current step's tips rank first |
