import { notFound } from "next/navigation";

import { AdminScreen } from "@/components/admin/admin-screen";
import { DailyScreen } from "@/components/daily/daily-screen";
import { HomeScreen } from "@/components/home/home-screen";
import { LobbyScreen } from "@/components/lobby/lobby-screen";
import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { ProfileScreen } from "@/components/profile/profile-screen";
import {
  adminVariants,
  dailyVariants,
  homeVariants,
  lobbyVariants,
  profileVariants,
} from "@/lib/mocks/variants";
import { mockMe } from "@/lib/mocks";

export default async function PreviewScreenPage({
  params,
}: {
  params: Promise<{ screen: string; variant: string }>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_PREVIEW_ROUTES !== "true") {
    notFound();
  }

  const { screen, variant } = await params;

  switch (screen) {
    case "home": {
      const state = homeVariants[variant];
      if (!state) notFound();
      return <HomeScreen state={state} />;
    }
    case "daily": {
      const state = dailyVariants[variant];
      if (!state) notFound();
      return <DailyScreen state={state} />;
    }
    case "lobby": {
      const state = lobbyVariants[variant];
      if (!state) notFound();
      return (
        <LobbyScreen
          initial={state}
          canHostLive={mockMe.role === "admin"}
        />
      );
    }
    case "profile": {
      const state = profileVariants[variant];
      if (!state) notFound();
      return <ProfileScreen state={state} />;
    }
    case "admin": {
      const state = adminVariants[variant];
      if (!state) notFound();
      return <AdminScreen state={state} />;
    }
    case "onboarding":
      if (variant !== "empty" && variant !== "filled") notFound();
      return <OnboardingScreen previewPreset={variant} />;
    default:
      notFound();
  }
}
