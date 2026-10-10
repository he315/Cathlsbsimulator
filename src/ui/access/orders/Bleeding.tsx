// The full case's bleeding orders (access-cx-bleeding-retroperitoneal): an order section
// (src/ui/access/orders/index.ts) over the session module 'bleeding' (src/simulation/session/modules/
// bleeding.ts). It is offered in every case with a femoral artery site, bleed or no bleed, so its presence
// says nothing: the general measures, where to look, reversal, the treatment of what the imaging shows and the
// antiplatelet plan, in src/ui/access/BleedingPanel.tsx. The orders stay available during a time-lapse,
// because the team gives them while the case goes on.
import type { CaseSection, CaseSectionProps } from "./index";
import { bleedingOf } from "../../../simulation/session/modules/bleeding";
import { BleedingPanel } from "../BleedingPanel";

function BleedingSection({ session, act }: CaseSectionProps) {
  if (!bleedingOf(session)) return null;
  return <BleedingPanel session={session} act={act} />;
}

export const section: CaseSection = {
  id: "bleeding",
  title: "Bleeding after femoral access",
  order: 47,
  applies: (s) => !!bleedingOf(s) && s.sites.some((x) => x.route === "femoral" && x.siteKind === "femoral"),
  Component: BleedingSection,
};
