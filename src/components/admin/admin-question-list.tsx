"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CATEGORY_LABELS } from "@/lib/mapping/categories";
import type {
  AdminQuestionEditInput,
  AdminQuestionRow,
  Category,
  QuestionType,
} from "@/lib/types/frontend";

const TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: "Single Choice",
  multi_choice: "Multi Choice",
  open_text: "Freitext",
  duel_1v1: "1v1",
  duel_2v2: "2v2",
  either_or: "Entweder / Oder",
  meme_caption: "Meme",
};

const EDITABLE_CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
const EDITABLE_TYPES = Object.keys(TYPE_LABELS) as QuestionType[];

export function AdminQuestionList({
  rows,
  onToggleActive,
  onCreateQuestion,
  onUpdateQuestion,
  onBulkSetActive,
  onBulkDelete,
}: {
  rows: AdminQuestionRow[];
  onToggleActive: (questionId: string, next: boolean) => void;
  onCreateQuestion?: (input: AdminQuestionEditInput) => Promise<string>;
  onUpdateQuestion?: (
    questionId: string,
    input: AdminQuestionEditInput,
  ) => Promise<void>;
  onBulkSetActive?: (questionIds: string[], active: boolean) => Promise<void>;
  onBulkDelete?: (questionIds: string[]) => Promise<void>;
}) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<"idle" | "running" | "error" | "success">("idle");
  const [bulkMessage, setBulkMessage] = useState<string | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AdminQuestionEditInput | null>(null);
  const [editStatus, setEditStatus] = useState<"idle" | "saving" | "error" | "success">("idle");
  const [editMessage, setEditMessage] = useState<string | undefined>(undefined);
  const [createDraft, setCreateDraft] = useState<AdminQuestionEditInput | null>(null);
  const [createStatus, setCreateStatus] = useState<"idle" | "saving" | "error" | "success">("idle");
  const [createMessage, setCreateMessage] = useState<string | undefined>(undefined);

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

  const startEditing = (row: AdminQuestionRow) => {
    setCreateDraft(null);
    setCreateStatus("idle");
    setCreateMessage(undefined);
    setEditingId(row.questionId);
    setEditDraft({
      text: row.text,
      category: row.category,
      type: row.type,
      targetMode: "daily",
      options:
        row.type === "either_or"
          ? normalizeEitherOrOptions(row.options)
          : undefined,
      imagePath: row.type === "meme_caption" ? row.imagePath ?? "" : undefined,
    });
    setEditStatus("idle");
    setEditMessage(undefined);
  };

  const startCreating = () => {
    setEditingId(null);
    setEditDraft(null);
    setEditStatus("idle");
    setEditMessage(undefined);
    setCreateDraft(createEmptyQuestionDraft());
    setCreateStatus("idle");
    setCreateMessage(undefined);
  };

  const updateDraft = (patch: Partial<AdminQuestionEditInput>) => {
    setEditDraft((current) => (current ? { ...current, ...patch } : current));
    setEditStatus("idle");
    setEditMessage(undefined);
  };

  const updateCreateDraft = (patch: Partial<AdminQuestionEditInput>) => {
    setCreateDraft((current) => (current ? { ...current, ...patch } : current));
    setCreateStatus("idle");
    setCreateMessage(undefined);
  };

  const changeDraftType = (type: QuestionType) => {
    setEditDraft((current) => {
      if (!current) return current;

      return {
        ...current,
        type,
        options: type === "either_or" ? normalizeEitherOrOptions(current.options) : undefined,
        imagePath: type === "meme_caption" ? current.imagePath ?? "" : undefined,
      };
    });
    setEditStatus("idle");
    setEditMessage(undefined);
  };

  const changeCreateDraftType = (type: QuestionType) => {
    setCreateDraft((current) => {
      if (!current) return current;

      return {
        ...current,
        type,
        category: type === "meme_caption" ? "meme_it" : current.category,
        options: type === "either_or" ? normalizeEitherOrOptions(current.options) : undefined,
        imagePath: type === "meme_caption" ? current.imagePath ?? "" : undefined,
      };
    });
    setCreateStatus("idle");
    setCreateMessage(undefined);
  };

  const saveEdit = async () => {
    if (!editingId || !editDraft || !onUpdateQuestion) return;

    setEditStatus("saving");
    setEditMessage(undefined);

    try {
      await onUpdateQuestion(editingId, editDraft);
      setEditStatus("success");
      setEditMessage("Frage gespeichert.");
      setEditingId(null);
      setEditDraft(null);
    } catch (error) {
      setEditStatus("error");
      setEditMessage(
        error instanceof Error && error.message
          ? error.message
          : "Frage konnte nicht gespeichert werden.",
      );
    }
  };

  const saveCreate = async () => {
    if (!createDraft || !onCreateQuestion) return;

    setCreateStatus("saving");
    setCreateMessage(undefined);

    try {
      await onCreateQuestion(createDraft);
      setCreateStatus("success");
      setCreateMessage("Frage erstellt.");
      setCreateDraft(null);
    } catch (error) {
      setCreateStatus("error");
      setCreateMessage(
        error instanceof Error && error.message
          ? error.message
          : "Frage konnte nicht erstellt werden.",
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sand-200/80 bg-white p-3 shadow-card-flat">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-sand-900">
              {rows.length} Fragen in {groupedRows.length} Kategorien
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={toggleAllSelection}>
            {selectedIds.length === rows.length ? "Alle abwählen" : "Alle wählen"}
          </Button>
        </div>
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2 min-[430px]:grid-cols-4">
            <Button
              variant="primary"
              size="sm"
              className="w-full rounded-xl"
              disabled={!onCreateQuestion || createStatus === "saving"}
              onClick={startCreating}
            >
              Neue Frage
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full rounded-xl"
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
              className="w-full rounded-xl"
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
              variant="destructive"
              size="sm"
              className="w-full rounded-xl"
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
        {createDraft ? (
          <div className="mt-4">
            <QuestionEditPanel
              draft={createDraft}
              status={createStatus}
              message={createMessage}
              saveLabel="Frage erstellen"
              savingLabel="Erstellt..."
              onChange={updateCreateDraft}
              onTypeChange={changeCreateDraftType}
              onSave={saveCreate}
              onCancel={() => {
                setCreateDraft(null);
                setCreateStatus("idle");
                setCreateMessage(undefined);
              }}
            />
          </div>
        ) : null}
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

      {rows.length === 0 ? (
        <EmptyState
          title="Keine Fragen gefunden"
          description="Passe die Filter an oder erstelle direkt eine neue Frage."
        />
      ) : null}

      {rows.length > 0 ? (
      <div className="space-y-2">
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
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => toggleExpanded(category)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="w-4 shrink-0 text-sm text-sand-500">
                    {expanded ? "▾" : "▸"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-bold text-sand-900">
                        {CATEGORY_LABELS[category]}
                      </span>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-sand-600">
                        {categoryRows.length}
                      </span>
                      {selectedInCategory > 0 ? (
                        <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand-primary">
                          {selectedInCategory}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 rounded-xl px-2.5 text-[11px]"
                  onClick={() => toggleCategorySelection(categoryRows)}
                >
                  {selectedInCategory === categoryRows.length ? "Abwählen" : "Wählen"}
                </Button>
              </div>

              {expanded ? (
                <ul className="space-y-2 border-t border-sand-100 bg-slate-50/60 px-2.5 py-2.5 sm:px-4 sm:py-4">
                  {categoryRows.map((row) => (
                    <li
                      key={row.questionId}
                      className={`rounded-2xl p-3 ring-1 transition ${
                        row.active
                          ? "bg-white shadow-card-flat ring-sand-100"
                          : "bg-white/70 ring-sand-100 opacity-75"
                      }`}
                    >
                      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
                        <input
                          type="checkbox"
                          checked={selectedSet.has(row.questionId)}
                          onChange={() => toggleSelected(row.questionId)}
                          className="mt-1 size-4 rounded border-sand-300"
                          aria-label={`${row.text} auswählen`}
                        />
                        <div className="min-w-0 space-y-2">
                          {row.type === "meme_caption" && row.imagePath ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.imagePath}
                              alt=""
                              className="h-40 w-full rounded-2xl border border-sand-100 object-cover shadow-card-flat sm:h-32"
                            />
                          ) : null}
                          <p className="text-sm font-semibold leading-relaxed text-sand-900">
                            {row.text}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
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
                          {editingId === row.questionId && editDraft ? (
                            <QuestionEditPanel
                              draft={editDraft}
                              status={editStatus}
                              message={editMessage}
                              saveLabel="Speichern"
                              savingLabel="Speichert..."
                              onChange={updateDraft}
                              onTypeChange={changeDraftType}
                              onSave={saveEdit}
                              onCancel={() => {
                                setEditingId(null);
                                setEditDraft(null);
                                setEditStatus("idle");
                                setEditMessage(undefined);
                              }}
                            />
                          ) : null}
                        </div>
                        <div className="col-span-2 flex items-center gap-2 border-t border-sand-100 pt-2">
                          <span
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-bold ${
                              row.active
                                ? "bg-success-soft text-success-text"
                                : "bg-sand-100 text-sand-500"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                row.active ? "bg-success-text" : "bg-sand-300"
                              }`}
                            />
                            {row.active ? "Aktiv" : "Aus"}
                          </span>
                          <div className="grid min-w-0 flex-1 grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              className="min-h-9 rounded-xl bg-brand-wash px-2 text-[11px] font-bold text-brand-primary transition hover:bg-brand-soft disabled:opacity-50"
                              onClick={() => onToggleActive(row.questionId, !row.active)}
                            >
                              {row.active ? "Aus" : "An"}
                            </button>
                            <button
                              type="button"
                              className="min-h-9 rounded-xl bg-profile-soft px-2 text-[11px] font-bold text-profile-text transition hover:bg-profile-wash disabled:opacity-50"
                              onClick={() => startEditing(row)}
                              disabled={!onUpdateQuestion}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="min-h-9 rounded-xl bg-danger-soft px-2 text-[11px] font-bold text-danger-text transition hover:bg-danger-soft/75 disabled:opacity-50"
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
                              Weg
                            </button>
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
      ) : null}
    </div>
  );
}

function QuestionEditPanel({
  draft,
  status,
  message,
  saveLabel = "Speichern",
  savingLabel = "Speichert...",
  onChange,
  onTypeChange,
  onSave,
  onCancel,
}: {
  draft: AdminQuestionEditInput;
  status: "idle" | "saving" | "error" | "success";
  message?: string;
  saveLabel?: string;
  savingLabel?: string;
  onChange: (patch: Partial<AdminQuestionEditInput>) => void;
  onTypeChange: (type: QuestionType) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
}) {
  const options = normalizeEitherOrOptions(draft.options);

  return (
    <div className="rounded-2xl border border-admin-primary/20 bg-admin-primary/5 p-3 sm:p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-sand-500">
            Fragetext
          </span>
          <textarea
            value={draft.text}
            onChange={(event) => onChange({ text: event.target.value })}
            rows={3}
            className="w-full rounded-2xl border border-sand-200 bg-white px-3 py-2 text-sm font-semibold text-sand-900 outline-none transition focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-sand-500">
            Kategorie
          </span>
          <select
            value={draft.category}
            onChange={(event) => onChange({ category: event.target.value as Category })}
            className="w-full rounded-2xl border border-sand-200 bg-white px-3 py-2 text-sm font-semibold text-sand-900 outline-none transition focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20"
          >
            {EDITABLE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-sand-500">
            Antworttyp
          </span>
          <select
            value={draft.type}
            onChange={(event) => onTypeChange(event.target.value as QuestionType)}
            className="w-full rounded-2xl border border-sand-200 bg-white px-3 py-2 text-sm font-semibold text-sand-900 outline-none transition focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20"
          >
            {EDITABLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>

        {draft.type === "either_or" ? (
          <div className="space-y-2 sm:col-span-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-sand-500">
              Antwortmöglichkeiten
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              {[0, 1].map((index) => (
                <input
                  key={index}
                  value={options[index]}
                  onChange={(event) => {
                    const next = [...options];
                    next[index] = event.target.value;
                    onChange({ options: next });
                  }}
                  placeholder={`Option ${index + 1}`}
                  className="w-full rounded-2xl border border-sand-200 bg-white px-3 py-2 text-sm font-semibold text-sand-900 outline-none transition focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20"
                />
              ))}
            </div>
          </div>
        ) : null}

        {draft.type === "meme_caption" ? (
          <label className="space-y-1.5 sm:col-span-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-sand-500">
              Meme-Bildpfad
            </span>
            <input
              value={draft.imagePath ?? ""}
              onChange={(event) => onChange({ imagePath: event.target.value })}
              placeholder="/memes/beispiel.jpg"
              className="w-full rounded-2xl border border-sand-200 bg-white px-3 py-2 text-sm font-semibold text-sand-900 outline-none transition focus:border-admin-primary focus:ring-2 focus:ring-admin-primary/20"
            />
            {draft.imagePath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={draft.imagePath}
                alt=""
                className="mt-2 h-36 w-full rounded-2xl border border-sand-100 object-cover shadow-card-flat"
              />
            ) : null}
          </label>
        ) : null}
      </div>

      {draft.type === "single_choice" || draft.type === "multi_choice" ? (
        <p className="mt-3 rounded-2xl bg-white/75 px-3 py-2 text-xs font-medium text-sand-600">
          Kandidaten kommen automatisch aus den aktuellen Gruppenmitgliedern.
        </p>
      ) : null}

      {draft.type === "duel_1v1" || draft.type === "duel_2v2" ? (
        <p className="mt-3 rounded-2xl bg-white/75 px-3 py-2 text-xs font-medium text-sand-600">
          Duell-Paarungen werden beim Daily automatisch erzeugt.
        </p>
      ) : null}

      {message ? (
        <p
          className={`mt-3 rounded-2xl px-3 py-2 text-sm font-semibold ${
            status === "error"
              ? "bg-danger-soft text-danger-text"
              : "bg-success-soft text-success-text"
          }`}
        >
          {message}
        </p>
      ) : null}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={status === "saving"}>
          Abbrechen
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => void onSave()}
          disabled={status === "saving"}
        >
          {status === "saving" ? savingLabel : saveLabel}
        </Button>
      </div>
    </div>
  );
}

function normalizeEitherOrOptions(options: string[] | undefined): [string, string] {
  return [options?.[0] ?? "", options?.[1] ?? ""];
}

function createEmptyQuestionDraft(): AdminQuestionEditInput {
  return {
    text: "",
    category: "pure_fun",
    type: "single_choice",
    targetMode: "daily",
  };
}
