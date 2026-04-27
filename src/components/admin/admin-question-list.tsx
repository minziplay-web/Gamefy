"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/ui/category-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CATEGORY_LABELS } from "@/lib/mapping/categories";
import type { AdminQuestionRow, Category, QuestionType } from "@/lib/types/frontend";

const TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: "Single Choice",
  open_text: "Freitext",
  duel_1v1: "1v1",
  duel_2v2: "2v2",
  either_or: "Entweder / Oder",
  meme_caption: "Meme",
};

export function AdminQuestionList({
  rows,
  onToggleActive,
  onToggleDailyLock,
  onBulkSetActive,
  onBulkSetDailyLock,
  onBulkDelete,
}: {
  rows: AdminQuestionRow[];
  onToggleActive: (questionId: string, next: boolean) => void;
  onToggleDailyLock?: (questionId: string, next: boolean) => Promise<void>;
  onBulkSetActive?: (questionIds: string[], active: boolean) => Promise<void>;
  onBulkSetDailyLock?: (questionIds: string[], dailyLocked: boolean) => Promise<void>;
  onBulkDelete?: (questionIds: string[]) => Promise<void>;
}) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<"idle" | "running" | "error" | "success">("idle");
  const [bulkMessage, setBulkMessage] = useState<string | undefined>(undefined);

  const groupedRows = useMemo(() => {
    const groups = new Map<Category, AdminQuestionRow[]>();
    for (const row of rows) {
      const current = groups.get(row.category) ?? [];
      current.push(row);
      groups.set(row.category, current);
    }
    return Array.from(groups.entries()).sort((left, right) =>
      CATEGORY_LABELS[left[0]].localeCompare(CATEGORY_LABELS[right[0]], "de"),
    );
  }, [rows]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Keine Fragen gefunden"
        description="Passe die Filter an oder importiere neue Fragen."
      />
    );
  }

  const toggleExpanded = (category: Category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !(prev[category] ?? false),
    }));
  };

  const toggleSelected = (questionId: string) => {
    setSelectedIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId],
    );
  };

  const toggleCategorySelection = (categoryRows: AdminQuestionRow[]) => {
    const ids = categoryRows.map((row) => row.questionId);
    const allSelected = ids.every((id) => selectedSet.has(id));

    setSelectedIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !ids.includes(id));
      }

      return Array.from(new Set([...prev, ...ids]));
    });
  };

  const toggleAllSelection = () => {
    if (selectedIds.length === rows.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(rows.map((row) => row.questionId));
  };

  const runBulkAction = async (
    action: () => Promise<void>,
    successMessage: string,
  ) => {
    setBulkStatus("running");
    setBulkMessage(undefined);

    try {
      await action();
      setBulkStatus("success");
      setBulkMessage(successMessage);
      setSelectedIds([]);
    } catch (error) {
      setBulkStatus("error");
      setBulkMessage(
        error instanceof Error && error.message
          ? error.message
          : "Bulk-Aktion fehlgeschlagen.",
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/60 bg-white/85 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-sand-900">
              {rows.length} Fragen in {groupedRows.length} Kategorien
            </p>
            <p className="text-sm text-sand-600">
              Klappe Kategorien auf und wähle Fragen für Bulk-Aktionen aus.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={toggleAllSelection}>
            {selectedIds.length === rows.length ? "Alle abwählen" : "Alle wählen"}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={selectedIds.length === 0 || bulkStatus === "running" || !onBulkSetActive}
              onClick={() =>
                onBulkSetActive
                  ? void runBulkAction(
                      () => onBulkSetActive(selectedIds, true),
                      `${selectedIds.length} Fragen aktiviert.`,
                    )
                  : undefined
              }
            >
              Aktivieren
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={selectedIds.length === 0 || bulkStatus === "running" || !onBulkSetActive}
              onClick={() =>
                onBulkSetActive
                  ? void runBulkAction(
                      () => onBulkSetActive(selectedIds, false),
                      `${selectedIds.length} Fragen deaktiviert.`,
                    )
                  : undefined
              }
            >
              Deaktivieren
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={selectedIds.length === 0 || bulkStatus === "running" || !onBulkSetDailyLock}
              onClick={() =>
                onBulkSetDailyLock
                  ? void runBulkAction(
                      () => onBulkSetDailyLock(selectedIds, false),
                      `${selectedIds.length} Fragen wieder freigegeben.`,
                    )
                  : undefined
              }
            >
              Freigeben
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={selectedIds.length === 0 || bulkStatus === "running" || !onBulkDelete}
              onClick={() =>
                onBulkDelete
                  ? void runBulkAction(
                      () => onBulkDelete(selectedIds),
                      `${selectedIds.length} Fragen gelöscht.`,
                    )
                  : undefined
              }
            >
              Löschen
            </Button>
          </div>
        </div>
        {bulkMessage ? (
          <p
            className={`mt-3 rounded-xl px-3 py-2 text-sm ${
              bulkStatus === "error"
                ? "bg-rose-50 text-rose-800"
                : bulkStatus === "success"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-sand-50 text-sand-700"
            }`}
          >
            {bulkMessage}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        {groupedRows.map(([category, categoryRows]) => {
          const expanded = expandedCategories[category] ?? false;
          const selectedInCategory = categoryRows.filter((row) =>
            selectedSet.has(row.questionId),
          ).length;

          return (
            <section
              key={category}
              className="overflow-hidden rounded-2xl border border-white/60 bg-white/85 shadow-card-flat"
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleExpanded(category)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="text-sm text-sand-500">{expanded ? "▾" : "▸"}</span>
                  <CategoryBadge category={category} size="sm" />
                  <span className="text-sm font-semibold text-sand-900">
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className="text-xs text-sand-500">
                    {categoryRows.length} Fragen
                  </span>
                  {selectedInCategory > 0 ? (
                    <Badge tone="coral" size="sm">
                      {selectedInCategory} gewählt
                    </Badge>
                  ) : null}
                </button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCategorySelection(categoryRows)}
                >
                  {selectedInCategory === categoryRows.length ? "Alle abwählen" : "Alle wählen"}
                </Button>
              </div>

              {expanded ? (
                <ul className="space-y-3 border-t border-sand-100 px-4 py-4">
                  {categoryRows.map((row) => (
                    <li
                      key={row.questionId}
                      className={`space-y-3 rounded-2xl border p-4 transition ${
                        row.active
                          ? "border-white/60 bg-white shadow-card-flat"
                          : "border-sand-100 bg-sand-50/60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedSet.has(row.questionId)}
                          onChange={() => toggleSelected(row.questionId)}
                          className="mt-1 size-4 rounded border-sand-300"
                          aria-label={`${row.text} auswählen`}
                        />
                        <div className="min-w-0 flex-1 space-y-3">
                          <p className="text-sm font-semibold leading-relaxed text-sand-900">
                            {row.text}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="neutral" size="sm">
                              {TYPE_LABELS[row.type]}
                            </Badge>
                            {row.dailyLocked ? (
                              <Badge tone="warning" size="sm">
                                Verbraucht{row.dailyLockedDateKey ? ` · ${row.dailyLockedDateKey}` : ""}
                              </Badge>
                            ) : null}
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
                            <div className="flex items-center gap-2">
                              {row.dailyLocked ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void onToggleDailyLock?.(row.questionId, false)}
                                  disabled={!onToggleDailyLock}
                                >
                                  Freigeben
                                </Button>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleActive(row.questionId, !row.active)}
                              >
                                {row.active ? "Deaktivieren" : "Aktivieren"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-rose-700"
                                onClick={() =>
                                  onBulkDelete
                                    ? void runBulkAction(
                                        () => onBulkDelete([row.questionId]),
                                        "Frage gelöscht.",
                                      )
                                    : undefined
                                }
                                disabled={!onBulkDelete}
                              >
                                Löschen
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
