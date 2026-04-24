"use client";

import {
  deleteObject,
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
  removePhoto?: boolean;
}) {
  const { user, displayName, photoFile, removePhoto = false } = params;
  const { storage } = getFirebaseServices();
  const target = userDoc(user.userId);

  if (!target) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  let photoURL: string | null = user.photoURL;
  const storageRef = storage
    ? ref(storage, `profiles/${user.userId}/avatar`)
    : null;

  if (removePhoto) {
    if (storageRef) {
      try {
        await deleteObject(storageRef);
      } catch {
        // Ignore missing object / storage hiccups and still clear the doc field.
      }
    }
    photoURL = null;
  }

  if (photoFile && storageRef) {
    try {
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

  return {
    displayName: displayName.trim(),
    photoURL,
  };
}
