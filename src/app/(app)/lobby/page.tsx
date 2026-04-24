"use client";

import Link from "next/link";

import { LobbyScreen } from "@/components/lobby/lobby-screen";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useAuth } from "@/lib/auth/auth-context";
import { LIVE_MODE_ENABLED } from "@/lib/config/features";
import {
  createLiveSession,
  joinLiveSessionByCode,
} from "@/lib/firebase/live-actions";

export default function LobbyPage() {
  const { authState } = useAuth();

  if (!LIVE_MODE_ENABLED) {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Live" title="Live pausiert" />
        <EmptyState
          icon="🧊"
          title="Die Live-Runden sind gerade auf Eis"
          description="Wir konzentrieren uns erstmal auf Daily und Profil. Das Live-System kommt später wieder dazu."
          action={
            <Link href="/" className="block">
              <Button>Zur Startseite</Button>
            </Link>
          }
        />
      </div>
    );
  }

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
