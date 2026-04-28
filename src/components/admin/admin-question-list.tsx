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
  multi_choice: "Multi Choice",
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
      <div className="rounded-2xl border border-sand-200/80 bg-white p-4">
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
                ? "bg-danger-soft text-danger-text"
                : bulkStatus === "success"
                  ? "bg-success-soft text-success-text"
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
              className="overflow-hidden rounded-2xl border border-sand-200/80 bg-white shadow-card-flat"
            >
              <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <button
                  type="button"
                  onClick={() => toggleExpanded(category)}
                  className="flex min-w-0 flex-1 items-start gap-2 text-left sm:items-center"
                >
                  <span className="mt-1 text-sm text-sand-500 sm:mt-0">
                    {expanded ? "▾" : "▸"}
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex min-w-0 flex-wrap items-center gap-2">
                      <CategoryBadge category={category} size="sm" />
                      {selectedInCategory > 0 ? (
                        <Badge tone="accent" size="sm">
                          {selectedInCategory} gewählt
                        </Badge>
                      ) : null}
                    </span>
                    <span className="block text-xs text-sand-500">
                      {categoryRows.length} Fragen
                    </span>
                  </span>
                </button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => toggleCategorySelection(categoryRows)}
                >
                  {selectedInCategory === categoryRows.length ? "Alle abwählen" : "Alle wählen"}
                </Button>
              </div>

              {expanded ? (
                <ul className="space-y-2.5 border-t border-sand-100 bg-slate-50/70 px-3 py-3 sm:px-4 sm:py-4">
                  {categoryRows.map((row) => (
                    <li
                      key={row.questionId}
                      className={`space-y-3 rounded-[1.25rem] p-3 ring-1 transition sm:p-4 ${
                        row.active
                          ? "bg-white shadow-card-flat ring-sand-100"
                          : "bg-white/70 ring-sand-100 opacity-75"
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
                        <div className="min-w-0 flex-1 space-y-2.5">
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
                            <span className="w-full text-[11px] text-sand-500 sm:ml-auto sm:w-auto">
                              von {row.createdByDisplayName}
                            </span>
                          </div>
                          <div className="flex flex-col gap-2 rounded-2xl bg-slate-50 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                                row.active ? "text-success-text" : "text-sand-500"
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  row.active ? "bg-success-text" : "bg-sand-300"
                                }`}
                              />
                              {row.active ? "Aktiv" : "Deaktiviert"}
                            </span>
                            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                              {row.dailyLocked ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full sm:w-auto"
                                  onClick={() => void onToggleDailyLock?.(row.questionId, false)}
                                  disabled={!onToggleDailyLock}
                                >
                                  Freigeben
                                </Button>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() => onToggleActive(row.questionId, !row.active)}
                              >
                                {row.active ? "Deaktivieren" : "Aktivieren"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-danger-text sm:w-auto"
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
