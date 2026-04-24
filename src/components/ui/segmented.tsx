"use client";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex w-full items-center gap-1 rounded-2xl bg-sand-100/80 p-1 ${className}`}
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
            className={`min-h-12 flex-1 rounded-xl px-3 text-sm font-semibold transition ${
              active
                ? "bg-white text-sand-900 shadow-sm"
                : "text-sand-600 hover:text-sand-900"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
