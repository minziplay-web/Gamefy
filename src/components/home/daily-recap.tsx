import { Card } from "@/components/ui/card";
import { CategoryBadge } from "@/components/ui/category-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { QuestionReveal } from "@/components/daily/question-reveal";
import type { DailyRecapItem } from "@/lib/types/frontend";

export function DailyRecap({
  items,
  onVoteMemeCaption,
}: {
  items: DailyRecapItem[];
  onVoteMemeCaption?: (
    item: DailyRecapItem,
    authorUserId: string,
    value: boolean,
  ) => Promise<void>;
}) {
  if (items.length === 0) {
    return (
      <section className="space-y-3">
        <header className="px-1 pt-2">
          <h2 className="text-2xl font-semibold leading-tight tracking-tight text-recap-text">
            Heute aufgelöst
          </h2>
        </header>
        <EmptyState
          icon="⌛"
          tone="recap"
          title="Noch nichts aufgelöst"
          description="Sobald Antworten sichtbar sind, sammeln sie sich hier."
        />
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <header className="px-1 pt-2">
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-recap-text">
          Heute aufgelöst
        </h2>
      </header>

      <ul className="space-y-3">
        {items.map((item, index) => {
          return (
          <li key={item.questionId}>
            <Card
              tone="raised"
              className="space-y-3 border-transparent bg-transparent p-0 shadow-none"
            >
              <div className="px-1">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <CategoryBadge category={item.category} size="sm" />
                  <span className="shrink-0 text-[11px] font-semibold tabular-nums text-sand-400">
                    #{index + 1}
                  </span>
                </div>
                <h3 className="text-base font-semibold leading-snug text-sand-900">
                  {item.questionText}
                </h3>
              </div>
              <QuestionReveal
                result={item.result}
                tone="recap"
                onVoteMemeCaption={
                  onVoteMemeCaption
                    ? (authorUserId, value) =>
                        onVoteMemeCaption(item, authorUserId, value)
                    : undefined
                }
              />
            </Card>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
