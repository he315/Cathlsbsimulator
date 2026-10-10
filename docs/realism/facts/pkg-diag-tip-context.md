# diag-tip-context: model parameters

The diagnostic lab's tip context (`src/ui/lab/diagnosticContext.ts`): the phase, events and route the diagnostic lab reports to the lab tips. The package added no dose, threshold or device dimension. The values below decide when a phase or event is reported; none comes from a source.

Recorded by repair-model-parameter-facts from the code as it stands; the package's build report named the same five.

| Constant | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `ENGAGE_FAIL_S` | src/ui/lab/diagnosticContext.ts | 45 | s of lab time | Model choice. Time at the sinuses or near an ostium (labSession.ts `NEAR_OSTIUM`: sinus level, near the left main or RCA, non-selective) without a selective position before 'engage-fail' is raised. The value of the earlier rule in useLabTips.ts, moved here unchanged |
| `EXCHANGE_WIRE_LEAD` | src/ui/lab/diagnosticContext.ts | 10 | table-strip mm (the store's `controls.wireInsertion`) | Model choice. Wire lead beyond the catheter tip at or above which withdrawing the catheter counts as withdrawing it over the wire (the 'exchange' phase) |
| `EXCHANGE_HOLD_S` | src/ui/lab/diagnosticContext.ts | 5 | s | Model choice. How long the exchange phase is held after the catheter was last seen withdrawn over the wire |
| `EXCHANGE_LOAD_S` | src/ui/lab/diagnosticContext.ts | 15 | s | Model choice. The lab's catheter change is instant; this stands for loading the new catheter over the wire and bringing it to the root. An injection ends it early |
| `NON_COAXIAL_QUALITY` | src/ui/lab/diagnosticContext.ts | 0.5 | engagement quality (0-1, dimensionless) | Model choice. Selective engagement below this quality is reported as 'non-coaxial'. The value of the earlier rule, kept |
