"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { TextField } from "@/components/ui/text-field";
import { useAuth } from "@/lib/auth/auth-context";
import type { AppUser } from "@/lib/types/frontend";

export function ProfileNameEditor({ user }: { user: AppUser }) {
  const { updateDisplayName } = useAuth();
  const [draft, setDraft] = useState(user.displayName);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const trimmed = draft.trim();
  const nameError =
    trimmed.length > 0 && trimmed.length < 2
      ? "Name muss mindestens 2 Zeichen haben."
      : null;
  const hasChanges = trimmed !== user.displayName;

  const handleCancel = () => {
    setDraft(user.displayName);
    setStatus("idle");
    setError(null);
  };

  const handleSave = async () => {
    if (trimmed.length < 2) {
      setStatus("error");
      setError("Name muss mindestens 2 Zeichen haben.");
      return;
    }

    setStatus("saving");
    setError(null);
    try {
      await updateDisplayName(trimmed);
      setStatus("idle");
    } catch (saveError) {
      setStatus("error");
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Name konnte nicht gespeichert werden.",
      );
    }
  };

  return (
    <section className="space-y-3 rounded-3xl border border-white/60 bg-white/85 p-4 shadow-card-flat backdrop-blur-sm">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sand-500">
          Anzeigename
        </p>
        <p className="text-sm text-sand-700">
          So erscheinst du in Fragen, Ergebnissen und im Profil.
        </p>
      </div>
      <div className="space-y-4 rounded-2xl border border-dashed border-sand-200 bg-sand-50/60 p-4">
        <TextField
          label="Anzeigename"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (status === "error") {
              setStatus("idle");
              setError(null);
            }
          }}
          placeholder="z. B. Leon"
          maxLength={24}
          error={nameError}
        />
        {status === "error" && error ? <ErrorBanner message={error} /> : null}
        <div className="flex gap-3">
          <Button
            className="flex-1"
            disabled={!hasChanges || trimmed.length < 2 || status === "saving"}
            onClick={handleSave}
          >
            {status === "saving" ? "Speichert..." : "Speichern"}
          </Button>
          <Button variant="ghost" className="flex-1" onClick={handleCancel}>
            Zurücksetzen
          </Button>
        </div>
      </div>
    </section>
  );
}
