"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/ui/category-badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { AdminQuestionRow, QuestionType } from "@/lib/types/frontend";

const TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: "Single Choice",
  open_text: "Freitext",
  duel_1v1: "1v1",
  duel_2v2: "2v2",
  either_or: "Entweder / Oder",
};

export function AdminQuestionList({
  rows,
  onToggleActive,
}: {
  rows: AdminQuestionRow[];
  onToggleActive: (questionId: string, next: boolean) => void;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Keine Fragen gefunden"
        description="Passe die Filter an oder importiere neue Fragen."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li
          key={row.questionId}
          className={`space-y-3 rounded-2xl border p-4 transition ${
            row.active
              ? "border-white/60 bg-white/85 shadow-card-flat"
              : "border-sand-100 bg-sand-50/60"
          }`}
        >
          <p className="text-sm font-semibold leading-relaxed text-sand-900">
            {row.text}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={row.category} size="sm" />
            <Badge tone="neutral" size="sm">
              {TYPE_LABELS[row.type]}
            </Badge>
            {row.anonymous ? (
              <Badge tone="dark" size="sm">
                Anonym
              </Badge>
            ) : null}
            <Badge tone="neutral" size="sm">
              {row.targetMode}
            </Badge>
            <span className="ml-auto text-[11px] text-sand-500">
              von {row.createdByDisplayName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                row.active ? "text-emerald-700" : "text-sand-500"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  row.active ? "bg-emerald-500" : "bg-sand-300"
                }`}
              />
              {row.active ? "Aktiv" : "Deaktiviert"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleActive(row.questionId, !row.active)}
            >
              {row.active ? "Deaktivieren" : "Aktivieren"}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

