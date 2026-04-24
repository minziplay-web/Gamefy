"use client";

import { AvatarCircle } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScreenHeader } from "@/components/ui/screen-header";
import type { LobbyParticipant } from "@/lib/types/frontend";

export function LobbyWaitingRoom({
  code,
  participants,
  isHost,
  canStart,
  onStart,
  onLeave,
  onCopyCode,
}: {
  code: string;
  participants: LobbyParticipant[];
  isHost: boolean;
  canStart: boolean;
  onStart: () => void;
  onLeave: () => void;
  onCopyCode: () => void;
}) {
  const connectedCount = participants.filter((p) => p.connected).length;

  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow="Warteraum"
        title="Wer ist schon dabei?"
        subtitle={
          isHost
            ? "Du bist Host. Starte sobald alle da sind."
            : "Warte auf den Host, gleich geht es los."
        }
      />

      <Card tone="dark" className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cream/60">
          Lobby-Code
        </p>
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[2.5rem] font-bold tracking-[0.2em]">
            {code}
          </span>
          <button
            type="button"
            onClick={onCopyCode}
            aria-label="Code kopieren"
            className="min-h-10 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-cream transition hover:bg-white/25"
          >
            Kopieren
          </button>
        </div>
      </Card>

      <Card tone="flat" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-sand-500">
            Teilnehmer
          </h2>
          <span className="text-[11px] font-semibold text-sand-600">
            {connectedCount} von {participants.length} verbunden
          </span>
        </div>
        <ul className="grid grid-cols-4 gap-3">
          {participants.map((p) => (
            <li key={p.userId} className="flex flex-col items-center gap-2">
              <div className="relative">
                <AvatarCircle
                  member={p}
                  size="lg"
                  className={p.connected ? "" : "opacity-40"}
                />
                <span
                  aria-label={p.connected ? "verbunden" : "getrennt"}
                  className={`absolute -bottom-0.5 -right-0.5 size-4 rounded-full ring-2 ring-white ${
                    p.connected
                      ? "bg-emerald-500"
                      : "bg-sand-300"
                  } ${p.connected ? "" : "animate-pulse"}`}
                />
                {p.isHost ? (
                  <span
                    aria-label="Host"
                    className="absolute -top-1 -left-1 inline-flex size-5 items-center justify-center rounded-full bg-coral text-[10px] text-white ring-2 ring-white"
                  >
                    ★
                  </span>
                ) : null}
              </div>
              <span className="line-clamp-1 text-xs font-medium text-sand-800">
                {p.displayName}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {isHost ? (
        <Button className="w-full" disabled={!canStart} onClick={onStart}>
          {canStart ? "Runde starten" : "Warte auf mindestens 2 Teilnehmer"}
        </Button>
      ) : null}

      <button
        type="button"
        onClick={onLeave}
        className="mx-auto block min-h-10 text-sm font-medium text-sand-500 underline underline-offset-2 hover:text-sand-800"
      >
        Lobby verlassen
      </button>
    </div>
  );
}
