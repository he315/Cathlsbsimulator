// Launch metadata for the haemodynamics lab's core scenarios (haemo-study-session-and-tips).
// Engine-free: types only. The scenario ids match HAEMO_SCENARIOS in src/simulation/haemo.ts
// (haemoStudy.test.ts checks both ways). The shock presets are studied twice, before and after PCI:
// their starts open the study at either measurement set. Each scenario lists the lessons whose
// teaching it practises, so the practice index shows it under them. The titles are the scenarios'
// own, written so that the practice list does not give the diagnosis away.
import type { LaunchFile, LaunchStart } from "../../../schema";

const SETS: LaunchStart[] = [
  { id: "pre", title: "Before PCI" },
  { id: "post", title: "After PCI" },
];

export const launch: LaunchFile = {
  sim: "haemo",
  scenarios: [
    { id: "normal", title: "Atypical chest pain, breathless on exertion", lessonIds: ["hb-cardiac-catheterisation-rhc", "hb-cardiac-catheterisation-output"] },
    { id: "aortic-stenosis", title: "Exertional syncope with an ejection systolic murmur", lessonIds: ["hb-specific-conditions-as", "cp-complex-patients-tavr-before"] },
    { id: "mitral-stenosis", title: "Breathlessness and palpitations, previous rheumatic fever", lessonIds: ["hb-specific-conditions-mitral"] },
    { id: "constriction", title: "Ascites and oedema after cardiac surgery years ago", lessonIds: ["hb-specific-conditions-constriction"] },
    { id: "restriction", title: "Breathlessness with thick ventricular walls and low voltages", lessonIds: ["hb-specific-conditions-constriction"] },
    { id: "tamponade", title: "Hypotension two hours after a complex PCI", lessonIds: ["hb-specific-conditions-constriction"] },
    { id: "hocm", title: "Exertional syncope in a young man with a loud murmur", lessonIds: ["hb-specific-conditions-hocm"] },
    { id: "pah", title: "Progressive breathlessness in a young woman", lessonIds: ["hb-cardiac-catheterisation-resistance"] },
    { id: "ipcph", title: "Breathless with a dilated, poorly contracting LV", lessonIds: ["hb-cardiac-catheterisation-resistance"] },
    { id: "asd", title: "Palpitations and a fixed split second heart sound", lessonIds: ["hb-cardiac-catheterisation-shunts"] },
    { id: "vsr", title: "New murmur and shock five days after an infarct", lessonIds: ["hb-cardiac-catheterisation-shunts", "cp-acs-thrombus-mechanical"] },
    { id: "lv-shock", title: "Anterior STEMI with cold peripheries", lessonIds: ["cp-complex-patients-shock-setup"] },
    { id: "rv-infarct", title: "Inferior STEMI, hypotension, clear lungs", lessonIds: ["cp-acs-thrombus-rv-posterior"] },
    { id: "acute-mr", title: "Flash pulmonary oedema after an inferolateral infarct", lessonIds: ["cp-acs-thrombus-mechanical"] },
    { id: "acute-ar", title: "Tearing chest pain and a diastolic murmur", lessonIds: ["hb-specific-conditions-ar-right"] },
    { id: "pe-high-risk", title: "Collapse and breathlessness after a knee replacement", lessonIds: ["hb-specific-conditions-pe"] },
    {
      id: "shock-lv",
      title: "Anterior STEMI in shock: before and after PCI",
      lessonIds: ["pm-support-choice-shock"],
      caseIds: ["pm-support-choice-case-shock"],
      starts: SETS,
    },
    {
      id: "shock-rv",
      title: "Inferior STEMI in shock: before and after PCI",
      lessonIds: ["pm-support-choice-rv"],
      starts: SETS,
    },
    {
      id: "shock-biv",
      title: "Extensive anterior STEMI in profound shock: before and after PCI",
      lessonIds: ["pm-support-choice-shock", "pm-support-choice-rv"],
      caseIds: ["pm-support-choice-case-shock"],
      starts: SETS,
    },
    { id: "chip-elective", title: "Planned complex PCI with a poor ventricle", lessonIds: ["pm-support-choice-when"], caseIds: ["pm-support-choice-case-chip"] },
  ],
  links: [
    // the post-PCI decision on its own, from the lessons that teach escalating and weaning
    { scenario: "shock-biv", start: "post", lessonIds: ["pm-support-choice-rv"] },
    { scenario: "shock-lv", start: "post", lessonIds: ["pm-support-choice-shock"] },
  ],
};
