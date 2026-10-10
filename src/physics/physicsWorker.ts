// ---------------------------------------------------------------------------
// The device-physics Web Worker. Create it from the main thread with
//   new Worker(new URL("./physicsWorker.ts", import.meta.url), { type: "module" })
// (physicsClient.ts does this). It owns the rod solver; the main thread sends
// hand commands and the patient clock, the worker replies with node buffers
// stamped with that clock time, hub reactions and the engagement reading.
// ---------------------------------------------------------------------------

import { PhysicsHost, frameTransfers } from "./host";
import type { FromWorker, ToWorker } from "./protocol";

interface WorkerScope {
  onmessage: ((ev: MessageEvent<ToWorker>) => void) | null;
  postMessage(msg: FromWorker, transfer?: Transferable[]): void;
}

const scope = self as unknown as WorkerScope;
const host = new PhysicsHost();

scope.onmessage = (ev: MessageEvent<ToWorker>) => {
  for (const reply of host.handle(ev.data)) {
    if (reply.type === "frame") scope.postMessage(reply, frameTransfers(reply.frame));
    else scope.postMessage(reply);
  }
};
