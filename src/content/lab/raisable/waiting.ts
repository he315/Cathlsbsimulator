// ===========================================================================
// Lab tips that no lab can show yet, and the trigger edits that wait for a later package.
//
// Written by found-tip-retarget; only found-tip-retarget, tip-retarget-catchup,
// content-links-backfill-p2 and repair-launch-fixture-and-tip-ties (the cold-leg move) edit this file. reachability.test.ts reads it together with the
// `raises` export of every lab's event source and tip-context file: a tip that no lab can satisfy
// must be listed here, an entry whose names are now raised is reported as ready, and an entry
// naming a tip that no longer exists is reported as stale (a warning, not a failure).
//
// Two kinds of entry, both keyed by the package of docs/curriculum/lab-build-plan.json expected to
// raise the names they need:
//   WAITING_TIPS        tips waiting on their current trigger;
//   DEFERRED_RETARGETS  trigger edits the lessons asked for whose names no lab raises before the end
//                       of phase 1. tip-retarget-catchup applies the ready entries with a P1 raiser,
//                       content-links-backfill-p2 those with a P2 raiser, each under the superset
//                       guard of src/content/lab/retarget.test.ts.
// The raiser named for a tip is the latest-landing package among those that raise its phase,
// procedure, route, technique, one of its events and every required event, as the plan describes
// them. It is planning data, not a declaration of what a lab raises: that is each lab's own
// `raises` export.
// ===========================================================================

import type { AccessRoute, BifTechnique, ImagingModality, LabEvent, LabId, LabPhase, LabProcedure, TipTrigger } from "../tips";

/**
 * What one event source or tip-context file can report, exported from it as `raises` (a single
 * object or an array, one per lab it reports for). For a PCI event source it is derived from the
 * file's PCI_EVENT_SOURCES and the phases it sets, so the declaration cannot drift from the code.
 */
export interface LabRaises {
  lab: LabId;
  phases: readonly LabPhase[];
  events: readonly LabEvent[];
  techniques?: readonly BifTechnique[];
  imaging?: readonly ImagingModality[];
  procedures?: readonly LabProcedure[];
  routes?: readonly AccessRoute[];
}

/** Tips that wait, on their current trigger, for the package that will raise what they need. */
export interface WaitingTips {
  /** id of the package in docs/curriculum/lab-build-plan.json */
  raisedBy: string;
  lab: LabId;
  tips: readonly string[];
  note?: string;
}

/** A trigger edit requested by a lesson and recorded until its names are raised. */
export interface DeferredRetarget {
  tipId: string;
  /** the complete new trigger, replacing the tip's current one */
  when: TipTrigger;
  /** id of the package in docs/curriculum/lab-build-plan.json that raises the new names */
  raisedBy: string;
  note?: string;
}

export const WAITING_TIPS: readonly WaitingTips[] = [
  {
    raisedBy: "diag-tip-context",
    lab: "diagnostic",
    tips: [
      "diag-rad-c-arm-clear", "diag-rad-grainy-image-flatten", "diag-rad-pregnancy-check",
      "diag-rad-read-the-dose-panel", "diag-rad-pedal-discipline", "diag-rad-fluoro-rate-default",
      "diag-rad-low-magnification", "diag-rad-lead-check", "diag-rad-shield-low-close",
      "diag-rad-step-back-for-cine", "diag-operator-review-the-runs", "diag-operator-moderate-lesion-measure",
      "diag-safe-ergonomic-setup", "diag-lv-gram-mid-cavity", "diag-lv-gram-injector", "diag-lv-gram-test-injection",
      "diag-lv-gram-clean-cycle", "diag-lv-gram-views", "diag-lv-pullback-over-wire", "diag-aortogram-setup",
      "diag-aortogram-anomalous-origin", "diag-lvgram-catheter-induced-mr", "diag-aortogram-ar-grading",
      "diag-post-ward-handover", "diag-post-radiation-record", "diag-post-sedated-results",
      "diag-bg-wall-to-territory", "diag-bg-name-view-first", "diag-bg-depth-second-view",
      "diag-bg-secondary-mi-question", "diag-bg-minoca-working", "diag-bg-contrast-heart-failure",
      "diag-aorto-ostial-views", "diag-lm-damping-causes", "diag-lm-short-injections", "diag-graft-op-note-first",
      "diag-graft-radial-convert", "diag-svg-jr4-after-rca", "diag-svg-right-graft-lao", "diag-svg-left-sweep",
      "diag-svg-damped", "diag-svg-views", "diag-svg-long-run", "diag-ima-subclavian-first", "diag-lima-engage",
      "diag-ima-tortuous", "diag-ima-gentle-injection", "diag-lima-views", "diag-lima-not-engaged",
      "diag-rima-engage", "diag-radial-graft-spasm", "diag-stemi-predict-artery", "diag-stemi-radial-convert",
      "diag-rv-infarct-no-nitrate", "diag-lv-gram-post-mi-shock", "diag-minoca-lv-gram", "diag-vf-catheter-cause",
      "diag-tavr-left-catheter", "diag-tavr-rca-wide-sinus", "diag-dissection-diagnostic-catheter",
      "diag-stemi-during-cath", "diag-air-small-bubble", "diag-exchange-over-wire", "diag-finish-neuro-check",
      "diag-lvedp-before-lv-gram", "diag-oedema-on-table", "diag-lv-gram-tamponade", "diag-hypo-amplatz-valve",
      "diag-hypo-after-vasodilator", "diag-vagal-sequence", "diag-caki-prepare", "diag-planning-check-in",
      "diag-planning-pde5-nitrate", "diag-planning-contrast-allergy", "diag-planning-ad-hoc-consent",
      "diag-planning-resuscitation-status", "diag-mon-store-loop", "diag-delay-heparin-tortuous-arm",
      "diag-sedation-titrate", "diag-nitrate-dose-by-pressure", "diag-vf-shock-then-amiodarone",
      "diag-bradycardia-atropine-or-pace", "diag-contrast-ceiling-two-rules", "diag-reaction-or-vagal",
      "diag-root-manifold-ready", "diag-root-air-in-line", "diag-root-prep-outside",
      "diag-root-match-curve-to-route", "diag-root-previous-catheters", "diag-root-wire-leads",
      "diag-root-wire-out-of-ventricle", "diag-root-backbleed-guide", "diag-root-resistance-transduce-image",
      "diag-root-descending-aorta-breath", "diag-root-lusoria-change-artery", "diag-aspirate-before-engaging",
      "diag-test-puff-then-recheck", "diag-damped-stepwise", "diag-ventricularised-stay-out",
      "diag-jl-femoral-wire-loop", "diag-tig-left-anticlockwise", "diag-short-lm-size-up", "diag-jr-two-hand-torque",
      "diag-rca-dive-back-out", "diag-conus-withdraw", "diag-shepherds-crook-shapes", "diag-engage-fail-ladder",
      "diag-dilated-root-sizing", "diag-small-root-shorter-jl", "diag-radial-exchange-long-wire",
      "diag-acq-read-test-puff", "diag-acq-table-up-detector-down", "diag-acq-high-dose-adjust",
      "diag-acq-frame-then-pedal", "diag-acq-breath-hold", "diag-acq-catheter-backs-out",
      "diag-acq-complete-view-set", "diag-acq-ostium-views", "diag-acq-small-rca-small-volume",
      "diag-acq-dominance-follow-pda", "diag-acq-missing-territory", "diag-interp-orthogonal-worst-view",
      "diag-interp-ostium-from-outside", "diag-interp-nitrate-before-fixed", "diag-interp-every-territory",
      "diag-review-previous-films", "diag-stop-for-heart-team", "diag-ad-hoc-pause", "diag-stemi-engagement-order",
      "diag-culprit-not-obvious", "diag-phys-qfr-acquisition",
    ],
  },
  {
    raisedBy: "proc-tip-context",
    lab: "access",
    tips: [
      "access-post-pulses-start-end", "access-post-radial-obs", "access-post-femoral-mobilise",
      "access-bg-pulses-both-groins", "access-bg-axillofemoral", "access-bg-aaa-thrombus",
      "access-stemi-femoral-sheath", "access-shock-femoral-and-vein", "access-arrest-radial-spasm",
      "access-vasovagal-or-tamponade", "access-vagal-prevention", "access-bleed-endovascular-control",
      "access-cx-groin-haematoma-press", "access-cx-iliac-wire-fluoro", "access-cx-rp-in-lab",
      "access-cx-iliofemoral-balloon-first", "access-cx-small-branch-embolise", "access-cx-psa-size-and-neck",
      "access-cx-arterial-sheath-first", "access-cx-radial-band-proximal",
      "access-cx-forearm-haematoma-grade", "access-cx-radial-perforation-cover", "access-cx-radial-loop-bat",
      "access-cx-compartment-call", "access-sheath-plan-size", "access-sheath-ooze-upsize",
      "access-sheath-femoral-length-tip", "access-sheath-radial-long-caution", "access-sheath-sheathless-option",
      "access-sheath-sheathless-spasm", "access-planning-site-history", "access-planning-closure-infection",
      "access-planning-hostile-groin", "access-planning-anticoagulated", "access-mon-pulses-site",
      "access-radial-heparin-timing", "access-femoral-sheath-act", "access-anticoagulated-go-radial",
      "access-crossover-anticoagulated-care", "access-site-five-steps", "access-cabg-left-radial",
      "access-complex-pci-femoral", "access-needle-flashback-check", "access-wire-never-push",
      "access-sheath-two-syringes", "access-femoral-head-marker", "access-femoral-scan-bifurcation",
      "access-femoral-deep-move-caudal", "access-femoral-vein-redirect", "access-femoral-screen-micro-wire",
      "access-femoral-repuncture-wrong-height", "access-femoral-sheath-angiogram", "access-radial-one-ml-local",
      "access-radial-puncture-spasm", "access-radial-wire-resists", "access-radial-thin-sheath-vasodilator",
      "access-distal-radial-angle", "access-artery-vein-same-groin", "access-dilator-will-not-pass",
      "access-no-waveform-sheath", "access-root-sheath-aspirate-flush", "access-root-no-hydrophilic-through-needle",
      "access-root-femoral-no-waveform", "access-root-iliac-long-sheath", "access-root-aneurysm-suspect",
      "access-radial-spasm-no-traction", "access-closure-sheath-stays", "access-closure-device-criteria",
      "access-closure-high-stick", "access-closure-reprep-skin", "access-compression-prepare",
      "access-compression-hands-above", "access-compression-bleeding", "access-compression-vasovagal",
      "access-closure-hypotension-retroperitoneal", "access-plug-locator-drip",
      "access-plug-no-tamp-before-resistance", "access-plug-size-to-sheath",
      "access-suture-45-foot", "access-suture-keep-wire", "access-suture-loose-second-device",
      "access-radial-remove-now", "access-radial-band-inflation", "access-radial-patency-check",
      "access-radial-band-bleeding",
    ],
  },
  {
    raisedBy: "haemo-study-session-and-tips",
    lab: "haemo",
    tips: [
      "haemo-setup-manifold-check", "haemo-rhc-flush-and-watch", "haemo-rhc-apex-to-pa",
      "haemo-rhc-wedge-inspiration", "haemo-lhc-u-loop", "haemo-lhc-stenotic-valve", "haemo-lhc-lvedp-point",
      "haemo-co-say-how", "haemo-co-index-it", "haemo-pvr-right-pressures", "haemo-hypotension-pattern",
      "haemo-shunt-mixed-venous", "haemo-shunt-asd-cross", "haemo-shunt-vsd-simultaneous",
      "haemo-as-cross-only-if-discordant", "haemo-as-al1-straight-wire", "haemo-as-simultaneous-gradient",
      "haemo-ms-wedge-lv-ten-beats", "haemo-constriction-simultaneous-lv-rv", "haemo-constriction-check-ventilation",
      "haemo-hocm-pullback-second-catheter", "haemo-hocm-provoke-valsalva-gtn", "haemo-hocm-post-ectopic-aorta",
      "haemo-hocm-hypotension-phenylephrine", "haemo-pe-venous-access-clot", "haemo-pe-pa-pressure-limit",
      "haemo-pulmonary-angiography-protocol", "haemo-asa-pacing-first", "haemo-bg-af-in-lab",
      "haemo-post-mi-shunt-run", "haemo-v-wave-not-specific", "haemo-shock-measure-first",
      "haemo-as-slow-rise-not-damping", "haemo-wedge-oedema-risk", "haemo-mon-zero-level", "haemo-mon-fast-flush",
      "haemo-support-rhc-thresholds", "haemo-support-cpo-papi",
    ],
  },
  {
    raisedBy: "pci-tip-context",
    lab: "pci",
    tips: [
      "pci-rad-read-the-ct-first", "pci-rad-shallow-working-view", "pci-rad-collimate-check-edges",
      "pci-operator-know-your-level", "pci-operator-help-early", "pci-operator-check-the-device",
      "pci-operator-log-the-case", "pci-operator-one-target", "pci-operator-debrief-after-complication",
      "pci-operator-cto-kit-before-start", "pci-operator-cto-second-operator", "pci-safe-capture-the-facts",
      "pci-safe-count-every-attempt", "pci-safe-scribe-the-timeline", "pci-safe-dose-incident-check",
      "pci-safe-state-check", "pci-safe-pause-after-major-event", "pci-safe-name-what-could-go-wrong",
      "pci-safe-control-the-controllable", "pci-safe-cto-stop-rules", "pci-post-report-stents",
      "pci-post-ecg-complex", "pci-post-ecg-bifurcation", "pci-post-chest-pain-ward", "pci-post-contrast-kidney",
      "pci-post-dapt-plan", "pci-post-oac-clopidogrel", "pci-post-bleeding-dapt", "pci-post-complication-candour",
      "pci-post-radiation-follow-up", "pci-bg-lipid-embolisation-forecast", "pci-bg-surgery-adherence",
      "pci-ostial-plan-hit-and-run", "pci-ostial-damped-wire-and-off", "pci-ostial-side-hole-limits",
      "pci-ostial-ivus-not-oct", "pci-ostial-balloon-straddle", "pci-ostial-watermelon", "pci-ostial-undilatable",
      "pci-ostial-rota-coaxial", "pci-ostial-orbital-constrain", "pci-ostial-distal-first",
      "pci-ostial-guide-stent-unit", "pci-ostial-guide-lost", "pci-ostial-protrude-1-2", "pci-ostial-deploy-ready",
      "pci-ostial-flare-reengage", "pci-ostial-final-reflux", "pci-ostial-missed-ostium", "pci-ostial-szabo",
      "pci-ostial-overhang-flare", "pci-ostial-stent-underexpanded", "pci-branch-wire-both",
      "pci-branch-angulated-wiring", "pci-branch-prep-protect-mv", "pci-branch-angle-choice",
      "pci-branch-tstent-marker", "pci-branch-minicrush-proximal-cell", "pci-branch-mv-shift", "pci-bif-guide-size",
      "pci-bif-wire-both-branches", "pci-bif-no-sb-predilation", "pci-bif-atherectomy-two-wires",
      "pci-bif-mv-stent-size", "pci-bif-jail-wire-prep", "pci-bif-pot-size-position", "pci-bif-assess-side-branch",
      "pci-bif-rewire-distal-cell", "pci-bif-kissing-size", "pci-twostent-guide-size", "pci-twostent-prepare-both",
      "pci-twostent-workhorse-wires", "pci-twostent-atherectomy-two-wires", "pci-dkcrush-sb-balloon-wont-go",
      "pci-sks-emergency-only", "pci-lm-ivus-for-ostium", "pci-lm-no-side-hole-guide", "pci-lm-preload-wire-ostial",
      "pci-lm-damped-torque-off", "pci-lm-injections-dominance", "pci-lm-brief-inflations",
      "pci-lm-hypotension-inflation", "pci-lm-ostial-stent-position", "pci-lm-stent-expansion-limit",
      "pci-lm-dissection-bailout", "pci-lm-distal-strategy", "pci-lm-jailed-circumflex",
      "pci-lm-circumflex-occluded", "pci-lm-no-routine-kissing", "pci-lm-trifurcation", "pci-chip-three-domains",
      "pci-lm-support-triggers", "pci-cabg-perforation-act-now", "pci-graft-native-or-graft",
      "pci-svg-chronic-occlusion", "pci-graft-route-reach", "pci-ima-guide-gentle", "pci-ima-anastomosis-balloon",
      "pci-svg-guide-support", "pci-svg-direct-stent-size", "pci-epd-feasibility", "pci-epd-cannot-cross",
      "pci-epd-slow-flow", "pci-calc-imaging-decides", "pci-calc-no-stent-until-expanded", "pci-calc-wire-exchange",
      "pci-calc-bradycardia-plan", "pci-calc-balloon-boost", "pci-calc-cutting-slow", "pci-calc-postdilate",
      "pci-calc-ivl-crossing",
      "pci-calc-laser-uncrossable", "pci-calc-laser-underexpanded-stent", "pci-stemi-reperfusion-rhythm",
      "pci-stemi-after-lysis", "pci-acs-restore-flow", "pci-thrombus-large-decision", "pci-laser-warm-up",
      "pci-thrombus-stent-trap", "pci-thrombus-no-stent-criteria", "pci-aspiration-match-guide",
      "pci-aspiration-monorail-lumen", "pci-aspiration-suction-passes", "pci-aspiration-withdraw-suction",
      "pci-aspiration-no-return", "pci-aspiration-deliver-fail", "pci-rca-av-block", "pci-shock-one-call-team",
      "pci-shock-each-true-culprit", "pci-shock-chronic-not-culprit", "pci-arrest-defib-settings",
      "pci-arrest-adenosine-cough", "pci-arrest-tamponade-drain", "pci-tavr-wire-then-rail",
      "pci-cto-strategy-act-recheck", "pci-cto-strategy-guide-choice", "pci-cto-strategy-dual-injection",
      "pci-cto-strategy-microcatheter-injection", "pci-cto-strategy-no-blind-cap",
      "pci-cto-strategy-hybrid-first-choice", "pci-cto-strategy-change-early", "pci-cto-strategy-stop-rules",
      "pci-cto-strategy-step-down", "pci-cto-strategy-confirm-before-advancing",
      "pci-cto-strategy-poststent-physiology", "pci-cto-antegrade-microcatheter", "pci-cto-antegrade-first-wire",
      "pci-cto-antegrade-step-down", "pci-cto-antegrade-distal-branch", "pci-cto-antegrade-knuckle",
      "pci-cto-antegrade-dissection-catheter", "pci-cto-antegrade-inflow", "pci-cto-antegrade-reentry-zone",
      "pci-cto-antegrade-stick-swap", "pci-cto-antegrade-straw", "pci-cto-antegrade-investment",
      "pci-cto-antegrade-move-cap", "pci-cto-retro-lima-donor", "pci-cto-retro-svg-plug",
      "pci-cto-retro-no-power-injection", "pci-ocx-scad-plan", "pci-ocx-scad-stent-long-small",
      "pci-ocx-imh-distal-first", "pci-ocx-stent-failure-history", "pci-ocx-stent-failure-image",
      "pci-ocx-substrut-knuckle", "pci-ocx-isr-undilatable-order", "pci-ocx-instent-atherectomy-last",
      "pci-ocx-isr-first-or-recurrent", "pci-ocx-brachytherapy-dapt", "pci-ocx-protamine-after-equipment",
      "pci-unx-small-long-balloon", "pci-unx-balloon-wedge", "pci-unx-watch-distal-tip", "pci-unx-grenadoplasty",
      "pci-unx-keep-the-wire", "pci-unx-microcatheter-turns", "pci-unx-microcatheter-across", "pci-unx-wire-cutting",
      "pci-unx-bury-microcatheter", "pci-unx-laser-contrast-stent-only", "pci-unx-subintimal-confirm",
      "pci-unx-inchworm", "pci-unx-extension-collar", "pci-unx-extension-stent-at-collar", "pci-unx-combine",
      "pci-unx-undilatable-first-question", "pci-unx-hp-balloon-technique", "pci-unx-rupture-look",
      "pci-unx-sticky-balloon", "pci-unx-laser-then-test", "pci-unx-cabg-last", "pci-principles-explain-unexpected",
      "pci-principles-support-standby", "pci-stop-checkpoint", "pci-stop-after-complication",
      "pci-closure-name-cause", "pci-closure-balloon-hides-distal", "pci-closure-collapse-support",
      "pci-dissection-stop-selective", "pci-dissection-deliver-stent", "pci-dissection-workhorse-test",
      "pci-dissection-leave-small", "pci-lm-dissection-decide", "pci-aortocoronary-prevent",
      "pci-aortocoronary-after", "pci-sb-predict", "pci-pmi-document", "pci-noreflow-dissection-or-embolism",
      "pci-noreflow-hold-contrast", "pci-noreflow-low-pressure-support", "pci-noreflow-anticipate",
      "pci-embol-thrombus-three-steps", "pci-air-first-moves", "pci-air-collapse", "pci-air-find-source",
      "pci-perf-grade-and-locate", "pci-perf-wire-exit-no-follow", "pci-perf-size-and-pressure",
      "pci-perf-balloon-now", "pci-perf-support-and-call", "pci-perf-hypotension-tamponade",
      "pci-stentloss-prepare-first", "pci-stentloss-guide-extension-collar", "pci-wire-tip-restrained",
      "pci-balloon-shaft-kink", "pci-microcath-wire-inside-limit-turns", "pci-hypo-amplatz-valve",
      "pci-hypo-rhc-when-unclear", "pci-arrhythmia-ecg-baseline", "pci-arrhythmia-reperfusion",
      "pci-rad-dose-callouts", "pci-rad-skin-follow-up", "pci-rad-prior-skin-injury", "pci-contrast-budget-ckd",
      "pci-contrast-sparing-tactics", "pci-caki-after-case", "pci-bleed-general-measures",
      "pci-bleed-bladder-screen", "pci-bleed-antiplatelet-platelets", "pci-gx-size-match",
      "pci-gx-thrombus-aspiration", "pci-gx-atherectomy-plan",
      "pci-gx-nested-extensions", "pci-gx-through-proximal-stent", "pci-gx-radial-long-cylinder",
      "pci-guide-reach-distal-target", "pci-guide-short-markers", "pci-guide-shorten-by-hand",
      "pci-eqb-know-the-chart", "pci-eqb-standard-first", "pci-eqb-postdil-which-balloon",
      "pci-eqb-scoring-or-cutting", "pci-eqb-very-high-pressure", "pci-eqb-ostial-flare-markers",
      "pci-eqb-thin-strut-visibility", "pci-eqb-cart-check", "pci-eqb-cart-covered-fit", "pci-eqb-cart-cto",
      "pci-eqb-cart-restock", "pci-planning-fourteen-steps", "pci-planning-old-films",
      "pci-planning-imaging-restenosis", "pci-planning-adenosine-history", "pci-planning-guide-size",
      "pci-planning-left-main", "pci-planning-contrast-ceiling", "pci-planning-radiation-limit",
      "pci-planning-bailout-kit", "pci-planning-stent-candidacy", "pci-planning-classify-lesion", "pci-mon-baseline",
      "pci-mon-st-change", "pci-mon-false-hypotension", "pci-mon-pulsus-paradoxus", "pci-mon-aortic-line-physiology",
      "pci-mon-watch-both-ends", "pci-mon-guide-backout", "pci-mon-check-guide-after-removal",
      "pci-mon-keep-wire-in-crisis", "pci-mon-time-out", "pci-mon-sign-out", "pci-mon-act-warning",
      "pci-mon-dose-advice", "pci-mon-vf-roles", "pci-mon-closed-loop", "pci-mon-fatigue-defer",
      "pci-mon-sterile-cockpit", "pci-mon-wipe-wire", "pci-act-before-coronary-devices", "pci-act-device-targets",
      "pci-low-act-redose", "pci-thrombus-check-act-first", "pci-guide-extension-watch-act",
      "pci-protamine-only-after-equipment-out", "pci-bleeding-reverse-correctly", "pci-cto-anticoagulant-choice",
      "pci-fondaparinux-add-heparin", "pci-hit-use-bivalirudin", "pci-check-oral-loading",
      "pci-gpi-cangrelor-bailout", "pci-perforation-stop-iv-antiplatelet", "pci-cangrelor-to-oral",
      "pci-svg-no-routine-gpi", "pci-opioid-delays-p2y12", "pci-no-reflow-distal-vasodilator",
      "pci-svg-intragraft-vasodilator", "pci-adenosine-rca-dose", "pci-adenosine-block-cough-wait",
      "pci-hypotension-match-pressor", "pci-left-main-early-noradrenaline", "pci-anaphylaxis-im-adrenaline",
      "pci-trap-then-backbleed", "pci-acq-target-orthogonal-views", "pci-acq-fluoro-save-inflations",
      "pci-interp-qca-calibrate", "pci-interp-grade-flow", "pci-interp-lost-distal-vessel",
      "pci-interp-thrombus-grade", "pci-interp-calcium-look-first", "pci-interp-dissection-nhlbi",
      "pci-interp-donor-ffr", "pci-plan-name-the-goal", "pci-stage-on-dose", "pci-serial-distal-first",
      "pci-lm-branches-and-rca-first", "pci-stage-after-complication", "pci-wire-fails-wrong-vessel",
      "pci-no-physiology-in-culprit", "pci-oct-unclear-culprit", "pci-acs-culprit-first", "pci-shock-culprit-only",
      "pci-stemi-nonculprit-plan", "pci-guide-left-extra-support", "pci-guide-rca-support",
      "pci-guide-seat-three-marks", "pci-guide-damped-work-outside", "pci-guide-wire-direction",
      "pci-wire-start-workhorse", "pci-wire-expect-two-bring-microcatheter", "pci-wire-support-wire-exchange-in",
      "pci-wire-shape-small-first", "pci-wire-keep-tip-free", "pci-wire-left-views", "pci-wire-rca-views",
      "pci-wire-not-crossing-ladder", "pci-wire-organise-two-wires", "pci-prep-wire-check-before-balloon",
      "pci-prep-clear-the-guide", "pci-balloon-size-and-length", "pci-balloon-prep-visible",
      "pci-balloon-open-the-valve", "pci-balloon-inflation-numbers", "pci-balloon-rupture-suction",
      "pci-balloon-watermelon", "pci-balloon-waist-stop", "pci-balloon-withdraw-deflated",
      "pci-delivery-marker-then-screen", "pci-delivery-small-bites", "pci-delivery-old-stent-rewire",
      "pci-delivery-withdraw-coaxial", "pci-support-five-levers", "pci-support-extension-wedge",
      "pci-support-side-branch-anchor", "pci-support-distal-anchor-out", "pci-support-buddy-wire",
      "pci-support-deep-breath", "pci-stent-not-into-no-reflow", "pci-stent-check-dapt-and-surgery",
      "pci-stent-size-distal", "pci-stent-cover-injured-segment", "pci-stent-cardiac-motion",
      "pci-stent-hold-the-inflation", "pci-optimise-nc-postdilate", "pci-optimise-show-the-stent",
      "pci-optimise-edge-dissection", "pci-optimise-side-branch-loss", "pci-optimise-final-views",
      "pci-phys-decide-before-measuring", "pci-phys-zero-outside", "pci-phys-equalise-at-tip",
      "pci-phys-equalise-fail", "pci-phys-wire-wrong-branch", "pci-phys-cross-distal", "pci-phys-ic-adenosine-flush",
      "pci-phys-iv-hyperaemia-signs", "pci-phys-no-hyperaemia", "pci-phys-damped-guide", "pci-phys-drift-check",
      "pci-phys-serial-biggest-step", "pci-phys-diffuse-no-step", "pci-phys-ostial-disengage",
      "pci-phys-left-main-both-branches", "pci-phys-svg-avoid", "pci-phys-discordance", "pci-phys-post-pci-pullback",
      "pci-phys-jailed-side-branch", "pci-phys-thermodilution-boluses", "pci-img-choose-by-goal",
      "pci-img-ivus-contrast-saver", "pci-img-nitrate-first", "pci-img-ivus-clear-view", "pci-img-cannot-cross",
      "pci-img-ivus-jumps", "pci-img-oct-guide-size", "pci-img-oct-marker", "pci-img-oct-purge-calibrate",
      "pci-img-oct-flush-rates", "pci-img-oct-hold-catheter", "pci-img-oct-no-pullback", "pci-img-lm-threshold",
      "pci-img-calcium-score", "pci-img-image-after-modification", "pci-img-landing-zone",
      "pci-img-size-distal-reference", "pci-img-underexpansion-fix", "pci-img-malapposition",
      "pci-img-edge-dissection", "pci-img-lm-both-branches", "pci-img-ostial-coverage", "pci-img-thrombus-sizing",
      "pci-img-scad-caution", "pci-img-coreg-landing", "pci-img-ct-cap", "pci-support-plan-two-axes",
      "pci-support-standby-sheath", "pci-support-swan-stays", "pci-support-ffr-in-shock",
      "pci-arrest-mechanical-cpr", "pci-arrest-oblique-views", "pci-arrest-no-rosc-ecmo",
    ],
  },
  {
    raisedBy: "diag-scenario-registry",
    lab: "diagnostic",
    tips: [
      "diag-ocx-scad-setup", "diag-ocx-scad-no-deep-seat",
    ],
  },
  {
    raisedBy: "mcs-console-split-select-and-tips",
    lab: "mcs",
    tips: [
      "mcs-rv-failure-numbers", "mcs-shock-support-before-pci", "mcs-ecpr-check-before-cannulating",
      "mcs-ecpr-cannulate-under-cpr", "mcs-cx-iabp-ischaemic-leg", "mcs-cx-crossover-balloon-before-removal",
      "mcs-cx-largebore-bleed-balloon", "mcs-cx-covered-stent-site", "mcs-cx-iabp-bleeding-anticoag",
      "mcs-cx-ecmo-cannula-bleed", "mcs-pump-sheath-guide-reach", "mcs-pressor-escalation-limit",
      "mcs-largebore-angiogram-first", "mcs-preclose-two-sutures", "mcs-largebore-limb-angiogram",
      "mcs-largebore-limb-check", "mcs-largebore-removal-sutures", "mcs-select-impella-contraindications",
      "mcs-select-hypoxaemia-ecmo", "mcs-select-shock-severity", "mcs-manage-post-pci-escalation",
      "mcs-select-biventricular", "mcs-wean-criteria", "mcs-iabp-size-height", "mcs-iabp-vacuum-valve",
      "mcs-iabp-kit-wire", "mcs-iabp-tip-carina", "mcs-iabp-transfer", "mcs-iabp-remove-together",
      "mcs-iabp-read-1to2", "mcs-iabp-poor-augmentation", "mcs-iabp-no-heparin-1to1", "mcs-iabp-static-balloon",
      "mcs-iabp-irregular-rhythm", "mcs-iabp-wean-ratio", "mcs-iabp-limb", "mcs-impella-cross-pigtail",
      "mcs-impella-loading-lumen", "mcs-impella-brisk-advance", "mcs-impella-iliac-resistance",
      "mcs-impella-start-check", "mcs-impella-hold-pump", "mcs-impella-ventricular-waveform", "mcs-impella-suction",
      "mcs-impella-pulled-back", "mcs-impella-stopped", "mcs-impella-haemolysis-position",
      "mcs-impella-peel-outside", "mcs-ecmo-groins", "mcs-ecmo-antegrade-sheath", "mcs-ecmo-leg-rescue",
      "mcs-ecmo-venous-wire-svc", "mcs-ecmo-arterial-cannula", "mcs-ecmo-wet-connection", "mcs-ecmo-bubbles",
      "mcs-ecmo-loaded-lv", "mcs-ecmo-vent-choice", "mcs-ecmo-right-radial", "mcs-ecmo-wean-trial",
    ],
  },
  {
    raisedBy: "structural-tips-and-tavi-course",
    lab: "structural",
    tips: [
      "structural-tavi-futility-check", "structural-tavi-plan-second-valve", "structural-tavi-no-nitrate-before-ct",
      "structural-tavi-annulus-double-oblique", "structural-tavi-access-min-lumen",
      "structural-tavi-guided-puncture", "structural-tavi-protection-wire", "structural-tavi-cross-valve",
      "structural-tavi-lv-wire-pacing", "structural-tavi-pacing-wire-decision",
      "structural-tavi-hypotension-coronary", "structural-tavi-snorkel-limits", "structural-tavi-pvr-mechanism",
      "structural-tavi-vtc-viv", "structural-ts-both-groins-low", "structural-ts-pacing-lead-wire",
      "structural-ts-pulldown-orient", "structural-ts-two-movements", "structural-ts-four-confirmations",
      "structural-ts-resistant-wire-first", "structural-ts-aortic-puncture-hold", "structural-ts-vagal-st",
      "structural-ts-posterior-delayed-tamponade", "structural-teer-area-budget",
      "structural-teer-height-coaptation", "structural-teer-gantry-arms", "structural-teer-steer-views",
      "structural-teer-planimetry", "structural-teer-la-vwave", "structural-teer-second-device",
      "structural-laao-fill-before-sizing", "structural-laao-largest-measurement",
      "structural-laao-puncture-from-ct", "structural-laao-pigtail-leads", "structural-laao-plug-unsheathe",
      "structural-laao-plug-pass", "structural-laao-disc-ball-push", "structural-laao-disc-criteria",
      "structural-laao-anchors-in-sheath", "structural-laao-drt-anticoagulate", "structural-tavi-iliofemoral-run",
      "structural-tavr-plan-reaccess",
    ],
  },
  {
    raisedBy: "pericardiocentesis-tips-and-pci-handover",
    lab: "bedside",
    tips: [
      "bed-peri-set-up", "bed-peri-confirm-wire", "bed-peri-after-pci", "bed-peri-drain-stays",
    ],
  },
  {
    raisedBy: "pci-wire-microcatheter",
    lab: "pci",
    tips: [
      "pci-ostial-stenting-wire", "pci-bif-hard-side-branch-wire", "pci-lima-pseudolesion",
      "pci-cto-strategy-subintimal-wire", "pci-cto-antegrade-confirm-lumen", "pci-cto-antegrade-trap-exchange",
      "pci-cto-antegrade-parallel-wire", "pci-cto-antegrade-decide-early", "pci-dissection-true-lumen-lost",
      "pci-perf-wire-tip-watch", "pci-eqb-trapping-balloon-size", "pci-mon-wire-tip-collimation",
      "pci-wire-confirm-true-lumen", "pci-microcath-when-needed", "pci-microcath-no-overspin",
      "pci-img-ivus-wire-position",
    ],
  },
  {
    raisedBy: "pci-bench-imaging-unify",
    lab: "pci",
    tips: [
      "pci-ocx-small-vessel-nitrate", "pci-ocx-small-vessel-prep", "pci-ocx-large-vessel-side-branch",
      "pci-ocx-large-vessel-ivus", "pci-ocx-stent-expansion-limit", "pci-ocx-long-pullback",
      "pci-ocx-long-image-measure", "pci-ocx-long-distal-first",
    ],
  },
  {
    raisedBy: "diag-lesion-morphologies",
    lab: "diagnostic",
    tips: [
      "diag-cto-strategy-defer-adhoc", "diag-interp-collateral-long-run",
    ],
  },
  {
    raisedBy: "pci-guide-engagement",
    lab: "pci",
    tips: [
      "pci-ostial-old-stent-rewire", "pci-gx-engage-when-guide-cannot", "pci-guide-kink-untwist",
    ],
  },
  {
    raisedBy: "diag-lab-drugs",
    lab: "diagnostic",
    tips: [
      "diag-anaphylaxis-im-adrenaline",
    ],
  },
  {
    raisedBy: "structural-transseptal-hands-on",
    lab: "structural",
    tips: [
      "structural-ts-heparin-after-crossing", "structural-ts-air-hub-low",
    ],
  },
  {
    raisedBy: "diag-anatomy-variants",
    lab: "diagnostic",
    tips: [
      "diag-anomalous-origin-image-first", "diag-interp-anomalous-cx-search",
    ],
  },
  {
    raisedBy: "haemo-rhc-manoeuvre",
    lab: "haemo",
    tips: [
      "haemo-rhc-femoral-side-branch", "haemo-rhc-ra-loop", "haemo-rhc-knot", "haemo-lhc-difficult-valve",
    ],
  },
  {
    raisedBy: "diag-catheter-kink",
    lab: "diagnostic",
    tips: [
      "diag-lv-gram-papillary", "diag-tavr-cross-perpendicular", "diag-root-iliac-kink-long-sheath",
      "diag-kink-untwist",
    ],
  },
  {
    raisedBy: "diag-grafts-svg",
    lab: "diagnostic",
    tips: [
      "diag-aortogram-graft-roadmap", "diag-graft-not-found",
    ],
  },
  {
    raisedBy: "pci-bifurcation-provisional",
    lab: "pci",
    note: "lesson-only: plan and side-branch-compromise never occur together; the request asks for a side-branch-occlusion event, which needs a vocabulary amendment",
    tips: [
      "pci-bif-confirm-inside-struts", "pci-bif-occluded-sb-rescue",
    ],
  },
  {
    raisedBy: "pci-flow-closure",
    lab: "pci",
    tips: [
      "pci-closure-spasm", "pci-interp-pseudolesion",
    ],
  },
  {
    raisedBy: "pci-flow-closure",
    lab: "pci",
    note: "text change, not a trigger change: split the adrenaline sentence into its own tip on no-reflow-refractory",
    tips: [
      "pci-noreflow-pick-agent",
    ],
  },
  {
    raisedBy: "pci-device-delivery",
    lab: "pci",
    note: "satisfiable once aorto-ostial-lesion is raised; eq-sheaths-guides#7 also asks that it never show while a guide extension is in place, which a trigger cannot express (there is no negation): once extension-in-place is raised, split the wedged-extension sentence or add an exclusion to the vocabulary",
    tips: [
      "pci-gx-ostial-keep-guide-out",
    ],
  },
  {
    raisedBy: "pci-calcium-uncrossable",
    lab: "pci",
    tips: [
      "pci-bif-jailed-wire-removal", "pci-lm-jailed-wire-removal", "pci-tavr-guide-trapped",
      "pci-wire-trapped-no-hard-pull", "pci-balloon-no-deflate", "pci-microcath-trapped-retrieve",
      "pci-gx-fracture-retrieval", "pci-gx-retrieve-entrapped-device",
    ],
  },
  {
    raisedBy: "diag-acs-scenarios",
    lab: "diagnostic",
    tips: [
      "diag-ohca-ecg-sorts",
    ],
  },
  {
    raisedBy: "diag-route-wire-led-radial",
    lab: "diagnostic",
    tips: [
      "diag-root-balloon-assisted-tracking",
    ],
  },
  {
    raisedBy: "pci-acs-thrombus",
    lab: "pci",
    tips: [
      "pci-ocx-st-wire-escalation", "pci-ocx-st-image-mechanism", "pci-ocx-st-fix-mechanism",
      "pci-ocx-st-lifelong-dapt",
    ],
  },
  {
    raisedBy: "diag-spasm-states",
    lab: "diagnostic",
    tips: [
      "diag-ostial-spasm-withdraw-nitrate", "diag-radial-spasm-release", "diag-acq-spasm-repeat-view",
    ],
  },
  {
    raisedBy: "diag-injection-run-quality",
    lab: "diagnostic",
    tips: [
      "diag-post-nondiagnostic", "diag-as-high-flow-fill", "diag-ocx-large-vessel-fill", "diag-acq-streaming-fill",
      "diag-interp-fill-or-call-nondiagnostic",
    ],
  },
  {
    raisedBy: "access-cx-endovascular-control",
    lab: "access",
    tips: [
      "access-cx-iliac-dissection-crossover", "access-cx-cold-leg-six-ps", "access-closure-cold-leg",
    ],
    note: "the cold-leg tips need limb-ischaemia, which the full case's tip context (proc-tip-context) has no cause to raise; this package models limb ischaemia (modules/endovascular.ts)",
  },
  {
    raisedBy: "physiology-anoca-cft",
    lab: "pci",
    tips: [
      "pci-phys-ach-prepare", "pci-phys-ach-block", "pci-phys-ach-spasm",
    ],
  },
  {
    raisedBy: "haemo-valve-and-myocardial-studies",
    lab: "haemo",
    tips: [
      "haemo-ps-continuous-pullback", "haemo-ts-two-matched-catheters", "haemo-tr-ra-v-wave",
    ],
  },
  {
    raisedBy: "access-venous",
    lab: "access",
    tips: [
      "access-central-vein-no-blood",
    ],
  },
  {
    raisedBy: "pci-equipment-loss",
    lab: "pci",
    tips: [
      "pci-stentloss-freeze-wire", "pci-stentloss-small-balloon", "pci-stentloss-crush-check-struts",
      "pci-snare-homemade",
    ],
  },
  {
    raisedBy: "structural-teer-steering-and-tricuspid",
    lab: "structural",
    tips: [
      "structural-tteer-diurese-first",
    ],
  },
  {
    raisedBy: "structural-septal-occluder",
    lab: "structural",
    tips: [
      "structural-septal-occluder-no-overstretch", "structural-septal-occluder-release-check",
      "structural-septal-occluder-effusion-24h",
    ],
  },
  {
    raisedBy: "structural-valvuloplasty-pathways",
    lab: "structural",
    tips: [
      "structural-bav-exclusions-ceiling", "structural-bav-stiff-wire-apex", "structural-bav-balloon-size",
      "structural-bav-rapid-pacing", "structural-bav-ar-signs", "structural-pmc-toe-first",
      "structural-pmc-stepwise-stop",
    ],
  },
];

export const DEFERRED_RETARGETS: readonly DeferredRetarget[] = [
  // pci-wire-microcatheter (P1, wave 11)
  { tipId: "pci-wire-prolapse-four-solutions", raisedBy: "pci-wire-microcatheter", when: { phase: ["wire"], event: ["wire-prolapse"] } },
  { tipId: "pci-wire-reversed-hairpin", raisedBy: "pci-wire-microcatheter", when: { phase: ["wire"], event: ["wire-prolapse"] } },
  { tipId: "pci-wire-pseudolesion-pullback", raisedBy: "pci-wire-microcatheter", when: { phase: ["wire", "lesion-prep", "stent"], event: ["new-narrowing-tortuous"] } },
  { tipId: "pci-microcath-hydraulic-limits", raisedBy: "pci-wire-microcatheter", when: { phase: ["wire", "lesion-prep"], event: ["microcatheter-removal"] } },
  { tipId: "pci-microcath-cannot-trap", raisedBy: "pci-wire-microcatheter", when: { phase: ["wire", "lesion-prep"], event: ["microcatheter-removal"] } },
  { tipId: "pci-wire-stop-at-guide-tip", raisedBy: "pci-wire-microcatheter", when: { phase: ["wire"], event: ["wire-out-of-guide"] } },
  { tipId: "pci-wire-load-through-valve", raisedBy: "pci-wire-microcatheter", when: { phase: ["wire", "lesion-prep", "stent"], event: ["second-wire-with-device"] } },
  // pacing-in-lab-scenarios-and-tips (P1, wave 15)
  { tipId: "bed-pace-sheath-up-femoral", raisedBy: "pacing-in-lab-scenarios-and-tips", when: { phase: ["access"], procedure: ["pacing"] } },
  { tipId: "bed-pace-steer-to-apex", raisedBy: "pacing-in-lab-scenarios-and-tips", when: { phase: ["position"], procedure: ["pacing"] } },
  { tipId: "bed-pace-atrial-loop", raisedBy: "pacing-in-lab-scenarios-and-tips", when: { phase: ["position"], procedure: ["pacing"] } },
  { tipId: "bed-pace-sock-shape", raisedBy: "pacing-in-lab-scenarios-and-tips", when: { phase: ["position"], procedure: ["pacing"] } },
  { tipId: "bed-pace-coronary-sinus", raisedBy: "pacing-in-lab-scenarios-and-tips", when: { phase: ["position", "troubleshoot"], procedure: ["pacing"] } },
  { tipId: "bed-pace-threshold-margin", raisedBy: "pacing-in-lab-scenarios-and-tips", when: { phase: ["test"], procedure: ["pacing"] } },
  { tipId: "bed-pace-demand-sensitivity", raisedBy: "pacing-in-lab-scenarios-and-tips", when: { phase: ["test"], procedure: ["pacing"] } },
  { tipId: "bed-pace-skin-loop", raisedBy: "pacing-in-lab-scenarios-and-tips", when: { phase: ["test"], procedure: ["pacing"] } },
  { tipId: "bed-pace-external-bridge", raisedBy: "pacing-in-lab-scenarios-and-tips", when: { phase: ["assess", "access"], event: ["bradycardia", "hypotension"], procedure: ["pacing"] } },
  // pci-indeflator (P1, wave 16)
  { tipId: "pci-ostial-recoil", raisedBy: "pci-indeflator", when: { phase: ["optimise"], event: ["stent-recoil"], requires: ["aorto-ostial-lesion"], vessel: ["RCA", "LM", "SVG"] } },
  // pci-cx-recognition (P1, wave 17)
  { tipId: "pci-ostial-aortocoronary-seal", raisedBy: "pci-cx-recognition", when: { phase: ["guide", "wire", "complication"], event: ["aortocoronary-dissection"], vessel: ["RCA", "LM", "SVG"] },
    note: "the superset guard applies: it is a bailout in the dissection complication context today" },
  { tipId: "pci-cto-retro-aortocoronary-dissection", raisedBy: "pci-cx-recognition", when: { phase: ["wire", "complication"], event: ["aortocoronary-dissection"], vessel: ["RCA", "LM"] },
    note: "the superset guard applies: it is a bailout in the dissection complication context today" },
  // pci-device-delivery (P1, wave 17)
  { tipId: "pci-gx-second-wire", raisedBy: "pci-device-delivery", when: { phase: ["lesion-prep", "stent"], event: ["extension-in-place"] } },
  // pci-flow-closure (P1, wave 26)
  { tipId: "pci-embol-plaque-aspirate", raisedBy: "pci-flow-closure", when: { phase: ["complication"], event: ["plaque-embolisation"] },
    note: "the superset guard applies: it is a caution in the no-reflow complication context today" },
  { tipId: "pci-wire-spasm-nitrate", raisedBy: "pci-flow-closure", when: { phase: ["wire", "imaging"], event: ["coronary-spasm"] } },
  // pci-calcium-uncrossable (P1, wave 27)
  { tipId: "pci-calc-rota-draw", raisedBy: "pci-calcium-uncrossable", when: { phase: ["lesion-prep"], event: ["atherectomy-rotational"], requires: ["calcified-lesion"] } },
  { tipId: "pci-calc-rota-runs", raisedBy: "pci-calcium-uncrossable", when: { phase: ["lesion-prep"], event: ["atherectomy-rotational"], requires: ["calcified-lesion"] } },
  { tipId: "pci-calc-burr-delivery", raisedBy: "pci-calcium-uncrossable", when: { phase: ["lesion-prep"], event: ["burr-not-advancing"], requires: ["calcified-lesion"] } },
  { tipId: "pci-calc-burr-entrapment", raisedBy: "pci-calcium-uncrossable", when: { phase: ["lesion-prep", "complication"], event: ["equipment-entrapment"], requires: ["atherectomy-rotational"] } },
  { tipId: "pci-calc-rota-bradycardia", raisedBy: "pci-calcium-uncrossable", when: { phase: ["lesion-prep", "complication"], event: ["bradycardia"], requires: ["atherectomy-rotational"] } },
  { tipId: "pci-calc-rota-slow-flow", raisedBy: "pci-calcium-uncrossable", when: { phase: ["lesion-prep", "complication"], event: ["slow-flow", "no-reflow"], requires: ["atherectomy-rotational"] },
    note: "the superset guard applies: it is a bailout in the no-reflow complication context today" },
  { tipId: "pci-calc-atherectomy-perforation", raisedBy: "pci-calcium-uncrossable", when: { phase: ["lesion-prep", "complication"], event: ["perforation"], requires: ["atherectomy-rotational"] },
    note: "the superset guard applies: it is a bailout in the perforation complication context today; orbital atherectomy needs an atherectomy-any event or a split tip, because requires is AND" },
  { tipId: "pci-calc-orbital-low-speed", raisedBy: "pci-calcium-uncrossable", when: { phase: ["lesion-prep"], event: ["atherectomy-orbital"], requires: ["calcified-lesion"] } },
  // pci-bifurcation-two-stent (P1, wave 30)
  { tipId: "pci-dkcrush-mv-balloon-first", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["stent"], requires: ["bifurcation"], technique: ["dk-crush"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-dkcrush-sb-protrusion", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["stent"], requires: ["bifurcation"], technique: ["dk-crush"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-dkcrush-sb-deploy-pressure", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["stent"], requires: ["bifurcation"], technique: ["dk-crush", "t-stent"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-dkcrush-crush-balloon", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["stent"], requires: ["bifurcation"], technique: ["dk-crush"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-dkcrush-first-rewire-proximal", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["stent", "optimise"], requires: ["bifurcation"], technique: ["dk-crush", "mini-crush"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-twostent-two-step-kiss", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["optimise"], requires: ["bifurcation"], technique: ["dk-crush"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-dkcrush-second-rewire-distal", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["stent", "optimise"], requires: ["bifurcation"], technique: ["dk-crush"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-twostent-final-pot", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["optimise"], requires: ["bifurcation"], technique: ["dk-crush"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-twostent-kiss-sequence", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["optimise"], requires: ["bifurcation"], technique: ["dk-crush", "culotte"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-culotte-first-branch", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["stent"], requires: ["bifurcation"], technique: ["culotte"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-culotte-pot-before-rewire", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["stent", "optimise"], requires: ["bifurcation"], technique: ["culotte"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-tstent-proximal-marker", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["stent"], requires: ["bifurcation"], technique: ["t-stent"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-tap-protrusion", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["stent"], requires: ["bifurcation"], technique: ["tap"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-tap-deflate-mv-first", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["optimise"], requires: ["bifurcation"], technique: ["tap"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-tap-final-pot", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["optimise", "finish"], requires: ["bifurcation"], technique: ["tap"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-revcrush-mv-balloon-early", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["stent", "optimise"], requires: ["bifurcation"], technique: ["reverse-crush"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-minicrush-rewire-proximal", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["stent", "optimise"], requires: ["bifurcation"], technique: ["mini-crush"] },
    note: "add the step range from technique/steps.ts when it exists" },
  { tipId: "pci-vstent-sks-guide", raisedBy: "pci-bifurcation-two-stent", when: { phase: ["plan", "guide"], requires: ["bifurcation"], technique: ["v-stent", "sks"] },
    note: "add the step range from technique/steps.ts when it exists" },
  // pci-perforation (P1, wave 30)
  { tipId: "pci-perf-second-access", raisedBy: "pci-perforation", when: { phase: ["complication"], event: ["perforation"], requires: ["perforation-large-vessel"] } },
  { tipId: "pci-perf-covered-one-guide", raisedBy: "pci-perforation", when: { phase: ["complication"], event: ["perforation"], requires: ["perforation-large-vessel"] } },
  { tipId: "pci-perf-covered-two-guides", raisedBy: "pci-perforation", when: { phase: ["complication"], event: ["perforation"], requires: ["perforation-large-vessel"] } },
  { tipId: "pci-perf-covered-expand", raisedBy: "pci-perforation", when: { phase: ["complication", "optimise"], event: ["perforation"], requires: ["perforation-large-vessel"] } },
  { tipId: "pci-perf-distal-block-deliver", raisedBy: "pci-perforation", when: { phase: ["complication"], event: ["perforation"], requires: ["perforation-distal"] } },
  { tipId: "pci-perf-fat-embolisation", raisedBy: "pci-perforation", when: { phase: ["complication"], event: ["perforation"], requires: ["perforation-distal"] } },
  { tipId: "pci-perf-coil-match", raisedBy: "pci-perforation", when: { phase: ["complication"], event: ["perforation"], requires: ["perforation-distal"] } },
  { tipId: "pci-perf-distal-covered-origin", raisedBy: "pci-perforation", when: { phase: ["complication"], event: ["perforation"], requires: ["perforation-distal"] } },
  { tipId: "pci-perf-distal-finish-watch", raisedBy: "pci-perforation", when: { phase: ["finish"], event: ["perforation"], requires: ["perforation-distal"] } },
  { tipId: "pci-perf-check-other-side", raisedBy: "pci-perforation", when: { phase: ["complication", "finish"], event: ["perforation-distal", "perforation-collateral"] },
    note: "the superset guard applies: it is a caution in the perforation complication context today" },
  { tipId: "pci-cto-retro-collateral-perforation", raisedBy: "pci-perforation", when: { phase: ["complication"], event: ["perforation"], requires: ["cto", "perforation-collateral"] } },
  // pci-cto-retrograde (P1, wave 31)
  { tipId: "pci-cto-retro-septal-surf", raisedBy: "pci-cto-retrograde", when: { phase: ["wire"], requires: ["cto", "retrograde"] } },
  { tipId: "pci-cto-retro-microcatheter-stalls", raisedBy: "pci-cto-retrograde", when: { phase: ["wire"], requires: ["cto", "retrograde"] } },
  { tipId: "pci-cto-retro-donor-ischaemia", raisedBy: "pci-cto-retrograde", when: { phase: ["wire", "lesion-prep"], requires: ["cto", "retrograde"] } },
  { tipId: "pci-cto-retro-epicardial-rules", raisedBy: "pci-cto-retrograde", when: { phase: ["wire"], requires: ["cto", "retrograde"] } },
  { tipId: "pci-cto-retro-svg-angled-microcatheter", raisedBy: "pci-cto-retrograde", when: { phase: ["wire"], requires: ["cto", "retrograde"], vessel: ["RCA", "LAD", "LCx"] } },
  { tipId: "pci-cto-retro-reverse-cart-troubleshoot", raisedBy: "pci-cto-retrograde", when: { phase: ["wire"], event: ["wire-subintimal"], requires: ["cto", "retrograde"] } },
  { tipId: "pci-cto-retro-connect-options", raisedBy: "pci-cto-retrograde", when: { phase: ["wire"], requires: ["cto", "retrograde"] } },
  { tipId: "pci-cto-retro-no-interlock", raisedBy: "pci-cto-retrograde", when: { phase: ["lesion-prep", "stent"], requires: ["cto", "retrograde"] } },
  { tipId: "pci-cto-retro-final-donor-check", raisedBy: "pci-cto-retrograde", when: { phase: ["finish"], requires: ["cto", "retrograde"] } },
  { tipId: "pci-cto-retro-microcatheter-entrapment", raisedBy: "pci-cto-retrograde", when: { phase: ["complication"], event: ["equipment-entrapment"], requires: ["cto", "retrograde"] } },
  { tipId: "pci-cto-retro-septal-haematoma", raisedBy: "pci-cto-retrograde", when: { phase: ["complication", "finish"], event: ["perforation-collateral"], requires: ["cto", "retrograde"] } },
  // pacing-overdrive-and-tcp (P2, wave 43)
  { tipId: "bed-pace-overdrive-vt", raisedBy: "pacing-overdrive-and-tcp", when: { phase: ["assess", "troubleshoot"], event: ["vt"], procedure: ["overdrive"] } },
  // pci-equipment-loss (P2, wave 43)
  { tipId: "pci-wire-fracture-ivus-first", raisedBy: "pci-equipment-loss", when: { event: ["equipment-entrapment"], requires: ["wire-fracture"] } },
  { tipId: "pci-balloon-trap-in-guide", raisedBy: "pci-equipment-loss", when: { phase: ["lesion-prep", "stent", "optimise"], event: ["equipment-entrapment"], requires: ["balloon-entrapment"] } },
  { tipId: "pci-snare-size-for-space", raisedBy: "pci-equipment-loss", when: { phase: ["complication"], event: ["snare-in-use"] } },
  { tipId: "pci-snare-close-and-withdraw", raisedBy: "pci-equipment-loss", when: { phase: ["complication"], event: ["snare-in-use"] } },
  // pci-graft (P2, wave 44)
  { tipId: "pci-epd-keep-still", raisedBy: "pci-graft", when: { phase: ["lesion-prep", "stent", "optimise"], requires: ["epd-deployed"], vessel: ["SVG"] } },
  { tipId: "pci-epd-retrieve", raisedBy: "pci-graft", when: { phase: ["finish"], requires: ["epd-deployed"], vessel: ["SVG"] } },
  { tipId: "pci-epd-full-filter", raisedBy: "pci-graft", when: { phase: ["finish"], event: ["slow-flow"], requires: ["epd-deployed"], vessel: ["SVG"] } },
  { tipId: "pci-epd-retrieval-blocked", raisedBy: "pci-graft", when: { phase: ["finish"], event: ["equipment-entrapment"], requires: ["epd-deployed"], vessel: ["SVG"] } },
  // diag-radiation-practice (P2, wave 45)
  { tipId: "pci-rad-operator-dose-alarm", raisedBy: "diag-radiation-practice", when: { event: ["operator-dose-alarm"] } },
];
