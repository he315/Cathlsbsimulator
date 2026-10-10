// The rod physics registered as the device physics implementation (diag-rod-physics): getPhysicsDevices()
// in src/ui/physics/types.ts globs this folder and returns it to any lab that asks. The implementation is
// RodPhysicsDevices in src/ui/physics/physicsDevices.ts (the Cosserat-rod solver of src/physics/, in a Web
// Worker when there is one).
import type { PhysicsDevicesImpl } from "../types";
import { RodPhysicsDevices } from "../physicsDevices";

export const physicsDevices: PhysicsDevicesImpl = {
  id: "rod",
  label: "Rod mechanics",
  order: 0,
  create: (opts) => new RodPhysicsDevices(opts),
};
