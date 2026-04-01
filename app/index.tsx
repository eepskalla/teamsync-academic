import { Redirect } from 'expo-router';
import { useAuthStore } from '@/lib/store';

export default function Index() {
  const { session, profile } = useAuthStore();

  // Not logged in → auth screens
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Logged in but no profile yet (shouldn't happen, but handle gracefully)
  if (!profile) {
    return <Redirect href="/(auth)/login" />;
  }

  // Logged in but no team → onboarding
  if (!profile.team_id) {
    if (profile.role === 'coordinator') {
      return <Redirect href="/(onboarding)/create-team" />;
    }
    return <Redirect href="/(onboarding)/join-team" />;
  }

  // Logged in with team → role-specific tabs
  if (profile.role === 'coordinator') {
    return <Redirect href="/(coordinator)" />;
  }
  if (profile.role === 'coach') {
    return <Redirect href="/(coach)" />;
  }
  return <Redirect href="/(player)" />;
}
