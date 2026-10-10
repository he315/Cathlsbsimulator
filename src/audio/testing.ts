// ---------------------------------------------------------------------------
// A recording stand-in for AudioContext, for tests in Node (no Web Audio).
// It implements the subset the audio module uses, records every node, every
// start/stop and every automation event, and evaluates an AudioParam's value
// at a time from its automation list, so timing can be checked exactly.
// Not used by the app.
// ---------------------------------------------------------------------------

type Ev = { type: "set" | "linear" | "exp" | "target"; v: number; t: number; tau?: number };

export class FakeParam {
  events: Ev[] = [];
  constructor(public value: number) {}
  setValueAtTime(v: number, t: number) {
    this.events.push({ type: "set", v, t });
    return this;
  }
  linearRampToValueAtTime(v: number, t: number) {
    this.events.push({ type: "linear", v, t });
    return this;
  }
  exponentialRampToValueAtTime(v: number, t: number) {
    this.events.push({ type: "exp", v, t });
    return this;
  }
  setTargetAtTime(v: number, t: number, tau: number) {
    this.events.push({ type: "target", v, t, tau });
    return this;
  }
  cancelScheduledValues(t: number) {
    this.events = this.events.filter((e) => e.t < t);
    return this;
  }
  cancelAndHoldAtTime(t: number) {
    return this.cancelScheduledValues(t);
  }
  /** Value at time t from the automation list (Web Audio semantics, simplified). */
  valueAt(t: number): number {
    let v = this.value;
    let tPrev = 0;
    const evs = [...this.events].sort((a, b) => a.t - b.t);
    for (let i = 0; i < evs.length; i++) {
      const e = evs[i];
      if (e.type === "target") {
        if (t < e.t) break;
        const next = evs[i + 1];
        const end = next && next.t <= t ? next.t : t;
        v = e.v + (v - e.v) * Math.exp(-(end - e.t) / (e.tau || 1e-9));
        tPrev = end;
        if (end === t) return v;
        continue;
      }
      if (e.t > t) {
        if (e.type === "linear") return v + ((e.v - v) * (t - tPrev)) / Math.max(1e-9, e.t - tPrev);
        if (e.type === "exp" && v > 0 && e.v > 0) return v * Math.pow(e.v / v, (t - tPrev) / Math.max(1e-9, e.t - tPrev));
        return v;
      }
      v = e.v;
      tPrev = e.t;
    }
    return v;
  }
}

export class FakeNode {
  connections: unknown[] = [];
  disconnected = false;
  constructor(public ctx: FakeAudioContext, public kind: string) {
    ctx.nodes.push(this);
  }
  connect<T>(n: T): T {
    this.connections.push(n);
    return n;
  }
  disconnect() {
    this.connections = [];
    this.disconnected = true;
  }
}

class FakeGain extends FakeNode {
  gain = new FakeParam(1);
  constructor(c: FakeAudioContext) {
    super(c, "gain");
  }
}

class FakeScheduled extends FakeNode {
  startT: number | null = null;
  stopT: number | null = null;
  onended: (() => void) | null = null;
  start(t = 0) {
    this.startT = t;
  }
  stop(t = 0) {
    this.stopT = t;
  }
}

class FakeOsc extends FakeScheduled {
  type = "sine";
  frequency = new FakeParam(440);
  detune = new FakeParam(0);
  wave: unknown = null;
  constructor(c: FakeAudioContext) {
    super(c, "oscillator");
  }
  setPeriodicWave(w: unknown) {
    this.wave = w;
    this.type = "custom";
  }
}

class FakeBufferSource extends FakeScheduled {
  buffer: unknown = null;
  loop = false;
  playbackRate = new FakeParam(1);
  constructor(c: FakeAudioContext) {
    super(c, "buffer");
  }
}

class FakeBiquad extends FakeNode {
  type = "lowpass";
  frequency = new FakeParam(350);
  Q = new FakeParam(1);
  gain = new FakeParam(0);
  constructor(c: FakeAudioContext) {
    super(c, "biquad");
  }
}

class FakeCompressor extends FakeNode {
  threshold = new FakeParam(-24);
  knee = new FakeParam(30);
  ratio = new FakeParam(12);
  attack = new FakeParam(0.003);
  release = new FakeParam(0.25);
  constructor(c: FakeAudioContext) {
    super(c, "compressor");
  }
}

class FakeShaper extends FakeNode {
  curve: Float32Array | null = null;
  oversample = "none";
  constructor(c: FakeAudioContext) {
    super(c, "shaper");
  }
}

export class FakeAudioContext {
  /** exact sample clock; currentTime is it quantised to render quanta */
  private exact = 0;
  currentTime = 0;
  sampleRate = 48000;
  state: "suspended" | "running" | "closed" = "suspended";
  nodes: FakeNode[] = [];
  destination: FakeNode;
  constructor() {
    this.destination = new FakeNode(this, "destination");
  }
  resume() {
    this.state = "running";
    return Promise.resolve();
  }
  suspend() {
    this.state = "suspended";
    return Promise.resolve();
  }
  close() {
    this.state = "closed";
    return Promise.resolve();
  }
  createGain() {
    return new FakeGain(this);
  }
  createOscillator() {
    return new FakeOsc(this);
  }
  createBufferSource() {
    return new FakeBufferSource(this);
  }
  createBiquadFilter() {
    return new FakeBiquad(this);
  }
  createDynamicsCompressor() {
    return new FakeCompressor(this);
  }
  createWaveShaper() {
    return new FakeShaper(this);
  }
  createPeriodicWave(real: Float32Array, imag: Float32Array) {
    return { real: Array.from(real), imag: Array.from(imag) };
  }
  createBuffer(channels: number, length: number, sampleRate: number) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { numberOfChannels: channels, length, sampleRate, duration: length / sampleRate, getChannelData: (c: number) => data[c] };
  }
  /** Advance the audio clock, quantised to 128-sample render quanta like a real context. */
  advance(dt: number) {
    const q = 128 / this.sampleRate;
    this.exact += dt;
    this.currentTime = Math.floor(this.exact / q + 1e-9) * q;
  }
  oscillators(): FakeOsc[] {
    return this.nodes.filter((n): n is FakeOsc => n.kind === "oscillator");
  }
  sources(): FakeBufferSource[] {
    return this.nodes.filter((n): n is FakeBufferSource => n.kind === "buffer");
  }
  /** The gain node an oscillator feeds (its envelope). */
  envelopeOf(n: FakeNode): FakeGain | null {
    const g = n.connections.find((c) => (c as FakeNode).kind === "gain") as FakeGain | undefined;
    if (g) return g;
    const f = n.connections.find((c) => (c as FakeNode).kind === "biquad") as FakeNode | undefined;
    return f ? ((f.connections.find((c) => (c as FakeNode).kind === "gain") as FakeGain | undefined) ?? null) : null;
  }
  asAudioContext(): AudioContext {
    return this as unknown as AudioContext;
  }
}
