"use client";

import type { ReactNode } from "react";

export const ADMIN_ACCENT = "#4A5699";
export const DAILY_ACCENT = "#F39A2B";
export const SUCCESS = "#5DD27D";
export const DANGER = "#E5594F";
export const WARNING = "#F39A2B";

type ActionStatus = "idle" | "running" | "saving" | "error" | "success";

export function StatusBanner({
  status,
  message,
}: {
  status: ActionStatus;
  message: string;
}) {
  const accent =
    status === "error" ? DANGER : status === "success" ? SUCCESS : "#A8A8A8";
  return (
    <p
      className="rounded-xl px-3 py-2 text-[12px] font-medium leading-relaxed"
      style={{ backgroundColor: `${accent}14`, color: accent }}
    >
      {message}
    </p>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  fullWidth = false,
  accent = ADMIN_ACCENT,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-9 items-center justify-center rounded-xl px-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
        fullWidth ? "w-full" : ""
      }`}
      style={{
        backgroundColor: accent,
        color: "#FAFAFA",
        fontFamily: "var(--font-mono)",
      }}
    >
      {children}
    </button>
  );
}

export function SubtleButton({
  children,
  onClick,
  disabled,
  fullWidth = false,
  selected = false,
  accent = ADMIN_ACCENT,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  selected?: boolean;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-9 items-center justify-center rounded-xl px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FAFAFA] ring-1 transition hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-40 ${
        fullWidth ? "w-full" : ""
      }`}
      style={{
        backgroundColor: selected ? `${accent}26` : "#0E0E0E",
        boxShadow: `inset 0 0 0 1px ${selected ? `${accent}66` : "#1F1F1F"}`,
        fontFamily: "var(--font-mono)",
      }}
    >
      {children}
    </button>
  );
}

export function DangerButton({
  children,
  onClick,
  disabled,
  fullWidth = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-9 items-center justify-center rounded-xl px-3 text-[11px] font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-40 ${
        fullWidth ? "w-full" : ""
      }`}
      style={{
        backgroundColor: "rgba(229, 89, 79, 0.1)",
        color: DANGER,
        fontFamily: "var(--font-mono)",
        boxShadow: "inset 0 0 0 1px rgba(229, 89, 79, 0.3)",
      }}
    >
      {children}
    </button>
  );
}

export function Eyebrow({
  children,
  accent = "#A8A8A8",
}: {
  children: ReactNode;
  accent?: string;
}) {
  return (
    <p
      className="text-[10px] font-semibold uppercase tracking-[0.22em]"
      style={{ color: accent, fontFamily: "var(--font-mono)" }}
    >
      {children}
    </p>
  );
}

export function MonoMetaLabel({
  children,
  color = "#6E6E73",
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.14em]"
      style={{ color, fontFamily: "var(--font-mono)" }}
    >
      {children}
    </span>
  );
}

export function CountPill({
  children,
  accent = ADMIN_ACCENT,
  muted = false,
}: {
  children: ReactNode;
  accent?: string;
  muted?: boolean;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
      style={{
        backgroundColor: muted ? "#0E0E0E" : `${accent}26`,
        color: muted ? "#A8A8A8" : accent,
        fontFamily: "var(--font-mono)",
        boxShadow: muted ? "inset 0 0 0 1px #1F1F1F" : undefined,
      }}
    >
      {children}
    </span>
  );
}

export function DarkSelect<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: Array<{ value: T; label: string; disabled?: boolean }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full appearance-none rounded-xl bg-[#1A1A1A] px-3 py-2.5 text-[14px] font-semibold text-[#FAFAFA] outline-none ring-1 ring-[#1F1F1F] transition focus:ring-[#4A5699]"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%236E6E73' d='M5 6 0 0h10z'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.875rem center",
        paddingRight: "2rem",
      }}
    >
      {options.map((opt) => (
        <option
          key={opt.value}
          value={opt.value}
          disabled={opt.disabled}
          style={{ backgroundColor: "#1A1A1A", color: "#FAFAFA" }}
        >
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md transition"
      style={{
        backgroundColor: checked ? ADMIN_ACCENT : "transparent",
        boxShadow: `inset 0 0 0 1px ${checked ? ADMIN_ACCENT : "#2C2C2E"}`,
      }}
    >
      {checked ? (
        <svg viewBox="0 0 14 14" width={10} height={10} aria-hidden>
          <path
            d="M3 7l3 3 5-6"
            fill="none"
            stroke="#FAFAFA"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </button>
  );
}

export function CategoryChip({
  emoji,
  label,
  accent = "#A8A8A8",
}: {
  emoji: string;
  label: string;
  accent?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
      style={{ color: accent, fontFamily: "var(--font-mono)" }}
    >
      <span aria-hidden className="shrink-0 text-[12px] leading-none">
        {emoji}
      </span>
      {label}
    </span>
  );
}
