// Lab audio (plan stream S15, track C4): synthesised monitor, alarm, X-ray and device sounds, and team voices.
export { AudioEngine, CHANNELS, CHANNEL_LABEL, DEFAULT_AUDIO, channelGain, loadAudioSettings, saveAudioSettings, sanitizeAudio, type AudioSettings, type Channel, type ChannelSetting } from "./engine";
export { LabAudio, type AudioPatientPort } from "./labAudio";
export { PulseToneScheduler, spo2ToHz, PULSE_TONE } from "./monitorTone";
export { AlarmPlayer, ALARM_REPEAT_S } from "./alarms";
export { ALARM_PATTERNS, SOUND_PARAMS, burstOnsets, click, type ClickKind, type ExposureMode, type AlarmPriority } from "./sounds";
export { TeamVoices, localVoices, speakable, ROLE_VOICE } from "./speech";
