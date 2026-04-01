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
    Alert.alert('DEBUG', 'Button was pressed!');
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
      Alert.alert('Success', 'Account created successfully!');
    } catch (e: any) {
      const msg = e.message ?? 'Sign up failed.';
      setError(msg);
      Alert.alert('Sign Up Error', msg);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag"
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
        <TouchableOpacity
          key={r.key}
          style={[
            styles.roleCard,
            role === r.key && styles.roleCardSelected,
          ]}
          onPress={() => setRole(r.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.roleText,
              role === r.key && styles.roleTextSelected,
            ]}
          >
            {r.label}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <Link href="/(auth)/login" asChild>
        <TouchableOpacity>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.link}>Sign In</Text>
          </Text>
        </TouchableOpacity>
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
  roleCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
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
    marginTop: 16,
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
    marginBottom: 8,
  },
});
