import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { validateCanvasToken, normalizeCanvasUrl } from '@/lib/canvas';

const STEPS = [
  { number: '1', text: 'Open Canvas and go to Account → Settings' },
  { number: '2', text: 'Scroll to "Approved Integrations"' },
  { number: '3', text: 'Click "+ New Access Token"' },
  { number: '4', text: 'Enter "TeamSync Academic" as the purpose' },
  { number: '5', text: 'Leave expiration blank and click "Generate Token"' },
  { number: '6', text: 'Copy the token and paste it below' },
];

export default function ConnectCanvasScreen() {
  const [canvasUrl, setCanvasUrl] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [connectedName, setConnectedName] = useState('');
  const { session, setCanvasConnected } = useAuthStore();

  const handleConnect = async () => {
    setError('');

    if (!canvasUrl.trim()) {
      setError('Please enter your Canvas URL.');
      return;
    }
    if (!token.trim()) {
      setError('Please paste your Canvas access token.');
      return;
    }
    if (!session?.user) return;

    setLoading(true);
    try {
      const baseUrl = normalizeCanvasUrl(canvasUrl);

      // Validate the token against Canvas API
      const result = await validateCanvasToken(baseUrl, token.trim());

      if (!result.valid || !result.user) {
        setError(result.error ?? 'Token validation failed.');
        return;
      }

      // Store the token in Supabase
      const { error: upsertError } = await supabase
        .from('canvas_tokens')
        .upsert({
          user_id: session.user.id,
          canvas_base_url: baseUrl,
          encrypted_token: token.trim(),
          canvas_user_id: result.user.id,
          canvas_user_name: result.user.name,
        }, {
          onConflict: 'user_id',
        });

      if (upsertError) {
        setError('Failed to save token: ' + upsertError.message);
        return;
      }

      // Trigger initial Canvas sync
      console.log('[Canvas] Token saved, triggering initial sync...');
      supabase.functions.invoke('canvas-sync').then(({ error: syncError }) => {
        if (syncError) console.warn('[Canvas] Initial sync error:', syncError);
        else console.log('[Canvas] Initial sync complete');
      });

      setCanvasConnected(true);
      setConnectedName(result.user.name);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.replace('/(player)');
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Text style={styles.successEmoji}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Canvas Connected!</Text>
        <Text style={styles.successSubtitle}>
          Signed in as {connectedName}
        </Text>
        <Text style={styles.successHint}>
          Your courses and assignments will sync automatically.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleContinue}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Continue to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag"
    >
      <Text style={styles.title}>Connect Canvas</Text>
      <Text style={styles.subtitle}>
        Link your Canvas LMS account to sync your courses and assignments.
      </Text>

      {/* Step-by-step guide */}
      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>How to get your access token:</Text>
        {STEPS.map((step) => (
          <View key={step.number} style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>{step.number}</Text>
            </View>
            <Text style={styles.stepText}>{step.text}</Text>
          </View>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.inputLabel}>Your Canvas URL</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. myschool.instructure.com"
        value={canvasUrl}
        onChangeText={setCanvasUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholderTextColor="#999"
      />

      <Text style={styles.inputLabel}>Access Token</Text>
      <TextInput
        style={[styles.input, styles.tokenInput]}
        placeholder="Paste your Canvas token here"
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        placeholderTextColor="#999"
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleConnect}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Connect Canvas</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          setCanvasConnected(true); // Skip flag so they aren't stuck in a loop
          router.replace('/(player)');
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  guideCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#d0e8f7',
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
  },
  tokenInput: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 14,
  },
  button: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 14,
  },
  error: {
    color: '#ff3b30',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 12,
  },
  // Success state
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 36,
    color: '#4caf50',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  successHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
});
