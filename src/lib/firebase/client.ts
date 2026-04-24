"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

import { firebaseConfig, hasFirebaseEnv } from "@/lib/firebase/config";

export function getFirebaseApp() {
  if (!hasFirebaseEnv()) {
    return null;
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseServices() {
  const app = getFirebaseApp();

  if (!app) {
    return {
      app: null,
      auth: null,
      db: null,
      storage: null,
    };
  }

  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
  };
}
