"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  tone = "default",
  onCancel,
  onConfirm,
  loading = false,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "destructive";
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-sand-900/45 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <div
        className="safe-area-bottom w-full max-w-sm space-y-5 rounded-t-[28px] border border-white/70 bg-white p-6 shadow-xl sm:radius-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-sand-900">{title}</h2>
          <p className="text-sm leading-relaxed text-sand-700">{description}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            className="flex-1"
            variant={tone === "destructive" ? "destructive" : "primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Bitte warten..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

