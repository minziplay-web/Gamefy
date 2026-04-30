import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type {
  CustomDailyQuestionNotice,
  DailyTeaser,
} from "@/lib/types/frontend";

export function DailyCallout({
  teaser,
  customQuestionNotice,
}: {
  teaser: DailyTeaser | null;
  customQuestionNotice?: CustomDailyQuestionNotice | null;
}) {
  if (!teaser) {
    return (
      <Card className="space-y-3 border-recap-primary/22 bg-white shadow-[0_18px_38px_-26px_rgba(23,32,49,0.18)]">
        <Badge tone="neutral">Daily</Badge>
        <h2 className="text-xl font-semibold text-sand-900">
          Heute ist noch nichts live
        </h2>
        <p className="text-sm leading-relaxed text-sand-700">
          Sobald die heutige Daily freigeschaltet ist, wartet sie hier auf dich.
        </p>
      </Card>
    );
  }

  if (teaser.isUnplayable) {
    return (
      <Card className="space-y-3 border-recap-primary/22 bg-white shadow-[0_18px_38px_-26px_rgba(23,32,49,0.18)]">
        <Badge tone="warning">
          <span aria-hidden>⚠️</span>
          Daily
        </Badge>
        <h2 className="text-xl font-semibold text-sand-900">
          Daily nicht spielbar
        </h2>
        <p className="text-sm leading-relaxed text-sand-700">
          Der heutige Run ist unvollständig. Ein Admin muss die Daily neu
          erzeugen oder ersetzen.
        </p>
      </Card>
    );
  }

  if (teaser.status === "scheduled") {
    return (
      <Card className="space-y-3 border-recap-primary/22 bg-white shadow-[0_18px_38px_-26px_rgba(23,32,49,0.18)]">
        <Badge tone="neutral">Daily geplant</Badge>
        <h2 className="text-xl font-semibold text-sand-900">
          Gleich geht es los
        </h2>
        <p className="text-sm leading-relaxed text-sand-700">
          Die Fragen für heute stehen bereit, sind aber noch nicht geöffnet.
          Sobald der Run aktiv ist, kannst du direkt starten.
        </p>
      </Card>
    );
  }

  if (teaser.status === "closed") {
    return (
      <Card className="space-y-4 border-recap-primary/22 bg-white shadow-[0_18px_38px_-26px_rgba(23,32,49,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge tone="neutral">Daily beendet</Badge>
            <h2 className="text-xl font-semibold text-sand-900">
              Für heute bist du durch
            </h2>
          </div>
          <ProgressPill answered={teaser.answeredByMe} total={teaser.totalQuestions} />
        </div>
        {teaser.hasIncompleteItems ? (
          <p className="rounded-xl border border-recap-primary/28 bg-white px-3 py-2 text-xs font-medium text-recap-text">
            Einige Fragen konnten heute nicht ausgespielt werden.
          </p>
        ) : null}
        <Link href="/daily" className="block">
          <Button className="w-full" variant="recap">
            Ergebnisse ansehen
          </Button>
        </Link>
      </Card>
    );
  }

  const playable = teaser.totalQuestions;
  const remaining = Math.max(0, playable - teaser.answeredByMe);
  const allAnswered = playable > 0 && remaining === 0;
  const hasCustomQuestionNotice =
    teaser.status === "active" && Boolean(customQuestionNotice);
  const heading = hasCustomQuestionNotice
    ? "Neue Frage im Daily"
    : allAnswered
      ? "Alles für heute beantwortet"
      : remaining === 1
        ? "Noch eine Frage wartet"
        : `Noch ${remaining} Fragen warten`;
  const body = hasCustomQuestionNotice
    ? customQuestionNotice?.isMine
      ? "Deine eigene Frage ist jetzt live im heutigen Daily."
      : `Eine neue Frage wurde von ${customQuestionNotice?.authorDisplayName} erstellt.`
    : teaser.revealPolicy === "after_answer"
      ? null
      : "Die Ergebnisse werden gesammelt und erst nach Tagesende aufgedeckt.";
  const buttonLabel = hasCustomQuestionNotice
    ? "Jetzt anschauen"
    : allAnswered
      ? "Zur Daily"
      : "Daily starten";

  return (
    <Card className="space-y-4 border-recap-primary/22 bg-white shadow-[0_18px_38px_-26px_rgba(23,32,49,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge tone={hasCustomQuestionNotice ? "warning" : "recap"}>
            {hasCustomQuestionNotice ? (
              <>
                <span aria-hidden>🏆</span>
                Daily
              </>
            ) : (
              "Daily"
            )}
          </Badge>
          <h2 className="text-xl font-semibold leading-tight text-sand-900">
            {heading}
          </h2>
        </div>
        <ProgressPill answered={teaser.answeredByMe} total={playable} />
      </div>
      <ProgressBar value={teaser.answeredByMe} total={playable} tone="recap" />
      {teaser.hasIncompleteItems ? (
        <p className="rounded-xl border border-recap-primary/28 bg-white px-3 py-2 text-xs font-medium text-recap-text">
          Einige Fragen konnten heute nicht ausgespielt werden.
        </p>
      ) : null}
      {body ? (
        <p className="text-sm leading-relaxed text-sand-700">{body}</p>
      ) : null}
      <Link href="/daily" className="block">
        <Button className="w-full" variant="recap">{buttonLabel}</Button>
      </Link>
    </Card>
  );
}

function ProgressPill({
  answered,
  total,
}: {
  answered: number;
  total: number;
}) {
  return (
    <div className="shrink-0 rounded-2xl bg-[#fff8fd] px-3 py-2 text-right text-[11px] font-semibold leading-tight text-recap-text ring-1 ring-recap-primary/14">
      <span className="block text-base text-sand-950">
        {answered}
        <span className="text-recap-primary/55">/{total}</span>
      </span>
      <span className="tracking-wide">beantwortet</span>
    </div>
  );
}
