import { View, Text, StyleSheet } from 'react-native';

export default function CoordinatorScheduler() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scheduler</Text>
      <Text style={styles.subtitle}>Coordinator view</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 8 },
});
