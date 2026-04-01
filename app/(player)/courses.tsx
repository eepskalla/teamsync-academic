import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCanvasData } from '@/hooks/use-canvas-data';
import { Course } from '@/lib/types';

function getAssignmentStats(assignments: any[], courseId: string) {
  const courseAssignments = assignments.filter((a) => a.course_id === courseId);
  const total = courseAssignments.length;
  const submitted = courseAssignments.filter(
    (a) => a.submission_status === 'submitted' || a.submission_status === 'graded'
  ).length;
  const upcoming = courseAssignments.filter((a) => {
    if (!a.due_at) return false;
    return new Date(a.due_at) > new Date() && a.submission_status !== 'submitted' && a.submission_status !== 'graded';
  }).length;
  return { total, submitted, upcoming };
}

const COURSE_COLORS = ['#0a7ea4', '#6b5ce7', '#e67e22', '#27ae60', '#e74c3c', '#8e44ad', '#2980b9', '#16a085'];

export default function PlayerCourses() {
  const { courses, assignments, loading, refreshing, refresh } = useCanvasData();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderCourse = ({ item, index }: { item: Course; index: number }) => {
    const color = COURSE_COLORS[index % COURSE_COLORS.length];
    const stats = getAssignmentStats(assignments, item.id);
    const isExpanded = expandedId === item.id;
    const courseAssignments = assignments.filter((a) => a.course_id === item.id);

    return (
      <View style={styles.courseCard}>
        <TouchableOpacity
          style={styles.courseHeader}
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.colorBar, { backgroundColor: color }]} />
          <View style={styles.courseInfo}>
            <Text style={styles.courseName} numberOfLines={2}>{item.name}</Text>
            {item.course_code ? (
              <Text style={styles.courseCode}>{item.course_code}</Text>
            ) : null}
            {item.term ? (
              <Text style={styles.courseTerm}>{item.term}</Text>
            ) : null}
          </View>
          <View style={styles.statsColumn}>
            <Text style={styles.statNumber}>{stats.upcoming}</Text>
            <Text style={styles.statLabel}>due</Text>
          </View>
        </TouchableOpacity>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: color,
                  width: stats.total > 0 ? `${(stats.submitted / stats.total) * 100}%` : '0%',
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {stats.submitted}/{stats.total} submitted
          </Text>
        </View>

        {/* Expanded assignment list */}
        {isExpanded && courseAssignments.length > 0 && (
          <View style={styles.assignmentList}>
            {courseAssignments.map((a) => {
              const isPast = a.due_at && new Date(a.due_at) < new Date();
              const isDone = a.submission_status === 'submitted' || a.submission_status === 'graded';

              return (
                <View key={a.id} style={styles.assignmentRow}>
                  <View
                    style={[
                      styles.checkCircle,
                      isDone && styles.checkCircleDone,
                      isDone && { borderColor: color, backgroundColor: color },
                    ]}
                  >
                    {isDone && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <View style={styles.assignmentInfo}>
                    <Text
                      style={[
                        styles.assignmentName,
                        isDone && styles.assignmentNameDone,
                      ]}
                      numberOfLines={1}
                    >
                      {a.name}
                    </Text>
                    <Text style={styles.assignmentDue}>
                      {a.due_at
                        ? `Due ${new Date(a.due_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}`
                        : 'No due date'}
                      {a.points_possible ? ` · ${a.points_possible} pts` : ''}
                    </Text>
                  </View>
                  {isPast && !isDone && (
                    <View style={styles.overdueBadge}>
                      <Text style={styles.overdueText}>Overdue</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {isExpanded && courseAssignments.length === 0 && (
          <Text style={styles.noAssignments}>No assignments synced</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Courses</Text>
      <Text style={styles.subtitle}>{courses.length} active courses</Text>

      {courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No courses yet</Text>
          <Text style={styles.emptyText}>
            Connect Canvas and sync to see your courses here.
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={refresh}>
            <Text style={styles.refreshButtonText}>Sync Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={renderCourse}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#0a7ea4"
            />
          }
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
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  courseCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  colorBar: {
    width: 4,
    height: 44,
    borderRadius: 2,
    marginRight: 14,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  courseCode: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  courseTerm: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 1,
  },
  statsColumn: {
    alignItems: 'center',
    marginLeft: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginRight: 10,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#999',
    minWidth: 80,
    textAlign: 'right',
  },
  assignmentList: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkCircleDone: {
    borderColor: '#4caf50',
    backgroundColor: '#4caf50',
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentName: {
    fontSize: 14,
    color: '#333',
  },
  assignmentNameDone: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  assignmentDue: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  overdueBadge: {
    backgroundColor: '#fff0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  overdueText: {
    fontSize: 11,
    color: '#e74c3c',
    fontWeight: '600',
  },
  noAssignments: {
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
    paddingVertical: 12,
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
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
