import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';

type Role = 'player' | 'coordinator' | 'coach';

const roles: { key: Role; label: string; description: string }[] = [
  { key: 'player', label: 'Player', description: 'View your schedule, courses, and upcoming events' },
  { key: 'coordinator', label: 'Academic Coordinator', description: 'Manage rosters, scheduling, and reports' },
  { key: 'coach', label: 'Coach', description: 'Team overview, calendar, and academic alerts' },
];

export default function RoleSelection() {
  const handleRoleSelect = (role: Role) => {
    // TODO: Replace with real auth — store role in Zustand/Supabase
    router.replace(`/(${role})` as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TeamSync Academic</Text>
      <Text style={styles.subtitle}>Select your role to continue</Text>

      <View style={styles.roleList}>
        {roles.map((role) => (
          <Pressable
            key={role.key}
            style={styles.roleCard}
            onPress={() => handleRoleSelect(role.key)}
          >
            <Text style={styles.roleLabel}>{role.label}</Text>
            <Text style={styles.roleDescription}>{role.description}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  roleList: {
    width: '100%',
    gap: 16,
  },
  roleCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  roleLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
  },
});
