"use client";

import { useEffect } from "react";

const ADMIN_ACCENT = "#4A5699";
const DANGER = "#E5594F";

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

  const isDestructive = tone === "destructive";
  const accent = isDestructive ? DANGER : ADMIN_ACCENT;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <div
        className="safe-area-bottom w-full max-w-sm space-y-5 rounded-t-[28px] bg-[#1A1A1A] p-6 ring-1 ring-[#1F1F1F] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: accent, fontFamily: "var(--font-mono)" }}
          >
            {isDestructive ? "Achtung" : "Bestätigung"}
          </p>
          <h2
            className="text-[18px] font-semibold leading-tight"
            style={{ color: "#FAFAFA", textWrap: "balance" }}
          >
            {title}
          </h2>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "#A8A8A8", textWrap: "pretty" }}
          >
            {description}
          </p>
        </div>
        <div className="flex gap-2">
          <DialogButton variant="subtle" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </DialogButton>
          <DialogButton
            variant={isDestructive ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Bitte warten..." : confirmLabel}
          </DialogButton>
        </div>
      </div>
    </div>
  );
}

function DialogButton({
  children,
  variant,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  variant: "primary" | "subtle" | "danger";
  onClick: () => void;
  disabled?: boolean;
}) {
  const styles =
    variant === "primary"
      ? { backgroundColor: ADMIN_ACCENT, color: "#FAFAFA" }
      : variant === "danger"
        ? {
            backgroundColor: "rgba(229, 89, 79, 0.14)",
            color: DANGER,
            boxShadow: "inset 0 0 0 1px rgba(229, 89, 79, 0.4)",
          }
        : {
            backgroundColor: "#0E0E0E",
            color: "#FAFAFA",
            boxShadow: "inset 0 0 0 1px #1F1F1F",
          };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl px-3 text-[12px] font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-40"
      style={{ ...styles, fontFamily: "var(--font-mono)" }}
    >
      {children}
    </button>
  );
}
