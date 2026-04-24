"use client";

import { useEffect, useState } from "react";

import { DailyProgress } from "@/components/daily/daily-progress";
import { QuestionCardShell } from "@/components/daily/question-card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SkeletonCard } from "@/components/ui/skeleton";
import { formatBerlinDateLabel } from "@/lib/mapping/date";
import { mergeDailyState } from "@/lib/mapping/state-merge";
import type {
  DailyAnswerDraft,
  DailyQuestionCardState,
  DailyViewState,
} from "@/lib/types/frontend";

export function DailyScreen({
  state: initial,
  onSubmitAnswer,
}: {
  state: DailyViewState;
  onSubmitAnswer?: (
    draft: DailyAnswerDraft,
    card: DailyQuestionCardState,
  ) => Promise<void>;
}) {
  const [state, setState] = useState(initial);
  useEffect(() => {
    queueMicrotask(() => setState((prev) => mergeDailyState(prev, initial)));
  }, [initial]);

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Daily" title="Heutige Fragen" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Daily" title="Heutige Fragen" />
        <ErrorBanner message={state.message} />
      </div>
    );
  }

  if (state.status === "no_run") {
    return (
      <div className="space-y-4">
        <ScreenHeader
          eyebrow="Daily"
          title={formatBerlinDateLabel(state.dateKey)}
        />
        <EmptyState
          icon="📅"
          title="Heute keine Daily"
          description={state.message}
        />
      </div>
    );
  }

  if (state.status === "run_unplayable") {
    return (
      <div className="space-y-4">
        <ScreenHeader
          eyebrow="Daily"
          title={formatBerlinDateLabel(state.dateKey)}
        />
        <EmptyState
          icon="⚠️"
          title="Daily kann nicht gespielt werden"
          description={
            state.isAdmin
              ? `${state.reason} Erzeuge im Admin einen neuen Run.`
              : `${state.reason} Ein Admin muss den Run neu erzeugen.`
          }
        />
      </div>
    );
  }

  const updateCard = (
    questionId: string,
    mutate: (card: DailyQuestionCardState) => DailyQuestionCardState,
  ) => {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      const nextCards = prev.cards.map((card) =>
        card.question.questionId === questionId ? mutate(card) : card,
      );
      const answered = nextCards.filter(
        (c) =>
          c.phase === "submitted_waiting_reveal" || c.phase === "revealed",
      ).length;
      return {
        ...prev,
        cards: nextCards,
        progress: { answered, total: nextCards.length },
      };
    });
  };

  const handleDraftChange = (questionId: string, draft: DailyAnswerDraft) => {
    updateCard(questionId, (card) => {
      if (card.phase === "unanswered") {
        return { ...card, draft };
      }
      if (card.phase === "error") {
        return { ...card, lastDraft: draft };
      }
      return card;
    });
  };

  const handleSubmit = (questionId: string, draft: DailyAnswerDraft) => {
    updateCard(questionId, (card) => ({
      phase: "submitting",
      question: card.question,
      draft,
    }));

    const currentCard =
      state.status === "ready"
        ? state.cards.find((card) => card.question.questionId === questionId)
        : undefined;

    if (onSubmitAnswer && currentCard) {
      void onSubmitAnswer(draft, currentCard).catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Antwort konnte nicht gespeichert werden.";
        updateCard(questionId, (card) => ({
          phase: "error",
          question: card.question,
          message,
          lastDraft: draft,
        }));
      });
      return;
    }

    window.setTimeout(() => {
      updateCard(questionId, (card) => {
        if (state.revealPolicy === "after_answer") {
          return {
            phase: "revealed",
            question: card.question,
            myAnswer: draft,
            result: mockResultFor(card, draft),
          };
        }
        return {
          phase: "submitted_waiting_reveal",
          question: card.question,
          myAnswer: draft,
        };
      });
    }, 400);
  };

  return (
    <div className="space-y-4">
      <ScreenHeader
        eyebrow="Daily"
        title={formatBerlinDateLabel(state.dateKey)}
        subtitle={
          state.runStatus === "closed"
            ? "Diese Daily ist abgeschlossen."
            : "Antworte in deinem Tempo."
        }
      />
      <section className="radius-card border border-white/60 bg-white/85 p-5 shadow-card-flat backdrop-blur-sm">
        <DailyProgress
          answered={state.progress.answered}
          total={state.progress.total}
        />
      </section>
      {state.hasIncompleteItems ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span aria-hidden className="shrink-0 text-lg leading-none">⚠️</span>
          <p className="leading-relaxed">
            Einige Fragen konnten nicht geladen werden und sind uebersprungen.
            Ein Admin kann den Run ersetzen.
          </p>
        </div>
      ) : null}
      {state.cards.map((card) => (
        <QuestionCardShell
          key={card.question.questionId}
          state={card}
          onDraftChange={(draft) =>
            handleDraftChange(card.question.questionId, draft)
          }
          onSubmit={(draft) => handleSubmit(card.question.questionId, draft)}
        />
      ))}
    </div>
  );
}

function mockResultFor(
  card: DailyQuestionCardState,
  draft: DailyAnswerDraft,
): Extract<DailyQuestionCardState, { phase: "revealed" }>["result"] {
  const q = card.question;
  switch (q.type) {
    case "single_choice": {
      const myId =
        draft.type === "single_choice" ? draft.selectedUserId : undefined;
      const counts = q.candidates.map((c, i) => ({
        candidate: c,
        votes: c.userId === myId ? 3 : i === 0 ? 1 : 0,
        percent: c.userId === myId ? 75 : i === 0 ? 25 : 0,
      }));
      return {
        questionType: "single_choice",
        anonymous: q.anonymous,
        totalVotes: 4,
        myChoiceUserId: myId,
        counts,
      };
    }
    case "open_text":
      return {
        questionType: "open_text",
        anonymous: q.anonymous,
        entries: [
          {
            text:
              draft.type === "open_text"
                ? draft.textAnswer
                : "Meine Antwort.",
          },
        ],
      };
    case "duel_1v1": {
      const mine = draft.type === "duel_1v1" ? draft.selectedSide : undefined;
      return {
        questionType: "duel_1v1",
        anonymous: q.anonymous,
        myChoice: mine,
        left: {
          member: q.left,
          votes: mine === "left" ? 3 : 1,
          percent: mine === "left" ? 75 : 25,
        },
        right: {
          member: q.right,
          votes: mine === "right" ? 3 : 1,
          percent: mine === "right" ? 75 : 25,
        },
      };
    }
    case "duel_2v2": {
      const mine = draft.type === "duel_2v2" ? draft.selectedTeam : undefined;
      return {
        questionType: "duel_2v2",
        anonymous: q.anonymous,
        myChoice: mine,
        teamA: {
          members: q.teamA,
          votes: mine === "teamA" ? 3 : 1,
          percent: mine === "teamA" ? 75 : 25,
        },
        teamB: {
          members: q.teamB,
          votes: mine === "teamB" ? 3 : 1,
          percent: mine === "teamB" ? 75 : 25,
        },
      };
    }
    case "either_or": {
      const mine =
        draft.type === "either_or" ? draft.selectedOptionIndex : undefined;
      return {
        questionType: "either_or",
        anonymous: q.anonymous,
        myChoiceIndex: mine,
        options: [
          {
            label: q.options[0],
            votes: mine === 0 ? 3 : 1,
            percent: mine === 0 ? 75 : 25,
          },
          {
            label: q.options[1],
            votes: mine === 1 ? 3 : 1,
            percent: mine === 1 ? 75 : 25,
          },
        ],
      };
    }
  }
}

