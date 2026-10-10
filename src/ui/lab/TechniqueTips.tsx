// The technique tips the attending offers in the lab (src/ui/lab/useLabTips.ts), each linked to the
// lesson that teaches it. Rendered inside the attending drawer.
import type { LabTip } from "../../content/lab/tips";
import { TipCard } from "../content/BlockRenderer";
import { openLesson } from "../content/openLesson";

export default function TechniqueTips({ tips, visible, exam, onAskHelp }: { tips: LabTip[]; visible: boolean; exam: boolean; onAskHelp?: () => void }) {
  if (exam) return null;
  return (
    <section className="border-b border-line px-4 py-3" aria-label="Technique">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink">Technique</span>
        {!visible && onAskHelp && (
          <button type="button" className="btn btn-ghost px-2 py-0.5 text-xs" onClick={onAskHelp}>
            Ask for a tip
          </button>
        )}
      </div>
      {!visible ? (
        <p className="text-[12.5px] text-ink-faint">Tips for what you are doing appear here when you ask for help.</p>
      ) : tips.length === 0 ? (
        <p className="text-[12.5px] text-ink-faint">No tip for this moment. Keep going, or ask the attending.</p>
      ) : (
        <div className="max-h-[42vh] overflow-y-auto">
          {tips.map((t) => (
            <div key={t.id}>
              <TipCard tip={t} />
              <button type="button" className="-mt-2 mb-2 text-[12px] text-accent hover:underline" onClick={() => void openLesson(t.lessonId)}>
                Read the lesson
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
