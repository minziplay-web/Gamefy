import type { ReactNode } from "react";

export function ErrorBanner({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-danger-text/18 bg-danger-soft px-4 py-3 text-sm text-danger-text shadow-card-flat">
      <span
        aria-hidden
        className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold ring-1 ring-danger-text/18"
      >
        !
      </span>
      <div className="flex-1 leading-relaxed">{message}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
