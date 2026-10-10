// ---------------------------------------------------------------------------
// Hand bindings of the guide (pci-guide-engagement).
//
// The guide is the input layer's 'catheter' slot. The hands advance it and
// withdraw it (mm at the hub) and rotate it (rad): out of the ostium they move
// its tip in the aortic root and engage it (the analytic engagement model, or
// the rod physics once PCI_ROD_GUIDE is on); engaged, a push seats it deeper,
// a pull draws it back and out, a rotation turns it off the coaxial position
// and, far enough, off the ostium while the wire stays; over a wire in the
// vessel a push takes it back in. All of it goes through the session's
// GuideEngagement (src/ui/pci/useGuidePhysics.ts). This binding replaces the
// input target's built-in route for the guide (engageGuide on a push, seatGuide),
// which engaged the guide whatever its position. The pin stays on the built-in
// route (pinGuide, which the PCI session does not offer yet).
// ---------------------------------------------------------------------------

import type { PciInputBinding } from "./index";
import { guideEngagementFor, type GuideSession } from "../useGuidePhysics";

/** The session as the guide's mechanics need it, or null when it lacks the anatomy (a session that cannot engage by hand). */
function guideSession(session: unknown): GuideSession | null {
  const x = session as Partial<GuideSession> | null;
  return x && x.model && x.g && x.st && x.s ? (x as GuideSession) : null;
}

export const binding: PciInputBinding = {
  device: "catheter",
  actions: {
    advance: ({ session }, mm) => {
      const x = guideSession(session);
      return x ? guideEngagementFor(x).command({ mm: Math.abs(mm) }) : false;
    },
    withdraw: ({ session }, mm) => {
      const x = guideSession(session);
      return x ? guideEngagementFor(x).command({ mm: -Math.abs(mm) }) : false;
    },
    torque: ({ session }, rad) => {
      const x = guideSession(session);
      return x ? guideEngagementFor(x).command({ rad }) : false;
    },
  },
};
