import { ELEVENLABS_VOICES, Voice } from './elevenLabsVoices';

// Mapping of version codes to allowed voices
// Finnish versions can use all voices, other languages may be restricted
export const VERSION_ALLOWED_VOICES: Record<string, string[]> = {
  // Finnish Bible versions - all voices allowed
  'finstlk201': ELEVENLABS_VOICES.map(v => v.id),
  'finpr_finn': ELEVENLABS_VOICES.map(v => v.id),
  
  // Add more versions and their allowed voices here
  // Example for an English version (if you add one):
  // 'kjv': ['roger', 'charlie', 'george', 'liam', 'will', 'eric', 'chris', 'brian', 'daniel', 'bill'],
};

// Special voice ID for "no audio"
export const NO_AUDIO_VOICE_ID = 'no-audio';

export interface VoiceOption extends Voice {
  disabled?: boolean;
}

/**
 * Get all voice options for a specific version, including "no audio" option
 */
export const getVoiceOptionsForVersion = (versionCode: string): VoiceOption[] => {
  const allowedVoiceIds = VERSION_ALLOWED_VOICES[versionCode];
  
  if (!allowedVoiceIds || allowedVoiceIds.length === 0) {
    // If version not found or has no voices, return only "no audio" option
    return [{
      id: NO_AUDIO_VOICE_ID,
      name: 'Ei ääntä toistaiseksi',
      voiceId: NO_AUDIO_VOICE_ID
    }];
  }

  // Filter voices that are allowed for this version
  const allowedVoices = ELEVENLABS_VOICES.filter(v => allowedVoiceIds.includes(v.id));

  // Add "no audio" option at the beginning
  return [
    {
      id: NO_AUDIO_VOICE_ID,
      name: 'Ei ääntä toistaiseksi',
      voiceId: NO_AUDIO_VOICE_ID
    },
    ...allowedVoices
  ];
};

/**
 * Check if a voice is allowed for a version
 */
export const isVoiceAllowedForVersion = (versionCode: string, voiceId: string): boolean => {
  if (voiceId === NO_AUDIO_VOICE_ID) return true;
  
  const allowedVoiceIds = VERSION_ALLOWED_VOICES[versionCode];
  return allowedVoiceIds ? allowedVoiceIds.includes(voiceId) : false;
};

/**
 * Get default voice for a version
 */
export const getDefaultVoiceForVersion = (versionCode: string): string => {
  const allowedVoiceIds = VERSION_ALLOWED_VOICES[versionCode];
  
  if (!allowedVoiceIds || allowedVoiceIds.length === 0) {
    return NO_AUDIO_VOICE_ID;
  }

  // Return first allowed voice as default
  return allowedVoiceIds[0];
};
