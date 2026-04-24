"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AvatarUploader } from "@/components/onboarding/avatar-uploader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorBanner } from "@/components/ui/error-banner";
import { TextField } from "@/components/ui/text-field";
import { useAuth } from "@/lib/auth/auth-context";

export function OnboardingScreen({
  previewPreset = "empty",
}: {
  previewPreset?: "empty" | "filled";
}) {
  const router = useRouter();
  const { authState, completeOnboarding, logout, isMockMode } = useAuth();

  const [displayName, setDisplayName] = useState(
    previewPreset === "filled" ? "Leon" : "",
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoExpanded, setPhotoExpanded] = useState(previewPreset === "filled");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const nameError =
    displayName.trim().length > 0 && displayName.trim().length < 2
      ? "Name muss mindestens 2 Zeichen haben."
      : null;
  const canSubmit =
    status !== "submitting" && displayName.trim().length >= 2;

  const handleFile = (file: File) => {
    setPhotoFile(file);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(null);
  };

  const submit = async () => {
    setStatus("submitting");
    setError(null);
    try {
      await completeOnboarding({ displayName, photoFile });
      setStatus("idle");
      router.push("/");
    } catch {
      setStatus("error");
      setError("Profil konnte nicht gespeichert werden.");
    }
  };

  return (
    <div className="flex min-h-dvh items-center">
      <Card className="w-full space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral-strong">
            Willkommen
          </p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-sand-900">
            Wie sollen dich deine Freunde sehen?
          </h1>
          <p className="text-sm leading-relaxed text-sand-700">
            Ein Anzeigename reicht. Der Rest kann später kommen.
          </p>
          {authState.status === "authenticated" ? (
            <p className="text-[11px] text-sand-500">
              Eingeloggt als {authState.user.email || authState.user.displayName}
              {isMockMode ? " (Mock-Modus)" : ""}
            </p>
          ) : null}
        </div>

        <TextField
          label="Anzeigename"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="z. B. Leon"
          maxLength={24}
          autoFocus
          error={nameError}
        />

        {photoExpanded || photoPreviewUrl ? (
          <div className="space-y-3 rounded-2xl border border-dashed border-sand-200 bg-sand-50/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sand-500">
              Profilbild (optional)
            </p>
            <AvatarUploader
              displayName={displayName || "?"}
              previewUrl={photoPreviewUrl}
              onFileSelected={handleFile}
              onClear={clearPhoto}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPhotoExpanded(true)}
            className="min-h-12 w-full rounded-2xl border border-dashed border-sand-200 bg-sand-50/60 px-4 py-3 text-left text-sm font-medium text-sand-600 transition hover:border-sand-300 hover:bg-sand-50"
          >
            + Profilbild hinzufügen (optional)
          </button>
        )}

        {status === "error" && error ? <ErrorBanner message={error} /> : null}

        <div className="space-y-3 pt-1">
          <Button className="w-full" disabled={!canSubmit} onClick={submit}>
            {status === "submitting" ? "Speichert..." : "Profil speichern"}
          </Button>
          <button
            type="button"
            onClick={() => logout()}
            className="mx-auto block min-h-10 text-xs font-medium text-sand-400 underline underline-offset-2 hover:text-sand-700"
          >
            Abmelden
          </button>
        </div>
      </Card>
    </div>
  );
}
