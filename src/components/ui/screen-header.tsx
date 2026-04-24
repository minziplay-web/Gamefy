import type { ReactNode } from "react";

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="space-y-2 px-1 pb-3 pt-4">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sand-500">
          {eyebrow}
        </p>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight text-sand-900">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-[15px] leading-relaxed text-sand-700">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0 pt-0.5">{action}</div> : null}
      </div>
    </header>
  );
}
