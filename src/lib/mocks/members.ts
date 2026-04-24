import type { AppUser, MemberLite } from "@/lib/types/frontend";

export const mockMembers: MemberLite[] = [
  { userId: "u_leon", displayName: "Leon", photoURL: null },
  { userId: "u_tim", displayName: "Tim", photoURL: null },
  { userId: "u_jana", displayName: "Jana", photoURL: null },
  { userId: "u_max", displayName: "Max", photoURL: null },
  { userId: "u_lisa", displayName: "Lisa", photoURL: null },
  { userId: "u_ben", displayName: "Ben", photoURL: null },
];

export const mockMe: AppUser = {
  userId: "u_leon",
  email: "leon@example.com",
  displayName: "Leon",
  photoURL: null,
  role: "admin",
  onboardingCompleted: true,
};
