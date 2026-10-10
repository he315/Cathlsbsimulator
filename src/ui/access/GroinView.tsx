// The groin under the operator's hands during femoral manual compression (access-closure-femoral-manual).
//
// A plan view of the right or left groin, head to the top: the inguinal crease, the femoral pulse the
// operator feels along the artery, the skin nick, and the two fingers, which the learner drags to where
// they press. What is drawn is what the operator sees or feels: blood welling up at the nick when the
// hole is not held, and a swelling once it is large enough to see. The arterial hole itself lies under
// the skin and is drawn only as a guided teaching aid (policy.overlays.labels), never in supervised,
// independent or exam mode. Positions are mm on the skin from the nick (x towards the head, y lateral),
// the same frame as src/simulation/access/compression.ts.
import { useRef } from "react";
import type { CompressionState } from "../../simulation/access/compression";
import { MP_COMPRESSION, swellingCm } from "../../simulation/access/compression";

/** The drawing's frame: mm shown from the nick (display settings). */
const X_MIN = -40;
const X_MAX = 60;
const Y_HALF = 32;
const PX = 3;
const W = Y_HALF * 2 * PX;
const H = (X_MAX - X_MIN) * PX;

/** Label clearance from the finger ellipses (rx 10 + 6, display only), and their vertical reach (two ellipses, ry 8, 9 px apart). */
const FINGER_CLEAR_X = 16;
const FINGER_REACH_Y = 24;

const toPx = (xMm: number, yMm: number) => ({ cx: W / 2 + yMm * PX, cy: (X_MAX - xMm) * PX });

export interface GroinViewProps {
  c: CompressionState;
  /** mm from the nick to the inguinal crease (positive: the crease lies above the nick) */
  creaseMm: number;
  side: "right" | "left";
  /** blood at the nick now (what the operator sees) */
  bleeding: boolean;
  /** draw the arterial hole (guided teaching aid only) */
  showHole: boolean;
  disabled?: boolean;
  onMove: (xMm: number, yMm: number) => void;
}

export function GroinView({ c, creaseMm, side, bleeding, showHole, disabled, onMove }: GroinViewProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  const dragging = useRef(false);
  const lateral = side === "right" ? -1 : 1;
  const toMm = (e: React.PointerEvent) => {
    const svg = ref.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const py = ((e.clientY - r.top) / r.height) * H;
    const xMm = Math.max(X_MIN, Math.min(X_MAX, X_MAX - py / PX));
    const yMm = Math.max(-Y_HALF, Math.min(Y_HALF, ((px - W / 2) / PX) * lateral));
    return { xMm: Math.round(xMm), yMm: Math.round(yMm) };
  };
  const move = (e: React.PointerEvent) => {
    if (!dragging.current || disabled) return;
    const m = toMm(e);
    if (m) onMove(m.xMm, m.yMm);
  };
  const f = toPx(c.hands.xMm, c.hands.yMm * lateral);
  const nick = toPx(0, 0);
  const crease = toPx(creaseMm, 0);
  const hole = toPx(c.hole.xMm, c.hole.yMm * lateral);
  const swellCm = c.haematomaMl >= MP_COMPRESSION.visibleHaematomaMl ? swellingCm(c.haematomaMl) : 0;
  // a label sits clear of the fingers (rx 10 viewBox px, plus a gap): on the side away from them when they
  // are level with the mark (fingers on or right of it: label to the left), else to the right
  const labelBeside = (p: { cx: number; cy: number }) => {
    const level = Math.abs(f.cy - p.cy) < FINGER_REACH_Y;
    const left = level && f.cx >= p.cx;
    return left ? { x: p.cx - FINGER_CLEAR_X, y: p.cy + 4, textAnchor: "end" as const } : { x: p.cx + (level ? FINGER_CLEAR_X : 9), y: p.cy + 4 };
  };
  const press = c.hands.pressure;
  // the fingers whiten with pressure (display only; Clinical Graphite tokens, lighter with more pressure)
  const finger = press < 0.05 ? { cls: "fill-base-500", op: 1 } : press < MP_COMPRESSION.firm ? { cls: "fill-base-400", op: 1 } : press < MP_COMPRESSION.occlusive ? { cls: "fill-ink-faint", op: 0.45 } : { cls: "fill-ink-faint", op: 0.7 };
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className={`w-full max-w-[240px] rounded-md border border-line bg-base-800 touch-none select-none ${disabled ? "opacity-60" : "cursor-grab"}`}
      role="img"
      aria-label="Groin: drag the fingers to where you press"
      onPointerDown={(e) => {
        if (disabled) return;
        dragging.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        move(e);
      }}
      onPointerMove={move}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      data-groin-view
    >
      {/* the inguinal crease */}
      <path d={`M 8 ${crease.cy + 10} Q ${W / 2} ${crease.cy - 8} ${W - 8} ${crease.cy + 10}`} fill="none" stroke="#2E343C" strokeWidth="2" />
      <text x={8} y={crease.cy - 4} className="fill-ink-faint" fontSize="11">
        crease
      </text>
      {/* the femoral pulse the operator feels */}
      <line x1={W / 2} y1={6} x2={W / 2} y2={H - 6} className="stroke-ink-faint" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="3 6" />
      <text x={W / 2 + 6} y={14} className="fill-ink-faint" fontSize="11">
        pulse
      </text>
      {/* a swelling the operator can see */}
      {swellCm > 0 && <ellipse cx={nick.cx} cy={nick.cy - 6} rx={Math.min(W / 2 - 4, swellCm * 10 * PX * 0.5)} ry={Math.min(H / 3, swellCm * 10 * PX * 0.42)} fill="#22262C" stroke="#2E343C" />}
      {/* the skin nick, and blood welling up at it */}
      <line x1={nick.cx - 5} y1={nick.cy} x2={nick.cx + 5} y2={nick.cy} stroke="#A6ADB8" strokeWidth="2" />
      <text {...labelBeside(nick)} className="fill-ink-soft" fontSize="11">
        skin nick
      </text>
      {/* the arterial hole: a guided teaching aid only */}
      {showHole && (
        <g>
          <circle cx={hole.cx} cy={hole.cy} r={4} fill="none" stroke="#4F8EF7" strokeWidth="1.5" />
          <text {...labelBeside(hole)} fill="#4F8EF7" fontSize="11">
            arterial hole
          </text>
        </g>
      )}
      {/* two fingers, one above the other along the artery */}
      <g data-fingers>
        <ellipse cx={f.cx} cy={f.cy - 9} rx={10} ry={8} className={finger.cls} fillOpacity={finger.op} stroke="#A6ADB8" strokeWidth="1" />
        <ellipse cx={f.cx + 1} cy={f.cy + 9} rx={10} ry={8} className={finger.cls} fillOpacity={finger.op} stroke="#A6ADB8" strokeWidth="1" />
      </g>
      {/* blood at the nick, drawn over the fingers so the operator still sees it welling up around them */}
      {bleeding && <circle cx={nick.cx} cy={nick.cy} r={5} fill="#E5534B" opacity="0.85" data-nick-blood />}
    </svg>
  );
}
