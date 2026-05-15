"use client";

import { useMemo, useState } from "react";

import {
  ADMIN_ACCENT,
  Checkbox,
  DangerButton,
  DarkSelect,
  PrimaryButton,
  StatusBanner,
  SubtleButton,
  SUCCESS,
} from "@/components/admin/admin-ui";
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
  const hasSelection = selectedIds.length > 0;

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
    <div className="space-y-3">
      <Toolbar
        totalRows={rows.length}
        totalCategories={groupedRows.length}
        selectedCount={selectedIds.length}
        onCreateNew={onCreateQuestion ? startCreating : undefined}
        onToggleAll={toggleAllSelection}
        createSaving={createStatus === "saving"}
      />

      {createDraft ? (
        <QuestionEditPanel
          draft={createDraft}
          status={createStatus}
          message={createMessage}
          saveLabel="Frage erstellen"
          savingLabel="Erstelle..."
          onChange={updateCreateDraft}
          onTypeChange={changeCreateDraftType}
          onSave={saveCreate}
          onCancel={() => {
            setCreateDraft(null);
            setCreateStatus("idle");
            setCreateMessage(undefined);
          }}
        />
      ) : null}

      {hasSelection ? (
        <BulkActionBar
          count={selectedIds.length}
          status={bulkStatus}
          message={bulkMessage}
          onActivate={
            onBulkSetActive
              ? () =>
                  void runBulkAction(
                    () => onBulkSetActive(selectedIds, true),
                    `${selectedIds.length} Fragen aktiviert.`,
                  )
              : undefined
          }
          onDeactivate={
            onBulkSetActive
              ? () =>
                  void runBulkAction(
                    () => onBulkSetActive(selectedIds, false),
                    `${selectedIds.length} Fragen deaktiviert.`,
                  )
              : undefined
          }
          onDelete={
            onBulkDelete
              ? () =>
                  void runBulkAction(
                    () => onBulkDelete(selectedIds),
                    `${selectedIds.length} Fragen gelöscht.`,
                  )
              : undefined
          }
          onClear={() => setSelectedIds([])}
        />
      ) : null}

      {!hasSelection && bulkMessage ? (
        <StatusBanner status={bulkStatus} message={bulkMessage} />
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Keine Fragen gefunden"
          description="Passe die Filter an oder erstelle direkt eine neue Frage."
        />
      ) : (
        <div className="space-y-2">
          {groupedRows.map(([category, categoryRows]) => {
            const expanded = expandedCategories[category] ?? false;
            const selectedInCategory = categoryRows.filter((row) =>
              selectedSet.has(row.questionId),
            ).length;

            return (
              <CategorySection
                key={category}
                category={category}
                rows={categoryRows}
                expanded={expanded}
                selectedSet={selectedSet}
                selectedInCategory={selectedInCategory}
                onToggleExpanded={() => toggleExpanded(category)}
                onToggleSelection={() => toggleCategorySelection(categoryRows)}
                onToggleRowSelection={toggleSelected}
                onToggleActive={onToggleActive}
                onStartEdit={startEditing}
                onDelete={
                  onBulkDelete
                    ? (id) =>
                        void runBulkAction(
                          () => onBulkDelete([id]),
                          "Frage gelöscht.",
                        )
                    : undefined
                }
                deleteAvailable={Boolean(onBulkDelete)}
                editAvailable={Boolean(onUpdateQuestion)}
                editingId={editingId}
                editDraft={editDraft}
                editStatus={editStatus}
                editMessage={editMessage}
                onEditChange={updateDraft}
                onEditTypeChange={changeDraftType}
                onEditSave={saveEdit}
                onEditCancel={() => {
                  setEditingId(null);
                  setEditDraft(null);
                  setEditStatus("idle");
                  setEditMessage(undefined);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function Toolbar({
  totalRows,
  totalCategories,
  selectedCount,
  onCreateNew,
  onToggleAll,
  createSaving,
}: {
  totalRows: number;
  totalCategories: number;
  selectedCount: number;
  onCreateNew?: () => void;
  onToggleAll: () => void;
  createSaving: boolean;
}) {
  const allSelected = selectedCount === totalRows && totalRows > 0;
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#1A1A1A] px-4 py-3 ring-1 ring-[#1F1F1F]">
      <div className="min-w-0">
        <p
          className="text-[9px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "#6E6E73", fontFamily: "var(--font-mono)" }}
        >
          Fragenpool
        </p>
        <p
          className="text-[15px] font-semibold tabular-nums text-[#FAFAFA]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {totalRows}{" "}
          <span className="text-[#A8A8A8]">
            in {totalCategories} {totalCategories === 1 ? "Kategorie" : "Kategorien"}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <SubtleButton onClick={onToggleAll} disabled={totalRows === 0}>
          {allSelected ? "Abwählen" : "Alle"}
        </SubtleButton>
        {onCreateNew ? (
          <PrimaryButton onClick={onCreateNew} disabled={createSaving}>
            + Neu
          </PrimaryButton>
        ) : null}
      </div>
    </div>
  );
}

function BulkActionBar({
  count,
  status,
  message,
  onActivate,
  onDeactivate,
  onDelete,
  onClear,
}: {
  count: number;
  status: "idle" | "running" | "error" | "success";
  message?: string;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onDelete?: () => void;
  onClear: () => void;
}) {
  const running = status === "running";
  return (
    <div className="space-y-2 rounded-2xl bg-[#1A1A1A] p-3 ring-1 ring-[#4A5699]/40">
      <div className="flex items-center justify-between gap-2">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: ADMIN_ACCENT, fontFamily: "var(--font-mono)" }}
        >
          {count} ausgewählt
        </p>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A8A8] transition hover:text-[#FAFAFA]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Abwählen
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <SubtleButton onClick={onActivate} disabled={running || !onActivate}>
          Aktivieren
        </SubtleButton>
        <SubtleButton onClick={onDeactivate} disabled={running || !onDeactivate}>
          Deaktivieren
        </SubtleButton>
        <DangerButton onClick={onDelete} disabled={running || !onDelete}>
          Löschen
        </DangerButton>
      </div>
      {message ? <StatusBanner status={status} message={message} /> : null}
    </div>
  );
}

function CategorySection({
  category,
  rows,
  expanded,
  selectedSet,
  selectedInCategory,
  onToggleExpanded,
  onToggleSelection,
  onToggleRowSelection,
  onToggleActive,
  onStartEdit,
  onDelete,
  deleteAvailable,
  editAvailable,
  editingId,
  editDraft,
  editStatus,
  editMessage,
  onEditChange,
  onEditTypeChange,
  onEditSave,
  onEditCancel,
}: {
  category: Category;
  rows: AdminQuestionRow[];
  expanded: boolean;
  selectedSet: Set<string>;
  selectedInCategory: number;
  onToggleExpanded: () => void;
  onToggleSelection: () => void;
  onToggleRowSelection: (id: string) => void;
  onToggleActive: (id: string, next: boolean) => void;
  onStartEdit: (row: AdminQuestionRow) => void;
  onDelete?: (id: string) => void;
  deleteAvailable: boolean;
  editAvailable: boolean;
  editingId: string | null;
  editDraft: AdminQuestionEditInput | null;
  editStatus: "idle" | "saving" | "error" | "success";
  editMessage?: string;
  onEditChange: (patch: Partial<AdminQuestionEditInput>) => void;
  onEditTypeChange: (type: QuestionType) => void;
  onEditSave: () => Promise<void>;
  onEditCancel: () => void;
}) {
  const allSelected = selectedInCategory === rows.length && rows.length > 0;
  return (
    <section className="overflow-hidden rounded-2xl bg-[#1A1A1A] ring-1 ring-[#1F1F1F]">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={onToggleExpanded}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            className="w-3 shrink-0 text-[11px] text-[#6E6E73] transition-transform"
            style={{
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              fontFamily: "var(--font-mono)",
            }}
            aria-hidden
          >
            ▸
          </span>
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#FAFAFA]">
            {CATEGORY_LABELS[category]}
          </span>
          <span
            className="shrink-0 text-[11px] tabular-nums text-[#A8A8A8]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {rows.length}
          </span>
          {selectedInCategory > 0 ? (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
              style={{
                backgroundColor: `${ADMIN_ACCENT}26`,
                color: ADMIN_ACCENT,
                fontFamily: "var(--font-mono)",
              }}
            >
              {selectedInCategory}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={onToggleSelection}
          className="shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A8A8A8] transition hover:bg-[#0E0E0E] hover:text-[#FAFAFA]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {allSelected ? "Abwählen" : "Wählen"}
        </button>
      </div>

      {expanded ? (
        <ul className="divide-y divide-[#1F1F1F] border-t border-[#1F1F1F]">
          {rows.map((row) => (
            <QuestionRow
              key={row.questionId}
              row={row}
              selected={selectedSet.has(row.questionId)}
              onToggleSelected={() => onToggleRowSelection(row.questionId)}
              onToggleActive={() => onToggleActive(row.questionId, !row.active)}
              onStartEdit={() => onStartEdit(row)}
              onDelete={onDelete ? () => onDelete(row.questionId) : undefined}
              deleteAvailable={deleteAvailable}
              editAvailable={editAvailable}
              isEditing={editingId === row.questionId}
              editDraft={editDraft}
              editStatus={editStatus}
              editMessage={editMessage}
              onEditChange={onEditChange}
              onEditTypeChange={onEditTypeChange}
              onEditSave={onEditSave}
              onEditCancel={onEditCancel}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function QuestionRow({
  row,
  selected,
  onToggleSelected,
  onToggleActive,
  onStartEdit,
  onDelete,
  deleteAvailable,
  editAvailable,
  isEditing,
  editDraft,
  editStatus,
  editMessage,
  onEditChange,
  onEditTypeChange,
  onEditSave,
  onEditCancel,
}: {
  row: AdminQuestionRow;
  selected: boolean;
  onToggleSelected: () => void;
  onToggleActive: () => void;
  onStartEdit: () => void;
  onDelete?: () => void;
  deleteAvailable: boolean;
  editAvailable: boolean;
  isEditing: boolean;
  editDraft: AdminQuestionEditInput | null;
  editStatus: "idle" | "saving" | "error" | "success";
  editMessage?: string;
  onEditChange: (patch: Partial<AdminQuestionEditInput>) => void;
  onEditTypeChange: (type: QuestionType) => void;
  onEditSave: () => Promise<void>;
  onEditCancel: () => void;
}) {
  return (
    <li
      className="px-4 py-3 transition"
      style={{
        opacity: row.active ? 1 : 0.55,
        backgroundColor: selected ? "rgba(74, 86, 153, 0.08)" : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onChange={onToggleSelected} label={`${row.text} auswählen`} />
        <div className="min-w-0 flex-1 space-y-2">
          {row.type === "meme_caption" && row.imagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.imagePath}
              alt=""
              className="h-32 w-full rounded-xl object-cover ring-1 ring-[#1F1F1F]"
            />
          ) : null}
          <p className="text-[14px] leading-snug text-[#FAFAFA]">{row.text}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "#A8A8A8", fontFamily: "var(--font-mono)" }}
            >
              <span
                className="block size-1 rounded-full"
                style={{ backgroundColor: row.active ? SUCCESS : "#6E6E73" }}
                aria-hidden
              />
              {TYPE_LABELS[row.type]}
            </span>
            {row.dailyLockedDateKey ? (
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "#F39A2B", fontFamily: "var(--font-mono)" }}
              >
                Verbraucht · {row.dailyLockedDateKey}
              </span>
            ) : null}
            <span
              className="text-[10px] tabular-nums text-[#6E6E73]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              von {row.createdByDisplayName}
            </span>
          </div>
        </div>
      </div>

      {isEditing && editDraft ? (
        <div className="mt-3">
          <QuestionEditPanel
            draft={editDraft}
            status={editStatus}
            message={editMessage}
            saveLabel="Speichern"
            savingLabel="Speichert..."
            onChange={onEditChange}
            onTypeChange={onEditTypeChange}
            onSave={onEditSave}
            onCancel={onEditCancel}
          />
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <SubtleButton onClick={onToggleActive}>
            {row.active ? "Deaktivieren" : "Aktivieren"}
          </SubtleButton>
          <SubtleButton onClick={onStartEdit} disabled={!editAvailable}>
            Bearbeiten
          </SubtleButton>
          <DangerButton onClick={onDelete} disabled={!deleteAvailable || !onDelete}>
            Löschen
          </DangerButton>
        </div>
      )}
    </li>
  );
}

export function QuestionEditPanel({
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
    <div className="space-y-3 rounded-2xl bg-[#0E0E0E] p-4 ring-1 ring-[#4A5699]/30">
      <FormGrid>
        <FormField label="Fragetext" fullWidth>
          <textarea
            value={draft.text}
            onChange={(event) => onChange({ text: event.target.value })}
            rows={3}
            className="w-full resize-none rounded-xl bg-[#1A1A1A] px-3 py-2.5 text-[14px] text-[#FAFAFA] outline-none ring-1 ring-[#1F1F1F] transition focus:ring-[#4A5699]"
          />
        </FormField>

        <FormField label="Kategorie">
          <DarkSelect
            value={draft.category}
            onChange={(value) => onChange({ category: value as Category })}
            options={EDITABLE_CATEGORIES.map((cat) => ({
              value: cat,
              label: CATEGORY_LABELS[cat],
            }))}
          />
        </FormField>

        <FormField label="Antworttyp">
          <DarkSelect
            value={draft.type}
            onChange={(value) => onTypeChange(value as QuestionType)}
            options={EDITABLE_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
          />
        </FormField>

        {draft.type === "either_or" ? (
          <FormField label="Antwortmöglichkeiten" fullWidth>
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
                  className="w-full rounded-xl bg-[#1A1A1A] px-3 py-2.5 text-[14px] text-[#FAFAFA] outline-none ring-1 ring-[#1F1F1F] transition placeholder:text-[#6E6E73] focus:ring-[#4A5699]"
                />
              ))}
            </div>
          </FormField>
        ) : null}

        {draft.type === "meme_caption" ? (
          <FormField label="Meme-Bildpfad" fullWidth>
            <input
              value={draft.imagePath ?? ""}
              onChange={(event) => onChange({ imagePath: event.target.value })}
              placeholder="/memes/beispiel.jpg"
              className="w-full rounded-xl bg-[#1A1A1A] px-3 py-2.5 text-[14px] text-[#FAFAFA] outline-none ring-1 ring-[#1F1F1F] transition placeholder:text-[#6E6E73] focus:ring-[#4A5699]"
            />
            {draft.imagePath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={draft.imagePath}
                alt=""
                className="mt-2 h-32 w-full rounded-xl object-cover ring-1 ring-[#1F1F1F]"
              />
            ) : null}
          </FormField>
        ) : null}
      </FormGrid>

      {draft.type === "single_choice" || draft.type === "multi_choice" ? (
        <HintLine>Kandidaten kommen automatisch aus den Gruppenmitgliedern.</HintLine>
      ) : null}
      {draft.type === "duel_1v1" || draft.type === "duel_2v2" ? (
        <HintLine>Duell-Paarungen werden beim Daily automatisch erzeugt.</HintLine>
      ) : null}

      {message ? <StatusBanner status={status} message={message} /> : null}

      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
        <SubtleButton onClick={onCancel} disabled={status === "saving"}>
          Abbrechen
        </SubtleButton>
        <PrimaryButton
          onClick={() => void onSave()}
          disabled={status === "saving"}
        >
          {status === "saving" ? savingLabel : saveLabel}
        </PrimaryButton>
      </div>
    </div>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function FormField({
  label,
  fullWidth = false,
  children,
}: {
  label: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`space-y-1.5 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <span
        className="block text-[9px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: "#6E6E73", fontFamily: "var(--font-mono)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function HintLine({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="rounded-xl bg-[#1A1A1A] px-3 py-2 text-[12px] leading-relaxed text-[#A8A8A8]"
    >
      {children}
    </p>
  );
}

export function normalizeEitherOrOptions(options: string[] | undefined): [string, string] {
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
