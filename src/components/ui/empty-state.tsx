import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[28px] border border-dashed border-sand-200 bg-white/50 px-6 py-10 text-center">
      {icon ? (
        <div className="flex size-14 items-center justify-center rounded-full bg-sand-100 text-2xl">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-sand-900">{title}</h3>
        {description ? (
          <p className="text-sm text-sand-600">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
