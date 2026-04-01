import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
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
  const { signUp, loading } = useAuthStore();

  const handleSignUp = async () => {
    setError('');
    if (!fullName || !email || !password || !role) {
      setError('Please fill in all fields and select a role.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      await signUp(email.trim(), password, fullName.trim(), role);
    } catch (e: any) {
      setError(e.message ?? 'Sign up failed.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
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
        <View style={styles.roleList}>
          {roles.map((r) => (
            <Pressable
              key={r.key}
              style={[
                styles.roleCard,
                role === r.key && styles.roleCardSelected,
              ]}
              onPress={() => setRole(r.key)}
            >
              <Text
                style={[
                  styles.roleText,
                  role === r.key && styles.roleTextSelected,
                ]}
              >
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </Pressable>

        <Link href="/(auth)/login" asChild>
          <Pressable>
            <Text style={styles.footerText}>
              Already have an account? <Text style={styles.link}>Sign In</Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
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
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  roleList: {
    gap: 12,
  },
  roleCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  roleCardSelected: {
    borderColor: '#0a7ea4',
    backgroundColor: '#e8f4f8',
  },
  roleText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  roleTextSelected: {
    color: '#0a7ea4',
    fontWeight: '600',
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
  link: {
    color: '#0a7ea4',
    textAlign: 'center',
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
  },
});
