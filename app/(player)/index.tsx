import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCanvasData } from '@/hooks/use-canvas-data';
import { useAuthStore } from '@/lib/store';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getStatusColor(status: string | null): string {
  switch (status) {
    case 'submitted':
    case 'graded':
      return '#4caf50';
    case 'late':
      return '#ff9800';
    default:
      return '#0a7ea4';
  }
}

export default function PlayerCalendar() {
  const { profile } = useAuthStore();
  const { assignments, loading } = useCanvasData();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Build a map of date → assignments
  const assignmentsByDate = useMemo(() => {
    const map = new Map<string, typeof assignments>();
    for (const a of assignments) {
      if (!a.due_at) continue;
      const date = new Date(a.due_at);
      const key = formatDateKey(date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [assignments]);

  const [selectedDate, setSelectedDate] = useState<string>(formatDateKey(new Date()));

  const selectedAssignments = assignmentsByDate.get(selectedDate) ?? [];

  // Calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const todayKey = formatDateKey(new Date());

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.greeting}>
        Hi, {profile?.full_name?.split(' ')[0] ?? 'there'}!
      </Text>

      {/* Month navigation */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={prevMonth} style={styles.navButton}>
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day of week headers */}
      <View style={styles.weekRow}>
        {DAYS_OF_WEEK.map((d) => (
          <Text key={d} style={styles.weekDay}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} style={styles.dayCell} />;
          }

          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasAssignments = assignmentsByDate.has(dateKey);
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === todayKey;

          return (
            <TouchableOpacity
              key={dateKey}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                isToday && !isSelected && styles.dayCellToday,
              ]}
              onPress={() => setSelectedDate(dateKey)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayText,
                  isSelected && styles.dayTextSelected,
                  isToday && !isSelected && styles.dayTextToday,
                ]}
              >
                {day}
              </Text>
              {hasAssignments && (
                <View
                  style={[
                    styles.dot,
                    isSelected && styles.dotSelected,
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected date assignments */}
      <View style={styles.detailSection}>
        <Text style={styles.detailTitle}>
          {selectedDate === todayKey ? 'Today' : selectedDate}
          {selectedAssignments.length > 0
            ? ` — ${selectedAssignments.length} due`
            : ''}
        </Text>

        {selectedAssignments.length === 0 ? (
          <Text style={styles.emptyText}>No assignments due</Text>
        ) : (
          <FlatList
            data={selectedAssignments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.assignmentRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(item.submission_status) },
                  ]}
                />
                <View style={styles.assignmentInfo}>
                  <Text style={styles.assignmentName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.assignmentMeta}>
                    {(item as any).courses?.name ?? 'Unknown course'}
                    {item.points_possible ? ` · ${item.points_possible} pts` : ''}
                  </Text>
                </View>
                <Text style={styles.statusBadge}>
                  {item.submission_status ?? 'pending'}
                </Text>
              </View>
            )}
          />
        )}
      </View>
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
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navButton: {
    padding: 8,
  },
  navText: {
    fontSize: 28,
    color: '#0a7ea4',
    fontWeight: '300',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellSelected: {
    backgroundColor: '#0a7ea4',
    borderRadius: 20,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#0a7ea4',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 15,
    color: '#333',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  dayTextToday: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#0a7ea4',
    position: 'absolute',
    bottom: 6,
  },
  dotSelected: {
    backgroundColor: '#fff',
  },
  detailSection: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentName: {
    fontSize: 15,
    fontWeight: '500',
  },
  assignmentMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
});
