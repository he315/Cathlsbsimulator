import { useMemo, useState } from "react";
import type { AngioDrillId, AngioSimId, Block, LaunchParams, LaunchSim, SourceLoc } from "../../content/schema";
import { CHANNELS, VIDEOS, videoUrl } from "../../content/videos";
import { TIP_BY_ID, type LabTip } from "../../content/lab/tips";
import { SIM_SECTION, useUiStore } from "../../state/useUiStore";
import CinePlayer from "../angio/CinePlayer";
import { DRILL_LABEL, describeDrillParams, findRun, useLibrary, type DrillKind } from "../angio/library";
import Figure from "./Figures";
import RichText from "./RichText";
import { describeLaunch, lessonIdFor, lessonPractice, type PracticeItem } from "./practiceIndex";
import { useContent } from "./useContent";

const ANGIO_LABEL: Record<AngioSimId, string> = { "angio-real": "Real angiograms", "angio-pci": "PCI in the cath lab" };

/** A real cine run from the local library, by run id. */
function CineBlock({ run, caption, showBoxes }: { run: string; caption: string; showBoxes?: boolean }) {
  const { data, loading } = useLibrary();
  const r = findRun(data, run);
  const ds = r ? data?.find((d) => d.dataset === r.dataset) : undefined;
  return (
    <figure className="my-4 max-w-[480px]">
      {loading ? (
        <div className="panel p-4 text-[13px] text-ink-faint">Loading the angiogram library…</div>
      ) : r ? (
        <CinePlayer run={r} height={480} showBoxes={showBoxes} />
      ) : (
        <div className="notice notice-info">
          This lesson shows a real cine run ({run}) from the local angiogram library, which is not installed on this machine. The text below still describes it.
        </div>
      )}
      <figcaption className="text-[13px] text-ink-soft mt-1.5 leading-relaxed">
        <RichText text={caption} />
      </figcaption>
      {ds && (
        <div className="text-[12px] text-ink-faint mt-0.5">
          {ds.dataset}, {ds.licence}. De-identified research data; for education only.
        </div>
      )}
    </figure>
  );
}

function DrillLink({ target, drill, params, task }: { target: AngioSimId; drill?: AngioDrillId; params?: Record<string, string>; task: string }) {
  const openSim = useUiStore((s) => s.openSim);
  const opens = target === "angio-pci" ? describeLaunch(target, params) : describeDrillParams(params);
  const label = drill ? (drill === "review" ? "Due for review" : DRILL_LABEL[drill as DrillKind]) : ANGIO_LABEL[target];
  return (
    <div className="my-4 flex items-center gap-3 rounded-lg border border-accent/35 bg-accent/[0.06] px-4 py-3">
      <span className="led text-accent shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] tracking-[0.14em] text-accent font-semibold">
          Practise · {ANGIO_LABEL[target]}
          {drill ? ` · ${label}` : ""}
        </div>
        <div className="text-[14px] text-ink-soft">{task}</div>
        {opens && <div className="text-[12px] text-ink-faint mt-0.5">Opens with {opens}.</div>}
      </div>
      <button
        className="btn btn-accent shrink-0"
        onClick={() => {
          // angio-real: openSim passes the drill to requestDrill; angio-pci: the params go to the launch store.
          if (target === "angio-real") openSim(target, drill ? { ...(params ?? {}), drill } : undefined);
          else openSim(target, params);
        }}
      >
        Open
      </button>
    </div>
  );
}

function Callout({
  tone,
  title,
  children,
}: {
  tone: "good" | "warn" | "accent";
  title: string;
  children: React.ReactNode;
}) {
  const col =
    tone === "good"
      ? "border-good/35 bg-good/[0.06] text-good"
      : tone === "warn"
        ? "border-warn/35 bg-warn/[0.06] text-warn"
        : "border-accent/35 bg-accent/[0.07] text-accent";
  return (
    <div className={`my-4 rounded-lg border px-4 py-3 ${col}`}>
      <div className="text-[12px] tracking-[0.14em] font-semibold mb-1.5">{title}</div>
      <div className="text-ink-soft text-[14px] leading-relaxed">{children}</div>
    </div>
  );
}

/** A video from the registry, as a link that opens YouTube in a new tab (further study beside the lesson). */
function VideoLink({ id, note }: { id: string; note?: string }) {
  const v = VIDEOS[id];
  if (!v) return null;
  return (
    <a
      href={videoUrl(id)}
      target="_blank"
      rel="noreferrer"
      className="my-3 flex items-start gap-3 rounded-lg border border-line bg-base-800/60 px-4 py-3 hover:border-line-strong hover:bg-base-700/70 transition-colors"
    >
      <span className="mt-0.5 grid h-7 w-9 shrink-0 place-items-center rounded border border-line-strong text-ink-faint" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M3 1.8v8.4L10 6z" /></svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] text-ink-faint">Watch · {CHANNELS[v.channel].name}{v.playlists[0] ? ` · ${v.playlists[0]}` : ""}</span>
        <span className="block text-[14px] text-ink">{v.title}</span>
        {note && <span className="block text-[13px] text-ink-soft mt-0.5">{note}</span>}
      </span>
      <span className="shrink-0 text-[12px] text-accent mt-0.5">Opens YouTube</span>
    </a>
  );
}

/** An inline check of understanding: choose, then see why. */
function CheckBlock({ stem, options, answer, explanation }: { stem: string; options: string[]; answer: number; explanation: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;
  return (
    <div className="my-5 rounded-lg border border-line bg-base-800/50 px-4 py-3">
      <div className="text-[12px] text-ink-faint mb-1">Check your understanding</div>
      <div className="text-[14.5px] text-ink mb-2.5 leading-relaxed">
        <RichText text={stem} />
      </div>
      <div className="flex flex-col gap-1.5">
        {options.map((o, i) => {
          const right = done && i === answer;
          const wrong = done && i === picked && i !== answer;
          return (
            <button
              key={i}
              type="button"
              disabled={done}
              onClick={() => setPicked(i)}
              className={`text-left rounded-md border px-3 py-2 text-[14px] transition-colors ${
                right ? "border-good/60 bg-good/[0.08] text-ink" : wrong ? "border-danger/60 bg-danger/[0.08] text-ink" : "border-line-strong text-ink-soft hover:border-accent/60 hover:text-ink disabled:hover:border-line-strong disabled:hover:text-ink-soft"
              }`}
            >
              <RichText text={o} />
            </button>
          );
        })}
      </div>
      {done && (
        <div className={`mt-3 text-[14px] leading-relaxed ${picked === answer ? "text-good" : "text-warn"}`}>
          <span className="font-medium">{picked === answer ? "Correct. " : "Not quite. "}</span>
          <span className="text-ink-soft">
            <RichText text={explanation} />
          </span>
        </div>
      )}
    </div>
  );
}

const TIP_LAB: Record<LabTip["lab"], string> = {
  diagnostic: "Cath lab",
  pci: "PCI lab",
  access: "Access",
  haemo: "Haemodynamics lab",
  mcs: "Mechanical support",
  structural: "Structural lab",
  bedside: "Bedside procedures",
};

/** A lab technique tip, shown as it appears in the lab. */
export function TipCard({ tip }: { tip: LabTip }) {
  const tone = tip.tone === "do" ? "border-accent/40" : tip.tone === "caution" ? "border-warn/45" : "border-danger/45";
  const label = tip.tone === "do" ? "Technique" : tip.tone === "caution" ? "Caution" : "Bail-out";
  return (
    <div className={`my-4 rounded-lg border ${tone} bg-base-800/50 px-4 py-3`}>
      <div className="text-[12px] text-ink-faint mb-0.5">
        {label} · {TIP_LAB[tip.lab]}
      </div>
      <div className="text-[14px] text-ink font-medium">{tip.title}</div>
      <div className="text-[14px] text-ink-soft leading-relaxed mt-0.5">
        <RichText text={tip.text} />
      </div>
    </div>
  );
}

const BOOK_NAME: Record<SourceLoc["book"], string> = {
  "brilakis-pci": "Brilakis, Manual of Percutaneous Coronary Interventions",
  "oxford-cath": "Oxford Handbook of Cardiac Catheterization and Coronary Intervention, 2nd ed.",
};

/** Where to read further in the two core manuals. */
export function SourceList({ sources }: { sources?: SourceLoc[] }) {
  if (!sources?.length) return null;
  const by = new Map<SourceLoc["book"], string[]>();
  for (const s of sources) by.set(s.book, [...(by.get(s.book) ?? []), s.loc]);
  return (
    <div className="mt-4 border-t border-line pt-3">
      <div className="stat-label mb-1.5">Read further in the manuals</div>
      <ul className="space-y-1 text-[12.5px] text-ink-soft">
        {[...by].map(([book, locs]) => (
          <li key={book}>
            <span className="text-ink">{BOOK_NAME[book]}</span>
            {": "}
            {book === "brilakis-pci" ? `sections ${locs.join(", ")}` : locs.map((l) => l.replace(/^ch /, "chapter ")).join("; ")}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BlockView({ b }: { b: Block }) {
  const openSim = useUiStore((s) => s.openSim);
  switch (b.kind) {
    case "h":
      return <h3 className="text-[17px] font-semibold text-ink mt-6 mb-2">{b.text}</h3>;
    case "p":
      return (
        <p className="text-[14.5px] leading-[1.7] text-ink-soft my-3">
          <RichText text={b.text} />
        </p>
      );
    case "list": {
      const L = b.ordered ? "ol" : "ul";
      return (
        <L className={`my-3 pl-5 space-y-1.5 text-[14.5px] leading-[1.6] text-ink-soft ${b.ordered ? "list-decimal" : "list-disc"} marker:text-ink-faint`}>
          {b.items.map((it, i) => (
            <li key={i}>
              <RichText text={it} />
            </li>
          ))}
        </L>
      );
    }
    case "keypoints":
      return (
        <Callout tone="good" title={b.title ?? "Key points"}>
          <ul className="list-disc pl-5 space-y-1">
            {b.items.map((it, i) => (
              <li key={i}>
                <RichText text={it} />
              </li>
            ))}
          </ul>
        </Callout>
      );
    case "pitfalls":
      return (
        <Callout tone="warn" title={b.title ?? "Pitfalls"}>
          <ul className="list-disc pl-5 space-y-1">
            {b.items.map((it, i) => (
              <li key={i}>
                <RichText text={it} />
              </li>
            ))}
          </ul>
        </Callout>
      );
    case "pearl":
      return (
        <Callout tone="accent" title="Pearl">
          <RichText text={b.text} />
        </Callout>
      );
    case "table":
      return (
        <div className="my-4 overflow-x-auto rounded-lg border border-line">
          {b.caption && (
            <div className="px-3 py-2 text-[12px] text-ink-faint border-b border-line bg-base-700/60">{b.caption}</div>
          )}
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-base-600/70">
                {b.head.map((h, i) => (
                  <th key={i} className="text-left font-semibold text-ink px-3 py-2 border-b border-line whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i} className="odd:bg-base-800/40 align-top">
                  {r.map((c, j) => (
                    <td key={j} className={`px-3 py-2 border-b border-line/60 ${j === 0 ? "text-ink" : "text-ink-soft"}`}>
                      <RichText text={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "steps":
      return (
        <div className="my-4">
          {b.title && <div className="stat-label mb-2">{b.title}</div>}
          <ol className="space-y-2">
            {b.items.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid place-items-center w-6 h-6 shrink-0 rounded-full bg-accent/15 border border-accent/40 text-accent text-[12px] font-semibold mt-0.5">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-[14px] text-ink font-medium">{s.title}</div>
                  <div className="text-[14px] text-ink-soft leading-relaxed">
                    <RichText text={s.detail} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      );
    case "formula":
      return (
        <div className="my-4 rounded-lg border border-line bg-base-800/70 px-4 py-3">
          <div className="text-[12px] tracking-[0.14em] text-ink-faint mb-1">{b.name}</div>
          <div className="font-mono text-[14px] text-ink">{b.expr}</div>
          {b.note && <div className="text-[13px] text-ink-faint mt-1.5">{b.note}</div>}
        </div>
      );
    case "figure":
      return <Figure id={b.id} caption={b.caption} />;
    case "sim":
      return (
        <div className="my-4 flex items-center gap-3 rounded-lg border border-accent/35 bg-accent/[0.06] px-4 py-3">
          <span className="led text-accent shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] tracking-[0.14em] text-accent font-semibold">
              Practise · {SIM_SECTION[b.sim]?.label ?? b.sim}
            </div>
            <div className="text-[14px] text-ink-soft">{b.task}</div>
            {describeLaunch(b.sim, b.params) && <div className="text-[12px] text-ink-faint mt-0.5">Opens at {describeLaunch(b.sim, b.params)}.</div>}
          </div>
          <button className="btn btn-accent shrink-0" onClick={() => openSim(b.sim, b.params)}>
            Open
          </button>
        </div>
      );
    case "cine":
      return <CineBlock run={b.run} caption={b.caption} showBoxes={b.showBoxes} />;
    case "drill":
      return <DrillLink target={b.target} drill={b.drill} params={b.params} task={b.task} />;
    case "video":
      return <VideoLink id={b.id} note={b.note} />;
    case "check":
      return <CheckBlock stem={b.stem} options={b.options} answer={b.answer} explanation={b.explanation} />;
    case "tip": {
      const tip = TIP_BY_ID[b.id];
      return tip ? <TipCard tip={tip} /> : null;
    }
  }
}

/** 'Practise this in the lab': the lab scenarios that practise a lesson or case. */
export function PracticeList({ items, title = "Practise this in the lab" }: { items: PracticeItem[]; title?: string }) {
  const openSim = useUiStore((s) => s.openSim);
  if (!items.length) return null;
  return (
    <section className="mt-6 rounded-lg border border-accent/35 bg-accent/[0.05] px-4 py-3" aria-label={title}>
      <div className="text-[12px] tracking-[0.14em] text-accent font-semibold mb-2">{title}</div>
      <ul className="space-y-2">
        {items.map((it) => {
          const opens = describeLaunch(it.sim, it.params);
          return (
            <li key={it.key} className="flex items-center gap-3">
              <span className="led text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-ink-faint">{SIM_SECTION[it.sim]?.label ?? it.sim}</div>
                <div className="text-[14px] text-ink">{it.title}</div>
                {opens && opens !== it.title && <div className="text-[12px] text-ink-faint mt-0.5">Opens at {opens}.</div>}
              </div>
              <button className="btn btn-accent shrink-0" onClick={() => openSim(it.sim, it.params)}>
                Open
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * A lesson's blocks, followed by 'Practise this in the lab' for every practice-index entry that
 * names the lesson. `lessonId` may be omitted when `blocks` is a lesson's own blocks array.
 */
export default function BlockRenderer({ blocks, lessonId }: { blocks: Block[]; lessonId?: string }) {
  const content = useContent();
  const id = lessonId ?? lessonIdFor(content, blocks);
  const practice = useMemo(() => lessonPractice(id, blocks), [id, blocks]);
  return (
    <div>
      {blocks.map((b, i) => (
        <BlockView key={i} b={b} />
      ))}
      <PracticeList items={practice} />
    </div>
  );
}
