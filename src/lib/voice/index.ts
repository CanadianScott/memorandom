export interface VoiceSettings {
  pitch: number;
  rate: number;
  voiceName?: string;
}

export const defaultVoiceSettings: VoiceSettings = {
  pitch: 1.0,
  rate: 0.95,
};
