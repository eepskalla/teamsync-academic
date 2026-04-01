import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

export default function PlayerSettings() {
  const { profile, signOut, canvasConnected } = useAuthStore();
  const [canvasInfo, setCanvasInfo] = useState<{
    canvas_user_name: string | null;
    canvas_base_url: string | null;
    connected_at: string | null;
  } | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from('canvas_tokens')
      .select('canvas_user_name, canvas_base_url, connected_at')
      .eq('user_id', profile.id)
      .single()
      .then(({ data }) => {
        if (data) setCanvasInfo(data);
      });
  }, [profile?.id]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  const handleReconnectCanvas = () => {
    router.push('/(onboarding)/connect-canvas');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        {/* Account section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{profile?.full_name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{profile?.email}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>Player</Text>
          </View>
        </View>

        {/* Canvas section */}
        <Text style={styles.sectionTitle}>Canvas Integration</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: canvasConnected ? '#4caf50' : '#ccc' },
                ]}
              />
              <Text style={styles.value}>
                {canvasConnected ? 'Connected' : 'Not connected'}
              </Text>
            </View>
          </View>
          {canvasInfo && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>Canvas User</Text>
                <Text style={styles.value}>{canvasInfo.canvas_user_name}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>Instance</Text>
                <Text style={styles.value} numberOfLines={1}>
                  {canvasInfo.canvas_base_url?.replace('https://', '')}
                </Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.canvasButton}
          onPress={handleReconnectCanvas}
          activeOpacity={0.7}
        >
          <Text style={styles.canvasButtonText}>
            {canvasConnected ? 'Reconnect Canvas' : 'Connect Canvas'}
          </Text>
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  label: {
    fontSize: 15,
    color: '#666',
  },
  value: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '60%',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  canvasButton: {
    borderWidth: 1,
    borderColor: '#0a7ea4',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  canvasButtonText: {
    color: '#0a7ea4',
    fontSize: 15,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
