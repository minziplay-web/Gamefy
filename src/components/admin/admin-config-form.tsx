"use client";

import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import type { AdminConfigDraft } from "@/lib/types/frontend";

export function AdminConfigForm({
  draft,
  saveStatus,
  saveError,
  dirty,
  onChange,
  onSave,
}: {
  draft: AdminConfigDraft;
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError?: string;
  dirty: boolean;
  onChange: (next: AdminConfigDraft) => void;
  onSave: () => void;
}) {
  return (
    <section className="space-y-5 radius-card border border-white/60 bg-white/85 p-5 shadow-card-flat">
      <div className="space-y-4">
        <Stepper
          label="Dailys pro Tag"
          value={draft.dailyQuestionCount}
          min={1}
          max={12}
          onChange={(dailyQuestionCount) => onChange({ ...draft, dailyQuestionCount })}
        />
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-sand-500">
            Reveal-Policy
          </span>
          <Segmented
            value={draft.dailyRevealPolicy}
            onChange={(dailyRevealPolicy) => onChange({ ...draft, dailyRevealPolicy })}
            options={[
              { value: "after_answer", label: "Nach Antwort" },
              { value: "after_day_end", label: "Tagesende" },
            ]}
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-sand-50 px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-sand-800">
              Onboarding erzwingen
            </p>
            <p className="text-[11px] text-sand-500">
              Neue User müssen Name + Bild setzen.
            </p>
          </div>
          <ToggleSwitch
            label="Onboarding erzwingen"
            checked={draft.onboardingEnabled}
            onChange={(onboardingEnabled) => onChange({ ...draft, onboardingEnabled })}
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-sand-50 px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-sand-800">
              Daily nachts automatisch erzeugen
            </p>
            <p className="text-[11px] text-sand-500">
              Erstellt um 00:00 Uhr automatisch ein neues Daily, wenn für den Tag noch keins existiert.
            </p>
          </div>
          <ToggleSwitch
            label="Auto-Daily"
            checked={draft.dailyAutoCreateEnabled}
            onChange={(dailyAutoCreateEnabled) => onChange({ ...draft, dailyAutoCreateEnabled })}
          />
        </div>
      </div>

      {saveStatus === "error" && saveError ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          {saveError}
        </p>
      ) : null}
      {saveStatus === "saved" ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          Gespeichert.
        </p>
      ) : null}

      <Button
        className="w-full"
        disabled={!dirty || saveStatus === "saving"}
        onClick={onSave}
      >
        {saveStatus === "saving" ? "Speichere..." : "Speichern"}
      </Button>
    </section>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
}) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-sand-800">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          aria-label={`${label} verringern`}
          className="flex size-12 items-center justify-center rounded-full bg-sand-100 text-xl font-semibold text-sand-800 transition hover:bg-sand-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <span className="w-12 text-center text-lg font-semibold tabular-nums text-sand-900">
          {value}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          aria-label={`${label} erhöhen`}
          className="flex size-12 items-center justify-center rounded-full bg-sand-100 text-xl font-semibold text-sand-800 transition hover:bg-sand-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

