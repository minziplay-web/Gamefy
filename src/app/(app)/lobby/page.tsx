"use client";

import { LobbyScreen } from "@/components/lobby/lobby-screen";
import { useAuth } from "@/lib/auth/auth-context";
import {
  createLiveSession,
  joinLiveSessionByCode,
} from "@/lib/firebase/live-actions";

export default function LobbyPage() {
  const { authState } = useAuth();

  return (
    <LobbyScreen
      initial={{ status: "landing" }}
      canHostLive={
        authState.status === "authenticated" && authState.user.role === "admin"
      }
      onCreateSession={async (draft) => {
        if (authState.status !== "authenticated") {
          throw new Error("Nicht eingeloggt.");
        }
        return createLiveSession({ draft, user: authState.user });
      }}
      onJoinByCode={async (code) => {
        if (authState.status !== "authenticated") {
          throw new Error("Nicht eingeloggt.");
        }
        return joinLiveSessionByCode({ code, user: authState.user });
      }}
    />
  );
}
