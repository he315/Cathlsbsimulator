# diag-scenario-registry: model parameters

The diagnostic scenario registry (`src/simulation/diagnosticScenarios/`) and the scenario script module (`src/ui/sim/modules/script.ts`). The package added one model parameter. Scenario packs that change the patient engine or the pressure line (the `engine` and `fault` steps declared in `diagnosticScenarios/index.ts`) must label their values as their own MODEL PARAMETERS; the core pack sets none. The habitus mapping in `profileFromChart` repeats generatePatient's existing labelled model parameter and is not new.

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `SCRIPT_EVAL_S` | src/ui/sim/modules/script.ts | 0.25 | s of lab time | MODEL PARAMETER: how often the script re-evaluates conditions that read the engine; a quarter of a second is below what an operator notices |
| `DEFAULT_SCENARIO_SEED` | src/simulation/caseGenerator.ts | "1" | seed string | App setting: the seed a scenario opens with when the launch names none |
