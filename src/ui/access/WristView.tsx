// The wrist at the radial closure (access-closure-radial).
//
// A plan view of the palm side of the wrist and forearm, the hand to the left and the elbow to the right: the
// distal wrist crease, the radial pulse the operator feels along the artery, the skin nick (with the sheath
// while it is in), and the compression band, which the learner drags along the forearm to where it is centred
// (its centre marker), with a second band against it when one is added. What is drawn is what the operator
// sees: blood under the clear band or at the wrist below it, and a swelling coming up above the band once the
// forearm has filled enough to see. The arterial hole lies under the skin, proximal to the nick by the depth of
// the artery over the tangent of the needle angle, and is drawn only as a guided teaching aid
// (policy.overlays.labels), never in supervised, independent or exam mode. Positions are site x, mm along the
// forearm from the distal wrist crease, positive towards the elbow (src/simulation/access/site.ts).
import { useRef, useState } from "react";
import { MP_BAND_POSITION, type BandBleedSite } from "../../simulation/access/closure";

/** The drawing's frame: mm shown either side of the skin nick, and the scale (display settings). */
const BELOW_NICK_MM = 25;
const ABOVE_NICK_MM = 45;
const PX = 4;
const W = (BELOW_NICK_MM + ABOVE_NICK_MM) * PX;
const H = 140;
const MID = H / 2;
/** The band's strap as drawn: the width it presses over (MP_BAND_POSITION), and its height across the wrist. */
const BAND_H = 92;
const BAND_HALF_MM = MP_BAND_POSITION.flatHalfMm + MP_BAND_POSITION.edgeMm;
/** The label rows, above and below the straps, so no label runs under a band (display settings). */
const TOP_ROW = MID - BAND_H / 2 - 6;
const BOTTOM_ROW = MID + BAND_H / 2 + 15;
/** A halo in the drawing's background (base-800) behind each label, so a line crossing it does not hide it. */
const HALO = { stroke: "#121417", strokeWidth: 3, paintOrder: "stroke" as const, strokeLinejoin: "round" as const };

export interface WristViewProps {
  /** the skin nick (site x, mm) */
  skinX: number;
  /** the band's centre (site x, mm): the band on the wrist, or where it is about to go */
  bandX: number;
  /** the band is on (false: the planned position is drawn as an outline) */
  bandOn: boolean;
  /** a second band's centre, if one is on */
  secondX?: number | null;
  /** the sheath is still in */
  sheathIn: boolean;
  /** where the hole bleeds now, as the operator sees it */
  bleedSite: BandBleedSite;
  /** a swelling above the band large enough to see */
  swelling: boolean;
  /** the arterial hole (site x, mm): drawn only as a guided teaching aid */
  holeX?: number | null;
  disabled?: boolean;
  /** live updates while dragging (the planned position, before the band is on) */
  onMove: (bandX: number) => void;
  /**
   * When given (the band is on), the drag is a local preview only and the band is moved once, where the
   * pointer is released; onMove is not called during the drag. A cancelled drag moves nothing.
   */
  onCommit?: (bandX: number) => void;
}

export function WristView({ skinX, bandX, bandOn, secondX, sheathIn, bleedSite, swelling, holeX, disabled, onMove, onCommit }: WristViewProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  const dragging = useRef(false);
  /** the band's position while it is dragged with onCommit: drawn in place of bandX until the release */
  const [previewX, setPreviewX] = useState<number | null>(null);
  const toPx = (x: number) => (x - skinX + BELOW_NICK_MM) * PX;
  const toMm = (e: React.PointerEvent) => {
    const svg = ref.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const x = skinX - BELOW_NICK_MM + px / PX;
    return Math.round(Math.max(skinX - BELOW_NICK_MM, Math.min(skinX + ABOVE_NICK_MM - 5, x)) * 2) / 2;
  };
  const move = (e: React.PointerEvent) => {
    if (!dragging.current || disabled) return;
    const x = toMm(e);
    if (x === null) return;
    if (onCommit) setPreviewX(x);
    else onMove(x);
  };
  const release = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (onCommit && previewX !== null && previewX !== bandX) onCommit(previewX);
    setPreviewX(null);
  };
  const cancel = () => {
    dragging.current = false;
    setPreviewX(null);
  };
  const nick = toPx(skinX);
  const crease = toPx(0);
  const band = toPx(previewX ?? bandX);
  const bandW = BAND_HALF_MM * 2 * PX;
  const strap = (cx: number, key: string, outline: boolean) => (
    <g key={key}>
      <rect x={cx - bandW / 2} y={MID - BAND_H / 2} width={bandW} height={BAND_H} rx={6} className={outline ? "fill-transparent" : "fill-base-500"} fillOpacity={outline ? 0 : 0.45} stroke="#A6ADB8" strokeWidth="1.5" strokeDasharray={outline ? "4 4" : undefined} />
      {/* the bladder's centre marker the operator lines up */}
      <line x1={cx} y1={MID - BAND_H / 2 + 4} x2={cx} y2={MID + BAND_H / 2 - 4} stroke="#4FD6EE" strokeWidth="1.5" />
    </g>
  );
  const pulseY = MID;
  /** the swelling just above (proximal to) the most proximal band */
  const topBand = Math.max(band, secondX != null ? toPx(secondX) : band);
  const swellX = Math.min(W - 30, topBand + bandW / 2 + 26);
  const creaseShown = crease > 2 && crease < W - 2;
  /** the crease's label to the left of the crease when there is room (the hole's label starts at the nick or beyond) */
  const creaseLabelLeft = crease > 44;
  /** the hole's label runs from the hole towards the elbow, or ends at the hole when it would run off the edge */
  const holeLabelEnd = holeX != null && toPx(holeX) + 66 > W;
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className={`w-full max-w-[300px] rounded-md border border-line bg-base-800 touch-none select-none ${disabled ? "opacity-60" : "cursor-grab"}`}
      role="img"
      aria-label="Wrist: drag the band along the forearm to where you centre it"
      onPointerDown={(e) => {
        if (disabled) return;
        dragging.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        move(e);
      }}
      onPointerMove={move}
      onPointerUp={release}
      onPointerCancel={cancel}
      data-wrist-view
    >
      {/* the distal wrist crease */}
      {creaseShown && <path d={`M ${crease} 6 Q ${crease - 6} ${MID} ${crease} ${H - 6}`} fill="none" stroke="#2E343C" strokeWidth="2" />}
      {/* the radial pulse the operator feels */}
      <line x1={6} y1={pulseY} x2={W - 6} y2={pulseY} className="stroke-ink-faint" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="3 6" />
      {/* the sheath, from the skin nick towards the hand */}
      {sheathIn && <line x1={nick} y1={pulseY} x2={Math.max(4, nick - 14 * PX)} y2={pulseY + 8} stroke="#ECEEF1" strokeWidth="3" strokeLinecap="round" />}
      {/* the bands */}
      {strap(band, "band", !bandOn)}
      {secondX != null && strap(toPx(secondX), "second", false)}
      {/* a swelling coming up above the band: drawn over the straps (it shows through the clear band), so a
          second band put against the first does not hide it */}
      {swelling && (
        <ellipse cx={swellX} cy={MID - 4} rx={30} ry={22} fill="#22262C" fillOpacity="0.8" stroke="#A6ADB8" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="5 3" data-wrist-swelling />
      )}
      {/* the skin nick */}
      <line x1={nick} y1={pulseY - 6} x2={nick} y2={pulseY + 6} stroke="#A6ADB8" strokeWidth="2" />
      {/* the arterial hole: a guided teaching aid only */}
      {holeX != null && <circle cx={toPx(holeX)} cy={pulseY} r={4} fill="none" stroke="#4F8EF7" strokeWidth="1.5" />}
      {/* blood the operator sees: under the clear band at the nick, or at the wrist below it */}
      {bleedSite === "puncture" && <circle cx={nick} cy={pulseY} r={6} fill="#E5534B" opacity="0.8" data-wrist-blood />}
      {bleedSite === "wrist" && <circle cx={nick} cy={pulseY + 4} r={7} fill="#E5534B" opacity="0.85" data-wrist-blood />}
      {/* the labels, last and outside the straps' height: the crease and the hole above, the nick and the ends below */}
      {creaseShown && (
        <text x={creaseLabelLeft ? crease - 4 : crease + 4} y={TOP_ROW} textAnchor={creaseLabelLeft ? "end" : "start"} className="fill-ink-faint" fontSize="11" {...HALO}>
          crease
        </text>
      )}
      {holeX != null && (
        <>
          <line x1={toPx(holeX)} y1={pulseY - 5} x2={toPx(holeX)} y2={TOP_ROW + 3} stroke="#4F8EF7" strokeWidth="1" strokeOpacity="0.6" />
          <text x={holeLabelEnd ? toPx(holeX) + 6 : toPx(holeX) - 6} y={TOP_ROW} textAnchor={holeLabelEnd ? "end" : "start"} fill="#4F8EF7" fontSize="11" {...HALO}>
            arterial hole
          </text>
        </>
      )}
      <text x={4} y={BOTTOM_ROW} className="fill-ink-faint" fontSize="11" {...HALO}>
        hand
      </text>
      <line x1={nick} y1={pulseY + 7} x2={nick} y2={BOTTOM_ROW - 10} stroke="#A6ADB8" strokeWidth="1" strokeOpacity="0.5" />
      <text x={nick} y={BOTTOM_ROW} textAnchor="middle" className="fill-ink-soft" fontSize="11" {...HALO}>
        skin nick
      </text>
      <text x={W - 4} y={BOTTOM_ROW} textAnchor="end" className="fill-ink-faint" fontSize="11" {...HALO}>
        elbow
      </text>
    </svg>
  );
}
