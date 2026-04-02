import { useState } from 'react';
import {
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const { signIn } = useAuthStore();

  const doLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLocalLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      const msg = e.message ?? 'Sign in failed.';
      setError(msg);
      Alert.alert('Sign In Error', msg);
    } finally {
      setLocalLoading(false);
    }
  };

  const doForgotPassword = async () => {
    if (!email) {
      Alert.alert('Enter your email', 'Type your email above, then tap Forgot Password.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Check your email', 'A password reset link has been sent.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="always"
    >
      <Text style={styles.title}>TeamSync Academic</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#999"
      />

      <Text
        style={[styles.button, localLoading && styles.buttonDisabled]}
        onPress={localLoading ? undefined : doLogin}
      >
        {localLoading ? 'Signing In...' : 'Sign In'}
      </Text>

      <Text style={styles.link} onPress={doForgotPassword}>
        Forgot password?
      </Text>

      <Link href="/(auth)/sign-up" asChild>
        <Text style={styles.footerText}>
          Don't have an account? <Text style={styles.link}>Sign Up</Text>
        </Text>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
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
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#0a7ea4',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  link: {
    color: '#0a7ea4',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 16,
  },
  footerText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  error: {
    color: '#ff3b30',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 12,
  },
});
