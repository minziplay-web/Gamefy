"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  browserLocalPersistence,
  type AuthError,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { userDoc } from "@/lib/firebase/collections";
import { getFirebaseServices } from "@/lib/firebase/client";
import { hasFirebaseEnv } from "@/lib/firebase/config";
import { saveOnboardingProfile } from "@/lib/firebase/onboarding";
import { mapUserDocToAppUser } from "@/lib/mapping/users";
import { mockMe } from "@/lib/mocks";
import type { AppUser, AuthState } from "@/lib/types/frontend";
import type { UserDoc } from "@/lib/types/firestore";

interface AuthContextValue {
  authState: AuthState;
  isMockMode: boolean;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  registerWithPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (params: {
    displayName: string;
    photoFile: File | null;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapFirebaseUser(user: User): AppUser {
  return {
    userId: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? "Friend",
    photoURL: user.photoURL,
    role: "member",
    onboardingCompleted: Boolean(user.displayName),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const isMockMode = !hasFirebaseEnv();
  const [authState, setAuthState] = useState<AuthState>(
    isMockMode
      ? { status: "authenticated", user: mockMe }
      : { status: "initializing" },
  );

  useEffect(() => {
    if (isMockMode) {
      return;
    }

    const { auth } = getFirebaseServices();

    if (!auth) {
      return;
    }

    void setPersistence(auth, browserLocalPersistence);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setAuthState({ status: "unauthenticated" });
        return;
      }

      const baseUser = mapFirebaseUser(user);
      const target = userDoc(user.uid);

      if (!target) {
        setAuthState({ status: "authenticated", user: baseUser });
        return;
      }

      setAuthState({ status: "initializing" });

      void ensureUserProfile(target, baseUser)
        .then((profile) => {
          setAuthState({
            status: "authenticated",
            user: mapUserDocToAppUser(user.uid, profile, baseUser),
          });
        })
        .catch(() => {
          setAuthState({
            status: "error",
            message: "Benutzerprofil konnte nicht geladen werden.",
            recoverable: false,
          });
        });
    });

    return () => {
      unsubscribe();
    };
  }, [isMockMode]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authState,
      isMockMode,
      async loginWithPassword(email: string, password: string) {
        if (isMockMode) {
          setAuthState({ status: "authenticated", user: mockMe });
          return;
        }

        const { auth } = getFirebaseServices();

        if (!auth) {
          setAuthState({
            status: "error",
            message: "Firebase Auth ist nicht verfuegbar.",
            recoverable: false,
          });
          return;
        }

        setAuthState({ status: "requesting_link", email });

        try {
          const credential = await signInWithEmailAndPassword(auth, email, password);
          const target = userDoc(credential.user.uid);
          const baseUser = mapFirebaseUser(credential.user);

          if (!target) {
            setAuthState({ status: "authenticated", user: baseUser });
            return;
          }

          const profile = await ensureUserProfile(target, baseUser);
          setAuthState({
            status: "authenticated",
            user: mapUserDocToAppUser(credential.user.uid, profile, baseUser),
          });
        } catch (error) {
          const authError = error as AuthError | undefined;
          const code = authError?.code ?? "unknown";
          setAuthState({
            status: "error",
            message: `Login fehlgeschlagen (${code}).`,
            recoverable: true,
          });
        }
      },
      async registerWithPassword(email: string, password: string) {
        if (isMockMode) {
          setAuthState({ status: "authenticated", user: mockMe });
          return;
        }

        const { auth } = getFirebaseServices();

        if (!auth) {
          setAuthState({
            status: "error",
            message: "Firebase Auth ist nicht verfuegbar.",
            recoverable: false,
          });
          return;
        }

        setAuthState({ status: "requesting_link", email });

        try {
          const credential = await createUserWithEmailAndPassword(auth, email, password);
          const target = userDoc(credential.user.uid);
          const baseUser = mapFirebaseUser(credential.user);

          if (!target) {
            setAuthState({ status: "authenticated", user: baseUser });
            return;
          }

          const profile = await ensureUserProfile(target, baseUser);
          setAuthState({
            status: "authenticated",
            user: mapUserDocToAppUser(credential.user.uid, profile, baseUser),
          });
        } catch (error) {
          const authError = error as AuthError | undefined;
          const code = authError?.code ?? "unknown";
          setAuthState({
            status: "error",
            message: `Registrierung fehlgeschlagen (${code}).`,
            recoverable: true,
          });
        }
      },
      async logout() {
        if (isMockMode) {
          setAuthState({ status: "unauthenticated" });
          return;
        }

        const { auth } = getFirebaseServices();
        if (auth) {
          await signOut(auth);
        }
      },
      async completeOnboarding({ displayName, photoFile }) {
        if (authState.status !== "authenticated") {
          return;
        }

        if (isMockMode) {
          setAuthState({
            status: "authenticated",
            user: {
              ...authState.user,
              displayName,
              onboardingCompleted: true,
            },
          });
          return;
        }

        await saveOnboardingProfile({
          user: authState.user,
          displayName,
          photoFile,
        });
      },
    }),
    [authState, isMockMode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

async function ensureUserProfile(
  target: NonNullable<ReturnType<typeof userDoc>>,
  baseUser: AppUser,
) {
  const snapshot = await getDoc(target);

  if (snapshot.exists()) {
    return snapshot.data() as UserDoc;
  }

  const draft: UserDoc = {
    email: baseUser.email,
    displayName: baseUser.displayName,
    photoURL: baseUser.photoURL,
    role: "member",
    onboardingCompleted: false,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
  };

  await setDoc(target, draft, { merge: true });

  const afterCreate = await getDoc(target);
  return (afterCreate.data() as UserDoc | undefined) ?? draft;
}
