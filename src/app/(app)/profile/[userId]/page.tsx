"use client";

import { use } from "react";

import { ProfileScreen } from "@/components/profile/profile-screen";
import { useProfileViewState } from "@/lib/firebase/profile";

export default function MemberProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const state = useProfileViewState(userId);

  return <ProfileScreen state={state} />;
}
