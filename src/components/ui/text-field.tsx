import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const baseInput =
  "min-h-12 w-full rounded-2xl border bg-white px-4 text-base text-sand-900 outline-none placeholder:text-sand-400 shadow-card-flat transition focus:border-sand-400 focus:ring-2 focus:ring-sand-200 focus:ring-offset-0";
const baseArea =
  "min-h-32 w-full rounded-2xl border bg-white px-4 py-3 text-base leading-relaxed text-sand-900 outline-none placeholder:text-sand-400 shadow-card-flat transition focus:border-sand-400 focus:ring-2 focus:ring-sand-200";

export function TextField({
  label,
  error,
  helper,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
  helper?: string;
}) {
  return (
    <label className="block space-y-2">
      {label ? (
        <span className="text-sm font-semibold text-sand-700">{label}</span>
      ) : null}
      <input
        {...props}
        className={`${baseInput} ${
          error ? "border-archive-mid/55" : "border-sand-200"
        } ${className}`}
      />
      {error ? (
        <span className="text-xs font-medium text-danger-text">{error}</span>
      ) : helper ? (
        <span className="text-xs text-sand-500">{helper}</span>
      ) : null}
    </label>
  );
}

export function TextArea({
  label,
  error,
  helper,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string | null;
  helper?: string;
}) {
  return (
    <label className="block space-y-2">
      {label ? (
        <span className="text-sm font-semibold text-sand-700">{label}</span>
      ) : null}
      <textarea
        {...props}
        className={`${baseArea} ${
          error ? "border-archive-mid/55" : "border-sand-200"
        } ${className}`}
      />
      {error ? (
        <span className="text-xs font-medium text-danger-text">{error}</span>
      ) : helper ? (
        <span className="text-xs text-sand-500">{helper}</span>
      ) : null}
    </label>
  );
}
