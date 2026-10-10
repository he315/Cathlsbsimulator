// The planned-access picker of the full case, and the access sites once the case is under way.
// (split from src/ui/access/panels.tsx by proc-foundation-scenarios-ledger; panels.tsx re-exports it).
//
// access-multi-site: before the first skin puncture the picker changes the planned route, as before.
// Once the planned site has been punctured it lists the case's sites (SiteSelector, also shown on the
// ultrasound, fluoroscopy and closure views when there is more than one) and offers another site: the
// radial artery of either arm, or the common femoral artery or vein of either groin. The session
// decides whether a site can be opened now (CaseSession.addSiteBlocked) and the attending says why not.
//
// access-route-decision: the planned route is set by the access plan (the chart section PlanAccess.tsx,
// over the session module 'route-plan'), so before the first puncture the picker shows the plan's site
// and does not change it; once the planned site is punctured, another site is opened here (crossover)
// as before. A session without the module (a test's own module list), or a case opened past the chart
// (the team planned the route), keeps the old route buttons.
import { useProcedureStore } from "../../../state/useProcedureStore";
import { accessLabel, SITE_KINDS, siteKey, siteKeyLabel, type AccessSiteState, type SiteKindId, type SiteSide } from "../../../simulation/session/caseSession";
import { routePlanOf } from "../../../simulation/session/modules/routePlan";
import { PLAN_SITE_BY_ID } from "../../../simulation/access/siteChoice";
import { useSession } from "../panels";

const cap = (t: string) => t[0].toUpperCase() + t.slice(1);

/** A site's short name for a selector button: 'Right radial', 'Left femoral', 'Right femoral vein'. */
export function siteShortName(st: Pick<AccessSiteState, "siteKind" | "side">): string {
  return cap(siteKeyLabel(siteKey(st)).replace(/ artery$/, ""));
}

export function AccessPicker() {
  const s = useSession();
  const setAccess = useProcedureStore((x) => x.setAccess);
  const planned = s.sites[0];
  const locked = s.sites.length > 1 || planned.pm.st.passes > 0 || !!planned.sheath;
  if (locked) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {s.sites.length > 1 ? <SiteSelector /> : <span className="chip">{siteShortName(planned)}</span>}
        <AddSite />
      </div>
    );
  }
  const plan = routePlanOf(s);
  // a case opened past the chart was planned by the team: its route can still be changed here, as before
  if (plan && !plan.state.planByTeam) {
    const site = PLAN_SITE_BY_ID[plan.state.plan.site];
    // the chip names the site the case is set up on: when the session could not honour the plan, the actual site
    const label = plan.state.leftGroinPending ? siteShortName(planned) : site.label;
    return (
      <div className="flex flex-wrap items-center gap-2" data-planned-site={site.id}>
        <span className="chip">{label}</span>
        <span className="text-[12px] text-ink-faint">
          {site.labNote ? `${cap(site.labNote)}. ` : ""}Set in the access plan.
        </span>
      </div>
    );
  }
  return (
    <div className="seg">
      {(["radial-right", "radial-left", "femoral"] as const).map((a) => (
        <button key={a} className={`seg-btn ${s.access === a ? "seg-btn-active" : ""} disabled:opacity-40`} onClick={() => setAccess(a)}>
          {cap(accessLabel(a))}
        </button>
      ))}
    </div>
  );
}

/**
 * The case's access sites, one button each, the active one highlighted; a click moves the work there
 * (refused by the session, with the attending's reason, while the wire or catheter is in through the
 * active site or a puncture is half done). Renders nothing in a one-site case.
 */
export function SiteSelector({ className = "" }: { className?: string }) {
  const s = useSession();
  const act = useProcedureStore((x) => x.act);
  if (s.sites.length < 2) return null;
  return (
    <div className={`seg ${className}`} role="group" aria-label="Access site">
      {s.sites.map((x) => (
        <button
          key={x.id}
          className={`seg-btn ${x.id === s.activeSiteId ? "seg-btn-active" : ""}`}
          aria-pressed={x.id === s.activeSiteId}
          data-site={x.id}
          disabled={s.busy}
          onClick={() => act((y) => y.setActiveSite(x.id))}
          title={s.siteClosed(x) ? "Closed" : x.sheath ? "Sheath in" : "No sheath"}
        >
          {siteShortName(x)}
          {s.siteClosed(x) ? " · closed" : ""}
        </button>
      ))}
    </div>
  );
}

/** Open another access site: the case moves to the ultrasound view of the new site. */
function AddSite() {
  const s = useSession();
  const act = useProcedureStore((x) => x.act);
  const setWorkspace = useProcedureStore((x) => x.setWorkspace);
  const options = SITE_KINDS.flatMap((kind) => (["right", "left"] as const).map((side) => ({ kind, side }))).filter((o) => !s.sites.some((x) => x.siteKind === o.kind && x.side === o.side));
  if (s.finished || !options.length) return null;
  const add = (v: string) => {
    if (!v) return;
    const [kind, side] = v.split(":") as [SiteKindId, SiteSide];
    if (act((x) => x.addSite(kind, side))) setWorkspace("access");
  };
  return (
    <select className="field" value="" onChange={(e) => add(e.target.value)} aria-label="Another access site" disabled={s.busy}>
      <option value="">Another site…</option>
      {options.map((o) => (
        <option key={`${o.kind}:${o.side}`} value={`${o.kind}:${o.side}`}>
          {cap(siteKeyLabel(siteKey({ siteKind: o.kind, side: o.side })))}
        </option>
      ))}
    </select>
  );
}
