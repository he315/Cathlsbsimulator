# proc-foundation-scenarios-ledger: model parameters

The full case's scenario registry, start states and decision ledger. The only model parameters it added are settings of the autopilot (`src/simulation/session/autopilot.ts`), which plays the case forward with clean technique to a scenario's start stage. They are not clinical values and the learner never sees them. The thresholds the autopilot obeys are the sourced ones already in closure.ts (`FEMORAL.actForSheathPullStrictS`, 160 s) and the session's `SOURCED_DOSES.bandHours`.

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| Femoral ACT wait (`waitForFemoralAct`) | src/simulation/session/autopilot.ts | 600 s between ACT measurements, at most 24 rounds (a 4 h cap) | s; rounds | MODEL PARAMETER (autopilot setting). The autopilot never pulls a femoral sheath on a high ACT; past the cap it stops with an AutopilotError |
| Starting band volume (`closeRadial`) | src/simulation/session/autopilot.ts | 15, then 1 mL steps (add on bleeding, remove on a class D pleth), at most 24 checks | mL | MODEL PARAMETER (autopilot setting): the closure panel's existing default inflation, adjusted from the pleth |
| `NAV_TICKS_PER_STEP` | src/simulation/session/autopilot.ts | 300 | frames of wire driving | Autopilot setting: how often a stepped run yields so a caller can let the page paint |
