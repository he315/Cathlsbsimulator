// Test fixture for the physics registry (types.test.ts). Not globbed by
// getPhysicsDevices(): only src/ui/physics/impl/*.ts is.

import type { HandCommand } from "../../../../simulation/session/types";
import type { PhysicsDevices, PhysicsDevicesImpl, PhysicsDeviceKind, PhysicsReading, PhysicsSceneInit } from "../../types";

export interface FixturePhysics extends PhysicsDevices {
  scene: PhysicsSceneInit | null;
  loaded: { device: PhysicsDeviceKind; id: string } | null;
  commands: HandCommand[];
}

function createFixture(): FixturePhysics {
  let reading: PhysicsReading | null = null;
  let depth = 0;
  const self: FixturePhysics = {
    scene: null,
    loaded: null,
    commands: [],
    init(scene) {
      self.scene = scene;
      reading = null;
    },
    load(device, id) {
      self.loaded = { device, id };
    },
    remove() {
      self.loaded = null;
      reading = null;
    },
    command(cmd) {
      self.commands.push(cmd);
      if (cmd.kind === "push" && cmd.device === "catheter") depth += cmd.mm;
    },
    step(tClock) {
      if (!self.loaded) return;
      reading = {
        t: tClock,
        vessel: depth > 0 ? "LM" : null,
        side: depth > 0 ? "left" : null,
        depthMm: depth,
        coaxiality: depth > 0 ? 1 : 0,
        wallForce: 0,
        openFraction: 1,
        prolapsed: false,
        kind: depth > 0 ? "selective-lm" : "sinus-level",
        conus: false,
        costMs: 0.1,
      };
    },
    latest: () => reading,
    dispose() {
      self.loaded = null;
      reading = null;
    },
  };
  return self;
}

export const physicsDevices: PhysicsDevicesImpl = {
  id: "fixture",
  label: "Fixture mechanics",
  create: () => createFixture(),
};
