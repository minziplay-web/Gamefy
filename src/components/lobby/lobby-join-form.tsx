"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ScreenHeader } from "@/components/ui/screen-header";
import { TextField } from "@/components/ui/text-field";

export function LobbyJoinForm({
  submitStatus,
  submitError,
  onCancel,
  onSubmit,
}: {
  submitStatus: "idle" | "submitting" | "error";
  submitError?: string;
  onCancel: () => void;
  onSubmit: (code: string) => void;
}) {
  const [code, setCode] = useState("");
  const normalized = code.trim().toUpperCase();

  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow="Live"
        title="Code eingeben"
        subtitle="Frag den Host nach dem 5-stelligen Code."
      />
      <Card className="space-y-4">
        <TextField
          label="Lobby-Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          autoCapitalize="characters"
          autoCorrect="off"
          maxLength={8}
          placeholder="z. B. FRND7"
          error={submitStatus === "error" ? submitError : null}
        />
        {submitStatus === "error" && submitError ? (
          <ErrorBanner message={submitError} />
        ) : null}
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button
            className="flex-1"
            disabled={normalized.length < 3 || submitStatus === "submitting"}
            onClick={() => onSubmit(normalized)}
          >
            {submitStatus === "submitting" ? "Verbinde..." : "Beitreten"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
