import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile, UserRole } from '@/lib/types';

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  canvasConnected: boolean;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  setProfile: (profile: UserProfile) => void;
  setCanvasConnected: (connected: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  canvasConnected: false,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // Check if player has connected Canvas
        let canvasConnected = false;
        if (profile?.role === 'player') {
          const { data: tokenData } = await supabase
            .from('canvas_tokens')
            .select('id')
            .eq('user_id', session.user.id)
            .single();
          canvasConnected = !!tokenData;
        }

        set({ session, profile, canvasConnected, initialized: true });
      } else {
        set({ session: null, profile: null, canvasConnected: false, initialized: true });
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        if (!get().initialized) return;
        set({ session });
        if (!session) {
          set({ profile: null, canvasConnected: false });
        }
      });
    } catch {
      set({ initialized: true });
    }
  },

  signUp: async (email, password, fullName, role) => {
    set({ loading: true });
    try {
      console.log('[SignUp] Starting sign up for:', email);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log('[SignUp] Auth response:', {
        user: authData?.user?.id ?? null,
        session: authData?.session ? 'exists' : 'null',
        error: authError?.message ?? null,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Sign up failed — no user returned');

      if (!authData.session) {
        throw new Error(
          'Please check your email and click the confirmation link to complete sign up.'
        );
      }

      const profile: UserProfile = {
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        team_id: null,
        created_at: new Date().toISOString(),
      };

      console.log('[SignUp] Inserting profile...');
      const { error: profileError } = await supabase
        .from('users')
        .insert(profile);

      if (profileError) {
        console.log('[SignUp] Profile insert error:', profileError.message);
        throw profileError;
      }

      console.log('[SignUp] Success!');
      set({ session: authData.session, profile });
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      await get().fetchProfile(data.user.id);

      // Check Canvas connection for players
      const profile = get().profile;
      if (profile?.role === 'player') {
        const { data: tokenData } = await supabase
          .from('canvas_tokens')
          .select('id')
          .eq('user_id', data.user.id)
          .single();
        set({ canvasConnected: !!tokenData });
      }

      set({ session: data.session });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null, canvasConnected: false });
  },

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    set({ profile: data });
  },

  setProfile: (profile) => {
    set({ profile });
  },

  setCanvasConnected: (connected) => {
    set({ canvasConnected: connected });
  },
}));
