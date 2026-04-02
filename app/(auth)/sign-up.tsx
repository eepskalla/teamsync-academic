import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import { UserRole } from '@/lib/types';

const roles: { key: UserRole; label: string }[] = [
  { key: 'player', label: 'Player' },
  { key: 'coordinator', label: 'Academic Coordinator' },
  { key: 'coach', label: 'Coach' },
];

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const { signUp } = useAuthStore();

  const doSignUp = async () => {
    Alert.alert('DEBUG', 'Button tapped!');

    setError('');
    if (!fullName || !email || !password || !role) {
      setError('Please fill in all fields and select a role.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLocalLoading(true);
    try {
      await signUp(email.trim(), password, fullName.trim(), role);
      Alert.alert('Success', 'Account created!');
    } catch (e: any) {
      const msg = e.message ?? 'Sign up failed.';
      setError(msg);
      Alert.alert('Sign Up Error', msg);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="always"
    >
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join your team on TeamSync Academic</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        placeholderTextColor="#999"
      />

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

      <Text style={styles.roleLabel}>Select your role</Text>

      {roles.map((r) => (
        <Text
          key={r.key}
          style={[
            styles.roleOption,
            role === r.key && styles.roleOptionSelected,
          ]}
          onPress={() => setRole(r.key)}
        >
          {role === r.key ? '● ' : '○ '}{r.label}
        </Text>
      ))}

      <Text
        style={[styles.submitButton, localLoading && styles.submitButtonDisabled]}
        onPress={localLoading ? undefined : doSignUp}
      >
        {localLoading ? 'Creating Account...' : 'Create Account'}
      </Text>

      <Link href="/(auth)/login" asChild>
        <Text style={styles.footerText}>
          Already have an account? <Text style={styles.link}>Sign In</Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
  },
  roleOption: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  roleOptionSelected: {
    borderColor: '#0a7ea4',
    backgroundColor: '#e8f4f8',
    color: '#0a7ea4',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#0a7ea4',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  link: {
    color: '#0a7ea4',
    fontSize: 14,
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
