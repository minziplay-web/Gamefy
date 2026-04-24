import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CategoryBadge } from "@/components/ui/category-badge";
import { QuestionReveal } from "@/components/daily/question-reveal";
import type { DailyRecapItem } from "@/lib/types/frontend";

export function DailyRecap({ items }: { items: DailyRecapItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <header className="flex items-end justify-between gap-3 px-1 pt-2">
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-sand-900">
          Heute aufgelöst
        </h2>
        <Link
          href="/daily"
          className="inline-flex min-h-10 items-center rounded-full bg-sand-100 px-3 text-xs font-semibold text-sand-800 transition hover:bg-sand-200"
        >
          Alle →
        </Link>
      </header>

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={item.questionId}>
            <Card tone="raised" className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={item.category} size="sm" />
                  {item.anonymous ? (
                    <Badge tone="neutral" size="sm">
                      Anonym
                    </Badge>
                  ) : null}
                </div>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-sand-400">
                  #{index + 1}
                </span>
              </div>
              <h3 className="text-base font-semibold leading-snug text-sand-900">
                {item.questionText}
              </h3>
              <QuestionReveal result={item.result} />
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
