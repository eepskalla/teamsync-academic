import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { Course, Assignment } from '@/lib/types';

interface CanvasData {
  courses: Course[];
  assignments: Assignment[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCanvasData(): CanvasData {
  const { session } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!session?.user) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const [coursesRes, assignmentsRes] = await Promise.all([
        supabase
          .from('courses')
          .select('*')
          .eq('user_id', session.user.id)
          .order('name'),
        supabase
          .from('assignments')
          .select('*, courses!inner(name, course_code)')
          .eq('user_id', session.user.id)
          .order('due_at', { ascending: true, nullsFirst: false }),
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;

      setCourses(coursesRes.data ?? []);
      setAssignments(assignmentsRes.data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    // Trigger a Canvas sync first, then refetch local data
    try {
      await supabase.functions.invoke('canvas-sync');
    } catch {
      // Sync may fail if edge function isn't deployed yet — that's ok
    }
    await fetchData(true);
  }, [fetchData]);

  return { courses, assignments, loading, refreshing, error, refresh };
}
