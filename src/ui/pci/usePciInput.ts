// ---------------------------------------------------------------------------
// The PCI lab's hands and feet (pci-lab-input): the S8 input system the
// diagnostic lab uses, connected to the PCI session through pciInputTarget.
// The earlier lab's private key handler is gone; the keys are the input
// system's KeyboardSource, with the PCI keys (settings.pciKeymap):
//
//   W / S            advance / withdraw the device the right hand holds (held keys)
//   Q / E            roll it anticlockwise / clockwise (A / D as well)
//   1-5, Tab         move the right hand: guide, wire, device, syringe, sheath
//   Space            the left hand holds the usual partner (the wire while a
//                    device moves, the guide while the wire turns); R wire, G guide
//   J / K / L        push contrast, flush saline, pull back on the syringe (held)
//   F / C (held)     fluoroscopy / cine pedal
//   arrows           C-arm (Shift + arrows: table)
//   Shift            fine motion
// The gamepad, MIDI and USB foot switches and the torquer work as in the
// diagnostic lab. The right hand starts on the coronary wire.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { useInputSystem } from "../../input/useInput";
import { loadSettings, pciGripOrder, pciSettings } from "../../input/settings";
import type { InputSystem } from "../../input/system";
import type { PciLabSession } from "./PciLabSession";
import { connectPciInput, type PciInputTarget } from "./pciInputTarget";

export interface UsePciInputOptions {
  /** an element for the mouse (pointer lock) and the trackpad, usually the table strip; the keyboard is always on the window */
  attachTo?: HTMLElement | null;
}

/**
 * Bind the S8 input system to a PCI session while it is mounted (and `enabled`). Returns the input
 * system, for a table view, the table-side controls or the input-device dialogue to share.
 */
export function usePciInput(session: PciLabSession | null, enabled = true, o: UsePciInputOptions = {}): InputSystem {
  // the person's own settings with the PCI keys; nothing is written back from this lab (storage null)
  const [settings] = useState(() => pciSettings(loadSettings()));
  const input = useInputSystem({ loop: true, settings, storage: null, gripOrder: pciGripOrder(null), present: ["sheath", "catheter", "wire014"], initialGrip: "wire014" });
  const attachTo = o.attachTo ?? null;

  useEffect(() => {
    if (!session || !enabled) return;
    // the target puts the session's devices on the hands' table (present, grip order) and keeps them in step
    const { target, dispose } = connectPciInput(session, input);
    const offKeys = typeof window !== "undefined" ? input.keyboard.attach(window) : () => {};
    const w = (typeof window !== "undefined" ? window : {}) as Record<string, unknown>;
    if (import.meta.env?.DEV) w.__pciInput = { system: input, target };
    return () => {
      offKeys();
      // dead-man: nothing stays held when the lab goes or the case changes
      input.releaseAll();
      dispose();
      if (w.__pciInput && (w.__pciInput as { target: PciInputTarget }).target === target) delete w.__pciInput;
    };
  }, [session, enabled, input]);

  // the mouse and the trackpad, on the element the lab gives them
  useEffect(() => {
    if (!attachTo || !enabled) return;
    return input.attach(attachTo, { keyboard: false });
  }, [input, attachTo, enabled]);

  return input;
}
