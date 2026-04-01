import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { Team } from '@/lib/types';

export default function JoinTeamScreen() {
  const [code, setCode] = useState('');
  const [team, setTeam] = useState<Team | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { session, profile, setProfile } = useAuthStore();

  const handleLookup = async () => {
    setError('');
    setTeam(null);
    if (!code.trim()) {
      setError('Please enter an invite code.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: lookupError } = await supabase
        .from('teams')
        .select('*')
        .eq('invite_code', code.trim().toUpperCase())
        .single();

      if (lookupError || !data) {
        setError('Invalid invite code. Please check and try again.');
        return;
      }

      setTeam(data);
    } catch (e: any) {
      setError(e.message ?? 'Lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!team || !session?.user || !profile) return;

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ team_id: team.id })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, team_id: team.id });
    } catch (e: any) {
      setError(e.message ?? 'Failed to join team.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Join Your Team</Text>
        <Text style={styles.subtitle}>
          Enter the invite code from your coordinator
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!team ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Invite Code"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              maxLength={6}
              placeholderTextColor="#999"
            />

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLookup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Look Up Team</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.teamCard}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamDetail}>{team.institution}</Text>
              <Text style={styles.teamDetail}>{team.sport}</Text>
            </View>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleJoin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Confirm & Join</Text>
              )}
            </Pressable>

            <Pressable onPress={() => { setTeam(null); setCode(''); }}>
              <Text style={styles.link}>Try a different code</Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
    letterSpacing: 6,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  teamCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#0a7ea4',
    gap: 4,
  },
  teamName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  teamDetail: {
    fontSize: 16,
    color: '#666',
  },
  link: {
    color: '#0a7ea4',
    textAlign: 'center',
    fontSize: 14,
  },
  error: {
    color: '#ff3b30',
    textAlign: 'center',
    fontSize: 14,
  },
});
