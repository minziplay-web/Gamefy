import type { ReactNode } from "react";

export function ErrorBanner({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      <span aria-hidden className="text-lg leading-none">!</span>
      <div className="flex-1">{message}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
