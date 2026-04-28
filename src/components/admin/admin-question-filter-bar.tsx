"use client";

import { CATEGORY_LABELS } from "@/lib/mapping/categories";
import type {
  AdminQuestionFilter,
  Category,
  QuestionType,
} from "@/lib/types/frontend";

const TYPE_OPTIONS: Array<{ value: QuestionType | "all"; label: string }> = [
  { value: "all", label: "Alle Typen" },
  { value: "single_choice", label: "Single Choice" },
  { value: "multi_choice", label: "Multi Choice" },
  { value: "open_text", label: "Freitext" },
  { value: "duel_1v1", label: "1v1" },
  { value: "duel_2v2", label: "2v2" },
  { value: "either_or", label: "Entweder / Oder" },
  { value: "meme_caption", label: "Meme" },
];

const ACTIVE_OPTIONS: Array<{
  value: AdminQuestionFilter["active"];
  label: string;
}> = [
  { value: "all", label: "Alle" },
  { value: "active", label: "Aktiv" },
  { value: "inactive", label: "Deaktiviert" },
];

export function AdminQuestionFilterBar({
  filter,
  onChange,
}: {
  filter: AdminQuestionFilter;
  onChange: (next: AdminQuestionFilter) => void;
}) {
  const categoryOptions = Object.entries(CATEGORY_LABELS) as Array<[Category, string]>;

  return (
    <div className="space-y-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-card-flat">
      <input
        type="search"
        placeholder="Frage suchen..."
        value={filter.search}
        onChange={(e) => onChange({ ...filter, search: e.target.value })}
        className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-sand-900 shadow-card-flat outline-none placeholder:text-sand-400 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <SelectField
          label="Kategorie"
          value={filter.category}
          options={[
            { value: "all", label: "Alle Kategorien" },
            ...categoryOptions.map(([value, label]) => ({ value, label })),
          ]}
          onChange={(category) => onChange({ ...filter, category })}
        />
        <SelectField
          label="Typ"
          value={filter.type}
          options={TYPE_OPTIONS}
          onChange={(type) => onChange({ ...filter, type })}
        />
        <SelectField
          label="Status"
          value={filter.active}
          options={ACTIVE_OPTIONS}
          onChange={(active) => onChange({ ...filter, active })}
        />
      </div>
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (next: T) => void;
}) {
  return (
    <label className="space-y-1 text-xs">
      <span className="block font-semibold uppercase tracking-wider text-sand-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="min-h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-sand-900 shadow-card-flat outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
