// Content registry: every track, the published cases and the glossary.
import type { CaseStudy, Track } from "./schema";
import { foundations } from "./tracks/foundations";
import { diagnostic } from "./tracks/diagnostic";
import { haemodynamics } from "./tracks/haemodynamics";
import { physiologyImaging } from "./tracks/physiology-imaging";
import { pciCore } from "./tracks/pci-core";
import { pciComplex } from "./tracks/pci-complex";
import { complications } from "./tracks/complications";
import { acuteMcs } from "./tracks/acute-mcs";
import { structural } from "./tracks/structural";
import { proceduresCareer } from "./tracks/procedures-career";
import { PUBLISHED_CASES } from "./cases/published";
import { GLOSSARY } from "./glossary";
import { MANUAL_TRACKS } from "./manual/index";

export const TRACKS: Track[] = [
  foundations,
  diagnostic,
  haemodynamics,
  physiologyImaging,
  pciCore,
  pciComplex,
  complications,
  acuteMcs,
  structural,
  proceduresCareer,
  ...MANUAL_TRACKS,
].sort((a, b) => a.order - b.order);

export { PUBLISHED_CASES, GLOSSARY };

export const ALL_CASES: CaseStudy[] = [...TRACKS.flatMap((t) => t.cases), ...PUBLISHED_CASES];
