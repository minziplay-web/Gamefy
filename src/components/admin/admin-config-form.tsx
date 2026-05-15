"use client";

import {
  DarkSegmented,
  DarkStepper,
  PrimaryButton,
  StatusBanner,
  ToggleRow,
} from "@/components/admin/admin-ui";
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
    <section className="space-y-4 rounded-2xl bg-[#1A1A1A] p-4 ring-1 ring-[#1F1F1F]">
      <div className="space-y-2">
        <DarkStepper
          label="Fragen pro Tag"
          value={draft.dailyQuestionCount}
          min={1}
          max={12}
          onChange={(dailyQuestionCount) => onChange({ ...draft, dailyQuestionCount })}
        />

        <label className="block space-y-1.5">
          <span
            className="block text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "#6E6E73", fontFamily: "var(--font-mono)" }}
          >
            Reveal-Policy
          </span>
          <DarkSegmented
            value={draft.dailyRevealPolicy}
            onChange={(dailyRevealPolicy) => onChange({ ...draft, dailyRevealPolicy })}
            options={[
              { value: "after_answer", label: "Nach Antwort" },
              { value: "after_day_end", label: "Tagesende" },
            ]}
          />
        </label>

        <ToggleRow
          title="Onboarding erzwingen"
          description="Neue User müssen Name + Bild setzen."
          checked={draft.onboardingEnabled}
          onChange={(onboardingEnabled) => onChange({ ...draft, onboardingEnabled })}
        />

        <ToggleRow
          title="Auto-Daily"
          description="Erzeugt nachts automatisch, wenn noch keins existiert."
          checked={draft.dailyAutoCreateEnabled}
          onChange={(dailyAutoCreateEnabled) =>
            onChange({ ...draft, dailyAutoCreateEnabled })
          }
        />
      </div>

      {saveStatus === "error" && saveError ? (
        <StatusBanner status="error" message={saveError} />
      ) : null}
      {saveStatus === "saved" ? (
        <StatusBanner status="success" message="Gespeichert." />
      ) : null}

      <PrimaryButton
        onClick={onSave}
        disabled={!dirty || saveStatus === "saving"}
        fullWidth
      >
        {saveStatus === "saving" ? "Speichere..." : "Speichern"}
      </PrimaryButton>
    </section>
  );
}
