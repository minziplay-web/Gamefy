import type { DocumentSnapshot } from "firebase/firestore";

import { DEFAULT_PROFILE_PHOTO_URL } from "@/lib/constants/avatar";
import type { AppUser, MemberLite } from "@/lib/types/frontend";
import type { UserDoc } from "@/lib/types/firestore";

export function mapUserDocToAppUser(
  userId: string,
  data: Partial<UserDoc> | undefined,
  fallback?: Partial<AppUser>,
): AppUser {
  return {
    userId,
    email: data?.email ?? fallback?.email ?? "",
    displayName: data?.displayName ?? fallback?.displayName ?? "Friend",
    photoURL: data?.photoURL ?? fallback?.photoURL ?? DEFAULT_PROFILE_PHOTO_URL,
    role: data?.role ?? fallback?.role ?? "member",
    onboardingCompleted:
      data?.onboardingCompleted ?? fallback?.onboardingCompleted ?? false,
  };
}

export function mapUserSnapshotToAppUser(
  snapshot: DocumentSnapshot<UserDoc>,
  fallback?: Partial<AppUser>,
): AppUser {
  return mapUserDocToAppUser(snapshot.id, snapshot.data(), fallback);
}

export function mapUserToMemberLite(user: AppUser | UserDoc, userId?: string): MemberLite {
  return {
    userId: "userId" in user ? user.userId : userId ?? "",
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}
