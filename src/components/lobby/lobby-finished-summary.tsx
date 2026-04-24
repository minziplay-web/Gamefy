"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryBadge } from "@/components/ui/category-badge";
import { QuestionReveal } from "@/components/daily/question-reveal";
import { ScreenHeader } from "@/components/ui/screen-header";
import { CATEGORY_LABELS } from "@/lib/mapping/categories";
import type { LiveFinishedSummary } from "@/lib/types/frontend";

export function LobbyFinishedSummary({
  summary,
  onClose,
}: {
  summary: LiveFinishedSummary;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow="Runde abgeschlossen"
        title="Danke fuers Mitspielen!"
        subtitle={`${summary.myAnswersCount} von ${summary.totalQuestions} Fragen beantwortet.`}
      />

      {summary.topCategory ? (
        <Card className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sand-500">
            Top-Kategorie
          </p>
          <div className="flex items-center justify-between">
            <CategoryBadge category={summary.topCategory} />
            <span className="text-sm font-semibold text-sand-800">
              {CATEGORY_LABELS[summary.topCategory]}
            </span>
          </div>
        </Card>
      ) : null}

      <div className="space-y-3">
        {summary.rounds.map((round) => (
          <section
            key={round.questionIndex}
            className="space-y-3 rounded-[28px] border border-white/50 bg-white/80 p-5 shadow-lg shadow-sand-900/5"
          >
            <div className="flex items-center gap-2">
              <CategoryBadge category={round.category} size="sm" />
              {round.anonymous ? (
                <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sand-600">
                  Anonym
                </span>
              ) : null}
              <span className="ml-auto text-xs font-medium text-sand-500">
                Frage {round.questionIndex + 1}
              </span>
            </div>
            <h3 className="text-base font-semibold text-sand-900">
              {round.questionText}
            </h3>
            <QuestionReveal result={round.result} />
          </section>
        ))}
      </div>

      <Button className="w-full" onClick={onClose}>
        Zurueck zum Home
      </Button>
    </div>
  );
}
