import { ProgressBar } from "@/components/ui/progress-bar";

export function DailyProgress({
  answered,
  total,
}: {
  answered: number;
  total: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-sand-900">Fortschritt</span>
        <span className="tabular-nums text-sand-600">
          {answered} / {total} beantwortet
        </span>
      </div>
      <ProgressBar value={answered} total={total} tone="daily" />
    </div>
  );
}
