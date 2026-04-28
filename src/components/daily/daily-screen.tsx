"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { DailyCompletionCard } from "@/components/daily/daily-completion-card";
import { DailyStepIndicator } from "@/components/daily/daily-step-indicator";
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
  QuestionResult,
} from "@/lib/types/frontend";

export function DailyScreen({
  state: initial,
  onSubmitAnswer,
  onVoteMemeCaption,
  completionContent,
}: {
  state: DailyViewState;
  onSubmitAnswer?: (
    draft: DailyAnswerDraft,
    card: DailyQuestionCardState,
  ) => Promise<void>;
  onVoteMemeCaption?: (
    card: DailyQuestionCardState,
    authorUserId: string,
    value: boolean,
  ) => Promise<void>;
  completionContent?: ReactNode;
}) {
  const [state, setState] = useState(initial);
  useEffect(() => {
    queueMicrotask(() => setState((prev) => mergeDailyState(prev, initial)));
  }, [initial]);

  const cards = state.status === "ready" ? state.cards : null;

  const initialIndex = useMemo(() => {
    if (!cards || cards.length === 0) return 0;
    const firstOpen = cards.findIndex(
      (card) => card.phase === "unanswered" || card.phase === "error",
    );
    return firstOpen === -1 ? Math.max(0, cards.length - 1) : firstOpen;
  }, [cards]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showCompletion, setShowCompletion] = useState(false);
  const scrollTargetRef = useRef<HTMLDivElement | null>(null);
  const didInitRef = useRef(false);

  // Seed currentIndex once the first card array arrives (or resets once the run changes).
  useEffect(() => {
    if (!cards || cards.length === 0) {
      didInitRef.current = false;
      return;
    }
    if (didInitRef.current) return;
    didInitRef.current = true;
    setCurrentIndex(initialIndex);
  }, [cards, initialIndex]);

  // Smoothly scroll the step header into view on index change.
  useEffect(() => {
    if (!scrollTargetRef.current) return;
    scrollTargetRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [currentIndex, showCompletion]);

  useEffect(() => {
    if (state.status !== "ready") {
      return;
    }

    const allAnswered = state.cards.every(
      (card) =>
        card.phase === "submitted_waiting_reveal" || card.phase === "revealed",
    );

    if (allAnswered) {
      setShowCompletion(true);
    }
  }, [state]);

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Daily" title="Heutige Fragen" theme="daily" />
        <SkeletonCard />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <ScreenHeader eyebrow="Daily" title="Heutige Fragen" theme="daily" />
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
          theme="daily"
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
          theme="daily"
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
        (c) => c.phase === "submitted_waiting_reveal" || c.phase === "revealed",
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
      if (card.phase === "unanswered") return { ...card, draft };
      if (card.phase === "error") return { ...card, lastDraft: draft };
      return card;
    });
  };

  const handleSubmit = (questionId: string, draft: DailyAnswerDraft) => {
    const previousIndex = currentIndex;
    const nextUnansweredIndex =
      state.status === "ready"
        ? state.cards.findIndex(
            (card) =>
              card.question.questionId !== questionId &&
              (card.phase === "unanswered" || card.phase === "error"),
          )
        : -1;
    const willFinish =
      state.status === "ready"
        ? state.cards.every(
            (card) =>
              card.question.questionId === questionId ||
              card.phase === "submitted_waiting_reveal" ||
              card.phase === "revealed",
          )
        : false;

    updateCard(questionId, (card) => ({
      phase: "submitting",
      question: card.question,
      draft,
    }));

    if (!willFinish && nextUnansweredIndex >= 0) {
      setCurrentIndex(nextUnansweredIndex);
    }

    const currentCard =
      state.status === "ready"
        ? state.cards.find((c) => c.question.questionId === questionId)
        : undefined;

    if (onSubmitAnswer && currentCard) {
      void onSubmitAnswer(draft, currentCard)
        .then(() => {
          if (willFinish) {
            setShowCompletion(true);
          }

          updateCard(questionId, (card) => ({
            phase: "submitted_waiting_reveal",
            question: card.question,
            myAnswer: draft,
          }));
        })
        .catch((error) => {
          const message =
            error instanceof Error
              ? error.message
              : "Antwort konnte nicht gespeichert werden.";
          setCurrentIndex(previousIndex);
          updateCard(questionId, (card) => ({
            phase: "error",
            question: card.question,
            message,
            lastDraft: draft,
          }));
        });
      return;
    }

    // Preview / mock: fake the reveal transition so the flow is fully navigable.
    window.setTimeout(() => {
      if (willFinish) {
        setShowCompletion(true);
      }

      updateCard(questionId, (card) => {
        return {
          phase: "submitted_waiting_reveal",
          question: card.question,
          myAnswer: draft,
        };
      });
    }, 400);
  };

  const totalCards = state.cards.length;
  const currentCard = state.cards[currentIndex];

  const goTo = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= totalCards) return;
    setShowCompletion(false);
    setCurrentIndex(nextIndex);
  };

  return (
    <div className="flex flex-col gap-4">
      <div ref={scrollTargetRef} aria-hidden className="-mt-1" />
      <ScreenHeader
        eyebrow="Daily"
        title={formatBerlinDateLabel(state.dateKey)}
        theme="daily"
        subtitle={
          state.runStatus === "closed"
            ? "Diese Daily ist abgeschlossen."
            : showCompletion
              ? "Fertig. Deine Antworten wurden erfolgreich gespeichert."
              : "Antwort abgeben, dann direkt weiter."
        }
      />

      {!showCompletion ? (
        <DailyStepIndicator
          cards={state.cards}
          currentIndex={currentIndex}
          onJump={(idx) => goTo(idx)}
        />
      ) : null}

      {state.hasIncompleteItems ? (
        <div className="flex items-start gap-3 rounded-2xl border border-daily-primary/35 bg-white px-4 py-3 text-sm text-daily-text">
          <span aria-hidden className="shrink-0 text-lg leading-none">⚠️</span>
          <p className="leading-relaxed">
            Einige Fragen konnten nicht geladen werden und sind übersprungen.
            Ein Admin kann den Run ersetzen.
          </p>
        </div>
      ) : null}

      {showCompletion || !currentCard ? (
        <div className="space-y-4">
          <DailyCompletionCard
            cards={state.cards}
            revealPolicy={state.revealPolicy}
          />
          {showCompletion ? completionContent : null}
        </div>
      ) : (
        <QuestionCardShell
          key={currentCard.question.questionId}
          state={currentCard}
          onDraftChange={(draft) =>
            handleDraftChange(currentCard.question.questionId, draft)
          }
          onSubmit={(draft) =>
            handleSubmit(currentCard.question.questionId, draft)
          }
          onVoteMemeCaption={
            onVoteMemeCaption
              ? (authorUserId, value) =>
                  onVoteMemeCaption(currentCard, authorUserId, value)
              : undefined
          }
        />
      )}
    </div>
  );
}

function mockResultFor(
  card: DailyQuestionCardState,
  draft: DailyAnswerDraft,
): QuestionResult {
  const q = card.question;
  if ((q as { type: string }).type === "multi_choice") {
    const multiChoiceQuestion = q as {
      candidates: Array<{ userId: string; displayName: string; photoURL: string | null }>;
    };
    const multiChoiceDraft =
      "selectedUserIds" in draft && Array.isArray(draft.selectedUserIds)
        ? draft.selectedUserIds
        : [];
    const myIdSet = new Set(multiChoiceDraft);
    const counts = multiChoiceQuestion.candidates.map((candidate, i) => ({
      candidate,
      votes: myIdSet.has(candidate.userId) ? 3 : i < 2 ? 1 : 0,
      percent: myIdSet.has(candidate.userId) ? 75 : i < 2 ? 25 : 0,
    }));
    return {
      questionType: "multi_choice",
      totalVoters: 4,
      myChoiceUserIds: multiChoiceDraft,
      counts,
    };
  }

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
        totalVotes: 4,
        myChoiceUserId: myId,
        counts,
      };
    }
    case "open_text":
      return {
        questionType: "open_text",
        entries: [
          {
            text:
              draft.type === "open_text" ? draft.textAnswer : "Meine Antwort.",
          },
        ],
      };
    case "duel_1v1": {
      const mine = draft.type === "duel_1v1" ? draft.selectedSide : undefined;
      return {
        questionType: "duel_1v1",
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
    case "meme_caption":
      return {
        questionType: "meme_caption",
        imagePath: q.imagePath,
        entries: [
          {
            text:
              draft.type === "meme_caption"
                ? draft.textAnswer
                : "Meine Bildunterschrift.",
          },
        ],
      };
  }

  throw new Error("Unbekannter Fragetyp im Daily-Mock.");
}
