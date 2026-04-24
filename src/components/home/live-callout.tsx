import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LiveSessionTeaser } from "@/lib/types/frontend";

export function LiveCallout({
  session,
  canHostLive,
}: {
  session: LiveSessionTeaser | null;
  canHostLive: boolean;
}) {
  const href = session ? `/lobby/${session.sessionId}` : "/lobby";
  const buttonLabel = session
    ? session.iAmParticipant
      ? "Zurück zur Runde"
      : "Live beitreten"
    : canHostLive
      ? "Lobby erstellen"
      : "Lobby öffnen";

  return (
    <Card tone="dark" className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream">
            <span className="size-1.5 animate-pulse rounded-full bg-coral" />
            Live
          </span>
          <h2 className="text-xl font-semibold leading-tight">
            {session ? `Lobby ${session.code}` : "Gemeinsame Runde"}
          </h2>
        </div>
        {session ? (
          <div className="shrink-0 rounded-2xl bg-white/10 px-3 py-2 text-right text-[11px] font-semibold leading-tight text-cream/90">
            <span className="block text-base text-cream">
              {session.participantCount}
            </span>
            <span className="tracking-wide text-cream/70">
              {session.participantCount === 1 ? "Freund" : "Freunde"}
            </span>
          </div>
        ) : null}
      </div>
      <p className="text-sm leading-relaxed text-cream/80">
        {session
          ? session.iAmParticipant
            ? `Du bist schon dabei — ${session.hostDisplayName} hostet.`
            : `${session.hostDisplayName} hostet gerade. Spring rein.`
          : canHostLive
            ? "Starte eine Live-Runde und zieh alle direkt rein."
            : "Sobald ein Admin startet, kannst du hier beitreten."}
      </p>
      <Link href={href} className="block">
        <Button className="w-full bg-cream text-sand-900 shadow-none hover:bg-white">
          {buttonLabel}
        </Button>
      </Link>
    </Card>
  );
}
