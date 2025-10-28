import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { getDefaultVoiceForVersion, NO_AUDIO_VOICE_ID } from '@/lib/versionVoices';

export interface VoicePreference {
  version_id: string;
  voice_id: string;
}

export const useVoicePreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPreferences({});
      setLoading(false);
      return;
    }

    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_voice_preferences')
        .select('version_id, voice_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching voice preferences:', error);
        return;
      }

      const prefs: Record<string, string> = {};
      data?.forEach((pref) => {
        prefs[pref.version_id] = pref.voice_id;
      });

      setPreferences(prefs);
    } catch (error) {
      console.error('Error in fetchPreferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVoiceForVersion = (versionId: string, versionCode: string): string => {
    // Return user's preference if exists
    if (preferences[versionId]) {
      return preferences[versionId];
    }

    // Return default voice for version
    return getDefaultVoiceForVersion(versionCode);
  };

  const setVoiceForVersion = async (versionId: string, voiceId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_voice_preferences')
        .upsert({
          user_id: user.id,
          version_id: versionId,
          voice_id: voiceId,
        }, {
          onConflict: 'user_id,version_id'
        });

      if (error) {
        console.error('Error saving voice preference:', error);
        throw error;
      }

      // Update local state
      setPreferences(prev => ({
        ...prev,
        [versionId]: voiceId
      }));
    } catch (error) {
      console.error('Error in setVoiceForVersion:', error);
      throw error;
    }
  };

  const hasAudioForVersion = (versionId: string): boolean => {
    const voiceId = preferences[versionId];
    return voiceId !== NO_AUDIO_VOICE_ID && voiceId !== undefined;
  };

  return {
    preferences,
    loading,
    getVoiceForVersion,
    setVoiceForVersion,
    hasAudioForVersion,
    refetch: fetchPreferences
  };
};
