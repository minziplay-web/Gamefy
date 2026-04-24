"use client";

import { ProfileScreen } from "@/components/profile/profile-screen";
import { useProfileViewState } from "@/lib/firebase/profile";

export default function ProfilePage() {
  const state = useProfileViewState();

  return <ProfileScreen state={state} />;
}
