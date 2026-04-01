// Canvas Sync Edge Function
// Pulls courses, assignments, and calendar events from Canvas LMS
// using a player's stored personal access token.
//
// Deploy with: supabase functions deploy canvas-sync
// Call via: supabase.functions.invoke('canvas-sync')

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  enrollment_term_id?: number;
  term?: { name: string };
}

interface CanvasAssignment {
  id: number;
  name: string;
  due_at: string | null;
  points_possible: number | null;
  submission_types: string[];
  submission?: { workflow_state: string };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the user's JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user's Canvas token
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('canvas_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenRecord) {
      return new Response(
        JSON.stringify({ error: 'No Canvas token found. Please connect Canvas first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const canvasBaseUrl = tokenRecord.canvas_base_url;
    const canvasToken = tokenRecord.encrypted_token;
    const canvasHeaders = { Authorization: `Bearer ${canvasToken}` };

    // 1. Fetch active courses
    console.log('[canvas-sync] Fetching courses...');
    const coursesRes = await fetch(
      `${canvasBaseUrl}/api/v1/courses?enrollment_state=active&per_page=100&include[]=term`,
      { headers: canvasHeaders }
    );

    if (!coursesRes.ok) {
      const errText = await coursesRes.text();
      return new Response(
        JSON.stringify({ error: `Canvas API error (courses): ${coursesRes.status} - ${errText}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const canvasCourses: CanvasCourse[] = await coursesRes.json();
    console.log(`[canvas-sync] Found ${canvasCourses.length} courses`);

    // Upsert courses
    const courseRows = canvasCourses.map((c) => ({
      user_id: user.id,
      canvas_course_id: c.id,
      name: c.name,
      course_code: c.course_code || null,
      term: c.term?.name || null,
      synced_at: new Date().toISOString(),
    }));

    if (courseRows.length > 0) {
      const { error: courseUpsertError } = await supabase
        .from('courses')
        .upsert(courseRows, { onConflict: 'user_id,canvas_course_id' });

      if (courseUpsertError) {
        console.error('[canvas-sync] Course upsert error:', courseUpsertError);
      }
    }

    // Get the stored course records (we need their UUIDs)
    const { data: storedCourses } = await supabase
      .from('courses')
      .select('id, canvas_course_id')
      .eq('user_id', user.id);

    const courseMap = new Map(
      (storedCourses || []).map((c: { id: string; canvas_course_id: number }) => [c.canvas_course_id, c.id])
    );

    // 2. Fetch assignments per course
    console.log('[canvas-sync] Fetching assignments...');
    let totalAssignments = 0;

    for (const course of canvasCourses) {
      const courseUuid = courseMap.get(course.id);
      if (!courseUuid) continue;

      try {
        const assignRes = await fetch(
          `${canvasBaseUrl}/api/v1/courses/${course.id}/assignments?per_page=100&include[]=submission`,
          { headers: canvasHeaders }
        );

        if (!assignRes.ok) {
          console.warn(`[canvas-sync] Skipping assignments for course ${course.id}: ${assignRes.status}`);
          continue;
        }

        const assignments: CanvasAssignment[] = await assignRes.json();
        totalAssignments += assignments.length;

        const assignmentRows = assignments.map((a) => ({
          user_id: user.id,
          course_id: courseUuid,
          canvas_assignment_id: a.id,
          name: a.name,
          due_at: a.due_at || null,
          points_possible: a.points_possible ?? null,
          submission_status: a.submission?.workflow_state || 'unsubmitted',
          assignment_type: a.submission_types?.[0] || null,
          synced_at: new Date().toISOString(),
        }));

        if (assignmentRows.length > 0) {
          const { error: assignUpsertError } = await supabase
            .from('assignments')
            .upsert(assignmentRows, { onConflict: 'user_id,canvas_assignment_id' });

          if (assignUpsertError) {
            console.error(`[canvas-sync] Assignment upsert error for course ${course.id}:`, assignUpsertError);
          }
        }
      } catch (e) {
        console.error(`[canvas-sync] Error fetching assignments for course ${course.id}:`, e);
      }
    }

    console.log(`[canvas-sync] Synced ${canvasCourses.length} courses, ${totalAssignments} assignments`);

    return new Response(
      JSON.stringify({
        success: true,
        courses_synced: canvasCourses.length,
        assignments_synced: totalAssignments,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[canvas-sync] Unexpected error:', e);
    return new Response(
      JSON.stringify({ error: e.message ?? 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
