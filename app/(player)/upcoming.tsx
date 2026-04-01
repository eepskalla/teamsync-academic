import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo } from 'react';
import { useCanvasData } from '@/hooks/use-canvas-data';

function getRelativeLabel(dateStr: string): string {
  const now = new Date();
  const target = new Date(dateStr);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const diffMs = targetDay.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return 'This Week';
  if (diffDays <= 14) return 'Next Week';
  return 'Later';
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getSectionColor(label: string): string {
  switch (label) {
    case 'Overdue':
      return '#e74c3c';
    case 'Today':
      return '#e67e22';
    case 'Tomorrow':
      return '#f39c12';
    default:
      return '#0a7ea4';
  }
}

function getStatusInfo(status: string | null): { label: string; color: string; bg: string } {
  switch (status) {
    case 'submitted':
      return { label: 'Submitted', color: '#4caf50', bg: '#e8f5e9' };
    case 'graded':
      return { label: 'Graded', color: '#2196f3', bg: '#e3f2fd' };
    case 'late':
      return { label: 'Late', color: '#e74c3c', bg: '#fce4ec' };
    default:
      return { label: 'Pending', color: '#888', bg: '#f5f5f5' };
  }
}

export default function PlayerUpcoming() {
  const { assignments, loading, refreshing, refresh } = useCanvasData();

  // Group assignments into sections by relative date
  const sections = useMemo(() => {
    // Only show assignments that have a due date and aren't completed
    const upcoming = assignments.filter((a) => {
      if (!a.due_at) return false;
      return true; // Show all, including submitted, so players can see full picture
    });

    const grouped = new Map<string, typeof assignments>();
    const order = ['Overdue', 'Today', 'Tomorrow', 'This Week', 'Next Week', 'Later'];

    for (const a of upcoming) {
      const label = getRelativeLabel(a.due_at!);
      if (!grouped.has(label)) grouped.set(label, []);
      grouped.get(label)!.push(a);
    }

    return order
      .filter((label) => grouped.has(label))
      .map((label) => ({
        title: label,
        data: grouped.get(label)!,
      }));
  }, [assignments]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalPending = assignments.filter(
    (a) =>
      a.due_at &&
      new Date(a.due_at) >= new Date() &&
      a.submission_status !== 'submitted' &&
      a.submission_status !== 'graded'
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Upcoming</Text>
      <Text style={styles.subtitle}>
        {totalPending} assignment{totalPending !== 1 ? 's' : ''} pending
      </Text>

      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptyText}>
            No upcoming assignments. Pull down to refresh.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#0a7ea4"
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionDot,
                  { backgroundColor: getSectionColor(section.title) },
                ]}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: getSectionColor(section.title) },
                ]}
              >
                {section.title}
              </Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const statusInfo = getStatusInfo(item.submission_status);

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.assignmentName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={[styles.statusPill, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <Text style={styles.courseName} numberOfLines={1}>
                    {(item as any).courses?.name ?? 'Unknown course'}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.dueText}>
                      {item.due_at ? formatTime(item.due_at) : 'No due date'}
                    </Text>
                    {item.points_possible ? (
                      <Text style={styles.pointsText}>
                        {item.points_possible} pts
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  sectionCount: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assignmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    flex: 1,
    marginRight: 10,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardBottom: {},
  courseName: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dueText: {
    fontSize: 12,
    color: '#666',
  },
  pointsText: {
    fontSize: 12,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
