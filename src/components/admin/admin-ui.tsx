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

export function DarkSegmented<T extends string>({
  options,
  value,
  onChange,
  accent = ADMIN_ACCENT,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
  accent?: string;
}) {
  return (
    <div
      className="inline-flex w-full items-center gap-1 rounded-xl bg-[#0E0E0E] p-1 ring-1 ring-[#1F1F1F]"
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(opt.value)}
            className="min-h-10 flex-1 rounded-lg px-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition"
            style={{
              backgroundColor: active ? accent : "transparent",
              color: active ? "#FAFAFA" : "#A8A8A8",
              fontFamily: "var(--font-mono)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function DarkSwitch({
  checked,
  onChange,
  label,
  disabled = false,
  accent = ADMIN_ACCENT,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  accent?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50"
      style={{ backgroundColor: checked ? accent : "#2C2C2E" }}
    >
      <span
        className="absolute top-0.5 size-6 rounded-full bg-[#FAFAFA] shadow-sm transition"
        style={{ left: checked ? "1.375rem" : "0.125rem" }}
      />
    </button>
  );
}

export function DarkStepper({
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
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#0E0E0E] px-3 py-2.5 ring-1 ring-[#1F1F1F]">
      <span className="text-[13px] font-semibold text-[#FAFAFA]">{label}</span>
      <div className="flex items-center gap-1.5">
        <StepperBtn label={`${label} verringern`} onClick={dec} disabled={value <= min}>
          −
        </StepperBtn>
        <span
          className="w-10 text-center text-[15px] font-semibold tabular-nums text-[#FAFAFA]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {value}
        </span>
        <StepperBtn label={`${label} erhöhen`} onClick={inc} disabled={value >= max}>
          +
        </StepperBtn>
      </div>
    </div>
  );
}

function StepperBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full text-[18px] font-semibold text-[#FAFAFA] ring-1 ring-[#1F1F1F] transition hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-30"
      style={{ backgroundColor: "#1A1A1A" }}
    >
      {children}
    </button>
  );
}

export function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled = false,
  accent = ADMIN_ACCENT,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#0E0E0E] px-3 py-2.5 ring-1 ring-[#1F1F1F]">
      <div className="min-w-0 space-y-0.5">
        <p className="text-[13px] font-semibold text-[#FAFAFA]">{title}</p>
        {description ? (
          <p className="text-[11px] leading-relaxed text-[#A8A8A8]">{description}</p>
        ) : null}
      </div>
      <DarkSwitch
        checked={checked}
        onChange={onChange}
        label={title}
        disabled={disabled}
        accent={accent}
      />
    </div>
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
