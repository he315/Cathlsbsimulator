// Public API of the input layer (hands, grips, pedals and input devices).
export * from "./types";
export { createBus, createInputBus, type Bus, type InputBus, type Listener } from "./bus";
export * from "./settings";
export { HandState, autoPinFor, resolvePin, type HandOutput, type HandSnapshot, type HapticGains } from "./handState";
export { PedalMerger, hysteresis } from "./pedals";
export { KeyboardSource, KEYBOARD_SOURCE } from "./keyboard";
export { PointerLockMouse, MOUSE_SOURCE, DIRECT_ATTR, type MouseMode } from "./pointerLockMouse";
export { TrackpadSource, MomentumFilter, TRACKPAD_SOURCE, type WheelLike } from "./trackpad";
export { GamepadSource, mapGamepad, deadzone2, emptyPadMemory, PAD, type GamepadLike, type PadMemory } from "./gamepad";
export { MidiPedalSource, parseMidi, midiIntents, isPress, MIDI_SWITCH_ON, type MidiMessage } from "./midiPedals";
export {
  HidPedalSource,
  parseTorquerReport,
  encodeTorquerReport,
  torquerIntents,
  diffBits,
  bindingPressed,
  hidSwitchIntents,
  hidKey,
  isTorquer,
  TORQUER_INPUT_REPORT,
  TORQUER_OUTPUT_REPORT,
  TORQUER_USAGE_PAGE,
  TORQUER_USAGE,
  type TorquerReport,
} from "./hidPedals";
export {
  HapticsController,
  PseudoHapticGain,
  RumbleMapper,
  GamepadRumbleSink,
  pseudoTarget,
  rumbleAmplitude,
  torquerOutputReport,
  DEFAULT_PSEUDO,
  DEFAULT_RUMBLE,
  type RumbleEffect,
  type RumbleSink,
} from "./haptics";
export { CommandQueue } from "./commandQueue";
export { bridgeDiagnostic, bridgePci, applyToDiagnostic, applyToPci, type DiagnosticTarget, type PciTarget } from "./legacyAdapter";
export { InputSystem, createInputSystem, type InputSystemOptions } from "./system";
export { useInputSystem, useBusValue, useHandView, usePedals, useSources } from "./useInput";
