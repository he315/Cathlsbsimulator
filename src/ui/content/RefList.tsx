import { REF_BY_ID } from "../../content/refs";
import type { RefId } from "../../content/schema";

export function RefBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="chip !text-[12px] !py-0 border-good/40 text-good">checked</span>
  ) : (
    <span
      className="chip !text-[12px] !py-0 border-warn/40 text-warn"
      title="Citation details not yet checked against the source"
    >
      unchecked
    </span>
  );
}

/** Compact reference list for the foot of a lesson, quiz item or case. */
export default function RefList({ ids, title = "Sources" }: { ids?: RefId[]; title?: string }) {
  if (!ids || ids.length === 0) return null;
  const refs = ids.map((id) => REF_BY_ID[id]).filter(Boolean);
  if (refs.length === 0) return null;
  return (
    <div className="mt-4 border-t border-line pt-3">
      <div className="stat-label mb-1.5">{title}</div>
      <ol className="space-y-1 text-[12px] text-ink-soft list-decimal pl-5">
        {refs.map((r) => (
          <li key={r.id}>
            <span>{r.citation}</span>{" "}
            {r.url && (
              <a href={r.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                link
              </a>
            )}{" "}
            <RefBadge verified={r.verified} />
          </li>
        ))}
      </ol>
    </div>
  );
}
