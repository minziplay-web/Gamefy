"use client";

import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import {
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { getFirebaseServices } from "@/lib/firebase/client";
import { userDoc } from "@/lib/firebase/collections";
import type { AppUser } from "@/lib/types/frontend";

export async function saveOnboardingProfile(params: {
  user: AppUser;
  displayName: string;
  photoFile: File | null;
}) {
  const { user, displayName, photoFile } = params;
  const { storage } = getFirebaseServices();
  const target = userDoc(user.userId);

  if (!target) {
    throw new Error("Firestore ist nicht verfuegbar.");
  }

  let photoURL: string | null = user.photoURL;

  if (photoFile && storage) {
    try {
      const storageRef = ref(storage, `profiles/${user.userId}/avatar`);
      await uploadBytes(storageRef, photoFile, {
        contentType: photoFile.type,
      });
      photoURL = await getDownloadURL(storageRef);
    } catch {
      photoURL = user.photoURL;
    }
  }

  await setDoc(
    target,
    {
      email: user.email,
      displayName: displayName.trim(),
      photoURL,
      role: user.role,
      onboardingCompleted: true,
      isActive: true,
      updatedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    },
    { merge: true },
  );
}
