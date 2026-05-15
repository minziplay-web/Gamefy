"use client";

import {
  getDoc,
  increment,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { DEFAULT_PROFILE_PHOTO_URL } from "@/lib/constants/avatar";
import { userDoc } from "@/lib/firebase/collections";
import type { UserDoc } from "@/lib/types/firestore";

export async function deactivateUser(params: {
  userId: string;
  actingUserId: string;
}) {
  const targetRef = userDoc(params.userId);

  if (!targetRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  if (params.userId === params.actingUserId) {
    throw new Error("Du kannst dich nicht selbst entfernen.");
  }

  const snapshot = await getDoc(targetRef);

  if (!snapshot.exists()) {
    throw new Error("Der Benutzer wurde nicht gefunden.");
  }

  const user = snapshot.data() as UserDoc;

  if (user.role === "admin") {
    throw new Error("Admins können hier nicht entfernt werden.");
  }

  if (user.isActive === false) {
    return;
  }

  await updateDoc(targetRef, {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
}

export async function grantBonusTrophy(userId: string) {
  const targetRef = userDoc(userId);

  if (!targetRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  const snapshot = await getDoc(targetRef);
  if (!snapshot.exists()) {
    throw new Error("Der Benutzer wurde nicht gefunden.");
  }

  const user = snapshot.data() as UserDoc;
  if (!user.isActive) {
    throw new Error("Inaktive Mitglieder können keine Trophy bekommen.");
  }

  await updateDoc(targetRef, {
    bonusTrophyCount: increment(1),
    updatedAt: serverTimestamp(),
  });
}

export async function resetUserProfilePhoto(userId: string) {
  const targetRef = userDoc(userId);

  if (!targetRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  await updateDoc(targetRef, {
    photoURL: DEFAULT_PROFILE_PHOTO_URL,
    updatedAt: serverTimestamp(),
  });
}
