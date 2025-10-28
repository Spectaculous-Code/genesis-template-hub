// ElevenLabs voice configurations
export interface Voice {
  id: string;
  name: string;
  voiceId: string;
}

export const ELEVENLABS_VOICES: Voice[] = [
  { id: 'aria', name: 'Aria (nainen)', voiceId: '9BWtsMINqrJLrRacOk9x' },
  { id: 'sarah', name: 'Sarah (nainen)', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { id: 'laura', name: 'Laura (nainen)', voiceId: 'FGY2WhTYpPnrIDTdsKH5' },
  { id: 'charlotte', name: 'Charlotte (nainen)', voiceId: 'XB0fDUnXU5powFXDhCwa' },
  { id: 'alice', name: 'Alice (nainen)', voiceId: 'Xb7hH8MSUJpSbSDYk0k2' },
  { id: 'matilda', name: 'Matilda (nainen)', voiceId: 'XrExE9yKIg1WjnnlVkGX' },
  { id: 'jessica', name: 'Jessica (nainen)', voiceId: 'cgSgspJ2msm6clMCkdW9' },
  { id: 'lily', name: 'Lily (nainen)', voiceId: 'pFZP5JQG7iQjIQuC4Bku' },
  { id: 'roger', name: 'Roger (mies)', voiceId: 'CwhRBWXzGAHq8TQ4Fs17' },
  { id: 'charlie', name: 'Charlie (mies)', voiceId: 'IKne3meq5aSn9XLyUdCD' },
  { id: 'george', name: 'George (mies)', voiceId: 'JBFqnCBsd6RMkjVDRZzb' },
  { id: 'callum', name: 'Callum (mies)', voiceId: 'N2lVS1w4EtoT3dr4eOWO' },
  { id: 'liam', name: 'Liam (mies)', voiceId: 'TX3LPaxmHKxFdv7VOQHJ' },
  { id: 'will', name: 'Will (mies)', voiceId: 'bIHbv24MWmeRgasZH58o' },
  { id: 'eric', name: 'Eric (mies)', voiceId: 'cjVigY5qzO86Huf0OWal' },
  { id: 'chris', name: 'Chris (mies)', voiceId: 'iP95p4xoKVk53GoZ742B' },
  { id: 'brian', name: 'Brian (mies)', voiceId: 'nPczCjzI2devNBz1zQrb' },
  { id: 'daniel', name: 'Daniel (mies)', voiceId: 'onwK4e9ZLuTAKqWW03F9' },
  { id: 'bill', name: 'Bill (mies)', voiceId: 'pqHfZKP75CvOlQylNhV4' },
  { id: 'river', name: 'River (neutraali)', voiceId: 'SAz9YHcvj6GT2YYXdXww' },
];

export const DEFAULT_VOICE = ELEVENLABS_VOICES[0]; // Aria

export const getVoiceById = (id: string): Voice | undefined => {
  return ELEVENLABS_VOICES.find(v => v.id === id);
};

export const getVoiceReaderKey = (voiceId: string): string => {
  return `elevenlabs:${voiceId}`;
};
