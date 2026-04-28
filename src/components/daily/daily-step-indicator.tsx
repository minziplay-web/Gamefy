import type { DailyQuestionCardState } from "@/lib/types/frontend";

type StepStatus = "current" | "answered" | "pending" | "error";

function statusFor(
  card: DailyQuestionCardState | undefined,
  isCurrent: boolean,
): StepStatus {
  if (!card) return "pending";
  if (isCurrent) return "current";
  if (card.phase === "submitted_waiting_reveal" || card.phase === "revealed") {
    return "answered";
  }
  if (card.phase === "error") return "error";
  return "pending";
}

export function DailyStepIndicator({
  cards,
  currentIndex,
  onJump,
}: {
  cards: DailyQuestionCardState[];
  currentIndex: number;
  onJump?: (index: number) => void;
}) {
  const total = cards.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sand-500">
          Frage <span className="text-sand-900">{currentIndex + 1}</span>
          <span className="text-sand-400"> / {total}</span>
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        {cards.map((card, idx) => {
          const status = statusFor(card, idx === currentIndex);
          const clickable = Boolean(onJump) && idx !== currentIndex;
          const dotClass =
            status === "current"
              ? "h-2 flex-1 rounded-full bg-daily-primary"
              : status === "answered"
                ? "h-2 flex-1 rounded-full bg-daily-text"
                : status === "error"
                  ? "h-2 flex-1 rounded-full bg-archive-mid/45"
                  : "h-2 flex-1 rounded-full bg-daily-track";
          return (
            <button
              key={card.question.questionId}
              type="button"
              aria-label={`Frage ${idx + 1} von ${total}`}
              onClick={clickable ? () => onJump?.(idx) : undefined}
              disabled={!clickable}
              className="flex min-h-8 flex-1 items-center transition disabled:cursor-default"
            >
              <span className={dotClass} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
