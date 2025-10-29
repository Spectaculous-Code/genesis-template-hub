// ElevenLabs voice configurations
export interface Voice {
  id: string;
  name: string;
  voiceId: string;
}

export const ELEVENLABS_VOICES: Voice[] = [
  { id: 'venla', name: 'Venla (nainen)', voiceId: 'T5qAFgaL2uYxoUtojUzQ' },
  { id: 'urho', name: 'Urho (mies)', voiceId: '1WVCONUwYGulVaKg4oTr' },
];

export const DEFAULT_VOICE = ELEVENLABS_VOICES[0]; // Venla

export const getVoiceById = (id: string): Voice | undefined => {
  return ELEVENLABS_VOICES.find(v => v.id === id);
};

export const getVoiceReaderKey = (voiceId: string): string => {
  return `elevenlabs:${voiceId}`;
};
