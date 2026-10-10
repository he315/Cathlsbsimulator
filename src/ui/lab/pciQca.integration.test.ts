// pci-assessment-policy-qca: the trainee's QCA on a stored PCI run, end to end on a captured frame.
//
// The frames are the realism baseline's capture of lad-focal (datasets/tmp/captures/baseline/lad_raocra_*,
// RAO 20 cranial 24, 20 cm field, a 6 Fr guide in the left coronary, cine at 15 f/s, the physically based
// renderer through the capture harness). They go into a PCI lab session's cine run as the live monitor
// would store them (resampled to the stored matrix, STORE_PX), and the QCA runs on the stored run's frame
// exactly as the reference monitor's steps do (QcaTool.tsx measureQca): two marks along the guide, its
// French size from the session's GuideState, then marks from normal vessel proximal to normal vessel distal.
// The marks stand in for the trainee's clicks: the capture's own projected centre lines of the guide and the
// LAD on that frame. The frame is the one a trainee picks: the best-filled end-diastolic frame.
//
// What this shows: the stored run is measurable, the calibration comes from the guide's French size and
// lands near the frame's scale, the stenosis is found as significant, and the result is recorded as the
// trainee's measurement against the truth. What it does not show: the plan's target, an MLD within 0.2 mm
// of truthNow, is not met (it.todo below). On this frame the MLD reads 0.74 mm against 0.37 mm (+0.36 mm,
// printed by the test), beyond even the largest MLD bias Keane et al. (1995) reported for ten QCA systems
// (+0.31 mm; src/simulation/imaging/qca.test.ts). Two causes, both outside this package's files: the
// 6 Fr guide calibrates about 18 % coarse (0.33 mm per stored pixel against 0.28 at the iso-centre: the
// edge detector puts the edges of a catheter a few pixels wide inside its wall, and the guide lies at
// another depth), and the 0.37 mm lumen is about 1.3 stored pixels at the 512 stored matrix and a 20 cm
// field, below what steepest-slope edges resolve (src/simulation/imaging/qca.ts, STORE_PX in
// src/state/useSeriesStore.ts).
//   npx vitest run src/ui/lab/pciQca.integration.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { PciLabSession } from "../pci/PciLabSession";
import { recordMeasurement } from "../pci/PciAssessPanel";
import { measureQca, qcaMeasurement, frameMeasurable } from "./QcaTool";
import { STORE_PX, useSeriesStore } from "../../state/useSeriesStore";
import { truthNow } from "../../simulation/pci/actions/assessment";
import type { GrayFrame, Pt } from "../../simulation/imaging/qca";

const DIR = "datasets/tmp/captures/baseline/";
const SET = "lad_raocra";

interface NodeFs {
  existsSync(p: string): boolean;
  readFileSync(p: string): Uint8Array;
}

async function fs(): Promise<NodeFs> {
  return (await import("node:fs")) as unknown as NodeFs;
}

/**
 * The captured frames live in the realism pipeline's working directory (not part of the product). Without
 * them the end-to-end check is skipped with a notice rather than failed: nothing in the product changed.
 * Re-capture the baseline set (docs/realism/baseline.md) to run it.
 */
const HAVE_BASELINE = (await fs()).existsSync(`${DIR}${SET}.meta.png`);
if (!HAVE_BASELINE) console.warn(`pciQca.integration: the realism baseline capture ${DIR}${SET} is missing; the captured-frame QCA check is skipped (re-capture the baseline set, docs/realism/baseline.md).`);

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate");
  const out = new Response(new Blob([data]).stream().pipeThrough(ds));
  return new Uint8Array(await out.arrayBuffer());
}

/** Decode an 8-bit PNG (grey, grey-alpha, RGB or RGBA) to one grey channel. */
async function decodePng(buf: Uint8Array): Promise<{ w: number; h: number; data: Uint8Array }> {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let i = 8;
  let w = 0;
  let h = 0;
  let ct = 0;
  const idat: Uint8Array[] = [];
  while (i < buf.length) {
    const len = dv.getUint32(i);
    const type = String.fromCharCode(buf[i + 4], buf[i + 5], buf[i + 6], buf[i + 7]);
    const d = buf.subarray(i + 8, i + 8 + len);
    if (type === "IHDR") {
      w = dv.getUint32(i + 8);
      h = dv.getUint32(i + 12);
      expect(buf[i + 16], "8-bit PNG").toBe(8);
      ct = buf[i + 17];
    }
    if (type === "IDAT") idat.push(d);
    i += 12 + len;
  }
  const all = new Uint8Array(idat.reduce((n, d) => n + d.length, 0));
  let o = 0;
  for (const d of idat) {
    all.set(d, o);
    o += d.length;
  }
  const raw = await inflate(all);
  const bpp = ct === 0 ? 1 : ct === 4 ? 2 : ct === 2 ? 3 : 4;
  const stride = w * bpp;
  const out = new Uint8Array(w * h);
  let prev = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = row[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 255;
    }
    for (let x = 0; x < w; x++) out[y * w + x] = cur[x * bpp];
    prev = cur;
  }
  return { w, h, data: out };
}

/** The capture's metadata (a grey PNG whose bytes are "XCMETA1\n", an 8-digit length and UTF-8 JSON). */
async function readMeta(f: NodeFs): Promise<CaptureMeta> {
  const p = await decodePng(f.readFileSync(`${DIR}${SET}.meta.png`));
  const head = String.fromCharCode(...p.data.subarray(0, 16));
  expect(head.startsWith("XCMETA1\n")).toBe(true);
  const n = Number(head.slice(8, 16));
  return JSON.parse(new TextDecoder().decode(p.data.subarray(16, 16 + n))) as CaptureMeta;
}

interface CaptureMeta {
  spec: { scenario: string; cArm: { laoRao: number; cranialCaudal: number }; fieldCm: number; fps: number; nFrames: number; catheter: string };
  res: number;
  isoMmPerPx: number;
  annotations: { k: number; contraction: number; iodine: number; catheter: { pts: [number, number][] }; vessels: { name: string; pts: [number, number][] }[] }[];
}

/** Area-average a square frame down to the stored matrix (the live monitor draws the canvas into STORE_PX). */
function toStored(f: { w: number; h: number; data: Uint8Array }, n = STORE_PX): Uint8Array {
  const out = new Uint8Array(n * n);
  const k = f.w / n;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const x0 = x * k;
      const y0 = y * k;
      let s = 0;
      let c = 0;
      for (let yy = Math.floor(y0); yy < Math.min(f.h, Math.ceil(y0 + k)); yy++)
        for (let xx = Math.floor(x0); xx < Math.min(f.w, Math.ceil(x0 + k)); xx++) {
          s += f.data[yy * f.w + xx];
          c++;
        }
      out[y * n + x] = Math.round(s / c);
    }
  return out;
}

afterEach(() => useSeriesStore.getState().clear());

describe("trainee QCA on a stored PCI run (captured frames)", () => {
  it.skipIf(!HAVE_BASELINE)("calibrated on the 6 Fr guide, QCA of lad-focal on the best-filled end-diastolic frame of a stored run finds the stenosis and is recorded as the trainee's measurement", async () => {
    const f = await fs();
    expect(f.existsSync(`${DIR}${SET}.meta.png`), `the realism baseline capture ${DIR}${SET} is missing; re-capture the baseline set (docs/realism/baseline.md)`).toBe(true);
    const meta = await readMeta(f);
    expect(meta.spec.scenario).toBe("lad-focal");
    expect(meta.spec.catheter).toBe("guide");

    // the PCI lab session of the captured case; its cine run stores the captured frames as the live monitor would
    const x = new PciLabSession({ scenarioId: "lad-focal", team: false });
    try {
      x.setPedal({ fluoro: false, cine: true });
      for (let k = 0; k < meta.spec.nFrames; k++) {
        const png = await decodePng(f.readFileSync(`${DIR}${SET}_f${String(k).padStart(3, "0")}.png`));
        expect(png.w).toBe(meta.res);
        x.onExposedFrame(toStored(png), "cine");
        x.step(1 / meta.spec.fps);
      }
      x.setPedal({ fluoro: false, cine: false });
      const run = useSeriesStore.getState().series.find((s) => s.kind === "cine");
      expect(run, "the cine run is stored").toBeTruthy();
      expect(run!.frames.length).toBe(meta.spec.nFrames);

      // the trainee's frame: end-diastolic (contraction at its minimum) and best filled
      const ed = meta.annotations.filter((a) => a.contraction <= 0.05);
      const pick = ed.reduce((a, b) => (b.iodine > a.iodine ? b : a));
      const frame: GrayFrame = { w: run!.w, h: run!.h, data: run!.frames[pick.k] };
      expect(frameMeasurable(frame)).toBe(true);
      const s = run!.w / meta.res;
      const toPt = ([px, py]: [number, number]): Pt => ({ x: px * s, y: py * s });

      // calibration: two marks along the guide's straight shaft; its French size from the session's guide
      const french = x.st.guide.french;
      expect(french).toBe(6);
      const cat = pick.catheter.pts.map(toPt);
      // segment: from the normal LAD proximal to the lesion to the normal LAD beyond it
      const lad = pick.vessels.find((v) => v.name === "LAD")!.pts.map(toPt);
      const m = measureQca(frame, { french, calMarks: [cat[8], cat[14]], segMarks: lad.slice(1, 15) });
      expect("error" in m ? m.error : "").toBe("");
      if ("error" in m) return;
      // the guide calibrates near the iso-centre scale of the stored frame (it lies at another depth: not exactly)
      const iso = meta.isoMmPerPx / s;
      expect(Math.abs(m.cal.mmPerPx / iso - 1)).toBeLessThan(0.25);

      const truth = truthNow(x.g, x.st);
      const err = m.result.mldMm - truth.mldMm;
      console.log(
        `QCA on stored frame ${pick.k} (${STORE_PX} px, ${m.cal.mmPerPx.toFixed(3)} mm/px from the ${french} Fr guide): MLD ${m.result.mldMm.toFixed(2)} mm against truthNow ${truth.mldMm.toFixed(2)} mm (error ${err >= 0 ? "+" : ""}${err.toFixed(2)} mm), DS ${m.result.dsPct.toFixed(0)} % against ${truth.dsPct} %, reference ${m.result.refMm.toFixed(2)} against ${truth.refMm.toFixed(2)} mm`
      );
      // a significant stenosis is found: the narrowest point is less than half the reference
      expect(m.result.dsPct).toBeGreaterThan(50);
      expect(m.result.mldMm).toBeLessThan(truth.refMm / 2);

      // the result is the trainee's measurement: recorded as 'lesion-estimate' telemetry against the truth
      const q = qcaMeasurement(m.result, m.cal);
      expect(recordMeasurement(x, q)).toBe(true);
      const tel = x.st.log.filter((r) => r.kind === "lesion-estimate").pop()!;
      expect(tel.data).toMatchObject({ method: "qca", french: 6, mldMm: m.result.mldMm, truth: { mldMm: truth.mldMm } });
      expect(x.st.estimate?.score.mldErrMm).toBeCloseTo(Math.abs(err), 9);
    } finally {
      x.dispose();
    }
  }, 60000);

  // The plan's acceptance target, not met on the stored matrix (see the header): kept as a pending item so
  // that the gap shows in every run of this file.
  it.todo("QCA on a stored PCI run calibrated on a 6 Fr guide returns MLD within 0.2 mm of truthNow for lad-focal (measured +0.36 mm on the captured frame)");
});
