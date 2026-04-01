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

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function CreateTeamScreen() {
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [sport, setSport] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { session, profile, setProfile } = useAuthStore();

  const handleCreate = async () => {
    setError('');
    if (!name || !institution || !sport) {
      setError('Please fill in all fields.');
      return;
    }
    if (!session?.user || !profile) return;

    setLoading(true);
    try {
      let code = '';
      let teamData = null;

      // Retry up to 3 times in case of invite code collision
      for (let attempt = 0; attempt < 3; attempt++) {
        code = generateInviteCode();
        const { data, error: insertError } = await supabase
          .from('teams')
          .insert({
            name: name.trim(),
            institution: institution.trim(),
            sport: sport.trim(),
            invite_code: code,
            created_by: session.user.id,
          })
          .select()
          .single();

        if (!insertError) {
          teamData = data;
          break;
        }
        if (attempt === 2) throw insertError;
      }

      if (!teamData) throw new Error('Failed to create team');

      // Update user's team_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ team_id: teamData.id })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, team_id: teamData.id });
      setInviteCode(code);
    } catch (e: any) {
      setError(e.message ?? 'Failed to create team.');
    } finally {
      setLoading(false);
    }
  };

  if (inviteCode) {
    return (
      <View style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.title}>Team Created!</Text>
          <Text style={styles.subtitle}>
            Share this invite code with your players and coaches:
          </Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{inviteCode}</Text>
          </View>
          <Text style={styles.hint}>
            They'll enter this code when they sign up to join your team.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Create Your Team</Text>
        <Text style={styles.subtitle}>Set up your team to get started</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Team Name"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.input}
          placeholder="Institution"
          value={institution}
          onChangeText={setInstitution}
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.input}
          placeholder="Sport"
          value={sport}
          onChangeText={setSport}
          placeholderTextColor="#999"
        />

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Team</Text>
          )}
        </Pressable>
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
    fontSize: 16,
    backgroundColor: '#f9f9f9',
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
  codeBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 6,
    color: '#0a7ea4',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  error: {
    color: '#ff3b30',
    textAlign: 'center',
    fontSize: 14,
  },
});
