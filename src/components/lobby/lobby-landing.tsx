"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScreenHeader } from "@/components/ui/screen-header";

export function LobbyLanding({
  canHost,
  onCreate,
  onJoin,
}: {
  canHost: boolean;
  onCreate: () => void;
  onJoin: () => void;
}) {
  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow="Live"
        title="Eine Runde zusammen"
        subtitle="Lobby erstellen oder per Code beitreten."
      />
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-sand-900">Beitreten</h2>
        <p className="text-sm text-sand-600">
          Code vom Host bekommen? Dann direkt rein in die Lobby.
        </p>
        <Button className="w-full" onClick={onJoin}>
          Mit Code beitreten
        </Button>
      </Card>
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-sand-900">Runde erstellen</h2>
        <p className="text-sm text-sand-600">
          {canHost
            ? "Waehle Kategorien, Dauer und starte die gemeinsame Session."
            : "Nur Admins koennen eine Lobby starten. Frag jemanden aus der Runde."}
        </p>
        <Button
          className="w-full"
          variant="secondary"
          onClick={onCreate}
          disabled={!canHost}
        >
          Runde erstellen
        </Button>
      </Card>
    </div>
  );
}
