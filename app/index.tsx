import { Redirect } from 'expo-router';
import { useAuthStore } from '@/lib/store';

export default function Index() {
  const { session, profile, canvasConnected } = useAuthStore();

  // Not logged in → auth screens
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Logged in but no profile yet
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

  // Player with team but no Canvas connection → connect Canvas
  if (profile.role === 'player' && !canvasConnected) {
    return <Redirect href="/(onboarding)/connect-canvas" />;
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
