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
      const uploadFile = await prepareProfilePhotoForUpload(photoFile);
      await uploadBytes(storageRef, uploadFile, {
        contentType: uploadFile.type,
        cacheControl: "public,max-age=300",
      });
      const downloadURL = await getDownloadURL(storageRef);
      photoURL = `${downloadURL}${downloadURL.includes("?") ? "&" : "?"}v=${Date.now()}`;
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

async function prepareProfilePhotoForUpload(file: File) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const image = await loadImage(file);
  try {
    const maxSize = 640;
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return file;
    }

    ctx.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });

    if (!blob || blob.size >= file.size) {
      return file;
    }

    return new File([blob], "avatar.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(image.src);
  }
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      URL.revokeObjectURL(image.src);
      reject(new Error("Profilbild konnte nicht vorbereitet werden."));
    };
    image.src = URL.createObjectURL(file);
  });
}
