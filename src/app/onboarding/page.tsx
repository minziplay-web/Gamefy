import { AppShell } from "@/components/app-shell/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <AppShell hideNav>
        <OnboardingScreen />
      </AppShell>
    </AuthGuard>
  );
}
