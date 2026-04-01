import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile, UserRole } from '@/lib/types';

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  setProfile: (profile: UserProfile) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
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

        set({ session, profile, initialized: true });
      } else {
        set({ session: null, profile: null, initialized: true });
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        if (!get().initialized) return;
        set({ session });
        if (!session) {
          set({ profile: null });
        }
      });
    } catch {
      set({ initialized: true });
    }
  },

  signUp: async (email, password, fullName, role) => {
    set({ loading: true });
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Sign up failed');

      const profile: UserProfile = {
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        team_id: null,
        created_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('users')
        .insert(profile);

      if (profileError) throw profileError;

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
      set({ session: data.session });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
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
}));
