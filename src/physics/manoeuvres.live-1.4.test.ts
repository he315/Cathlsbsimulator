// Manoeuvre suite (manoeuvreSuite.ts) on the live buildAnatomy()/thorax.aorticCourse geometry with the
// arch branches (as the app runs it), at segment scale 1.4 and 120 Hz: one of the configurations
// bench.chooseConfig can return (VALIDATED_CONFIGS).
import { defineManoeuvreSuite } from "./manoeuvreSuite";

defineManoeuvreSuite({ geometry: "live", archBranches: true, segmentScale: 1.4, substepHz: 120 });
