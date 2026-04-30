"use client";

import { AvatarCircle } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/ui/category-badge";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ThreeBodyLoader } from "@/components/ui/loader";
import { QuestionInput } from "@/components/daily/question-input";
import { QuestionReveal } from "@/components/daily/question-reveal";
import type {
  DailyAnswerDraft,
  DailyQuestionCardState,
  MemberLite,
} from "@/lib/types/frontend";

interface Props {
  state: DailyQuestionCardState;
  onDraftChange: (next: DailyAnswerDraft) => void;
  onSubmit: (draft: DailyAnswerDraft) => void;
  onVoteMemeCaption?: (authorUserId: string, value: boolean) => Promise<void>;
  onRetry?: () => void;
  onSkip?: () => void;
}

function draftIsComplete(draft: DailyAnswerDraft | undefined): draft is DailyAnswerDraft {
  if (!draft) return false;
  switch (draft.type) {
    case "single_choice":
      return Boolean(draft.selectedUserId);
    case "multi_choice":
      return draft.selectedUserIds.length > 0;
    case "open_text":
      return draft.textAnswer.trim().length > 0;
    case "duel_1v1":
      return Boolean(draft.selectedSide);
    case "duel_2v2":
      return Boolean(draft.selectedTeam);
    case "either_or":
      return draft.selectedOptionIndex !== undefined;
    case "meme_caption":
      return draft.textAnswer.trim().length > 0;
  }
}

export function QuestionCardShell({
  state,
  onDraftChange,
  onSubmit,
  onVoteMemeCaption,
  onRetry,
  onSkip,
}: Props) {
  const { question } = state;

  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-card-flat ring-1 ring-slate-200/80">
      <div className="space-y-4 p-5 min-[380px]:p-6">
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-sand-500">
            <span>{question.indexInRun + 1} / {question.totalInRun}</span>
            <span aria-hidden className="size-1 rounded-full bg-sand-300" />
            <CategoryBadge category={question.category} size="sm" />
            {question.runLabel ? (
              <Badge tone="warning" size="sm">{question.runLabel}</Badge>
            ) : null}
          </div>
          <h3 className="text-base font-semibold leading-snug text-sand-900 min-[380px]:text-lg">
            {question.text}
          </h3>
        </header>
        <CardBody
          state={state}
          onDraftChange={onDraftChange}
          onSubmit={onSubmit}
          onVoteMemeCaption={onVoteMemeCaption}
          onRetry={onRetry}
          onSkip={onSkip}
        />
      </div>
    </section>
  );
}

function CardBody({
  state,
  onDraftChange,
  onSubmit,
  onVoteMemeCaption,
  onRetry,
  onSkip,
}: Props) {
  if (state.phase === "submitted_waiting_reveal") {
    return (
      <AnswerReview question={state.question} draft={state.myAnswer} />
    );
  }

  if (state.phase === "revealed") {
    return (
      <QuestionReveal
        result={state.result}
        tone="daily"
        embedded
        onVoteMemeCaption={onVoteMemeCaption}
      />
    );
  }

  const currentDraft =
    state.phase === "submitting"
      ? state.draft
      : state.phase === "error"
        ? state.lastDraft
        : state.draft;
  const loading = state.phase === "submitting";
  const disabled = loading || !draftIsComplete(currentDraft);
  const submitLabel =
    state.question.type === "meme_caption" ? "Meme erstellen" : "Antwort abschicken";

  return (
    <div className="space-y-3">
      <QuestionInput
        question={state.question}
        draft={currentDraft}
        disabled={loading}
        onDraftChange={onDraftChange}
      />
      {state.phase === "error" ? (
        <ErrorBanner
          message={state.message}
          action={
            onRetry ? (
              <Button variant="ghost" size="sm" onClick={onRetry}>
                Nochmal
              </Button>
            ) : undefined
          }
        />
      ) : null}
      <div className="space-y-2 pt-1">
        <Button
          className="w-full"
          variant="daily"
          disabled={disabled}
          onClick={() => {
            if (currentDraft && draftIsComplete(currentDraft)) {
              onSubmit(currentDraft);
            }
          }}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <ThreeBodyLoader size={16} color="currentColor" label="Antwort wird gesendet" />
              Wird gesendet
            </span>
          ) : (
            submitLabel
          )}
        </Button>
        {onSkip ? (
          <button
            type="button"
            disabled={loading}
            onClick={onSkip}
            className="w-full text-center text-[12px] font-semibold text-sand-400 transition hover:text-sand-600 disabled:opacity-40"
          >
            Überspringen
          </button>
        ) : null}
      </div>
    </div>
  );
}

function AnswerReview({
  question,
  draft,
}: {
  question: DailyQuestionCardState["question"];
  draft: DailyAnswerDraft;
}) {
  switch (question.type) {
    case "single_choice": {
      const selected = question.candidates.find(
        (candidate) =>
          draft.type === "single_choice" && candidate.userId === draft.selectedUserId,
      );
      return (
        <MemberAnswerReviewCard
          label="Deine Antwort"
          members={selected ? [selected] : []}
          fallback="Auswahl gespeichert"
        />
      );
    }
    case "multi_choice": {
      const selectedMembers =
        draft.type === "multi_choice"
          ? question.candidates
              .filter((candidate) => draft.selectedUserIds.includes(candidate.userId))
          : [];
      return (
        <MemberAnswerReviewCard
          label="Deine Auswahl"
          members={selectedMembers}
          fallback="Auswahl gespeichert"
        />
      );
    }
    case "open_text":
      return (
        <AnswerReviewCard
          label="Deine Antwort"
          value={draft.type === "open_text" ? draft.textAnswer : "Antwort gespeichert"}
          multiline
        />
      );
    case "duel_1v1":
      {
        const selectedMember =
          draft.type === "duel_1v1"
            ? draft.selectedSide === "left"
              ? question.left
              : question.right
            : null;
        return (
          <MemberAnswerReviewCard
            label="Dein Vote"
            members={selectedMember ? [selectedMember] : []}
            fallback="Vote gespeichert"
          />
        );
      }
    case "duel_2v2":
      return (
        <MemberAnswerReviewCard
          label="Dein Vote"
          members={
            draft.type === "duel_2v2"
              ? draft.selectedTeam === "teamA"
                ? [...question.teamA]
                : [...question.teamB]
              : []
          }
          fallback="Vote gespeichert"
        />
      );
    case "either_or":
      return (
        <AnswerReviewCard
          label="Deine Antwort"
          value={
            draft.type === "either_or" && draft.selectedOptionIndex !== undefined
              ? question.options[draft.selectedOptionIndex]
              : "Antwort gespeichert"
          }
        />
      );
    case "meme_caption":
      return (
        <AnswerReviewCard
          label="Deine Bildunterschrift"
          value={
            draft.type === "meme_caption" ? draft.textAnswer : "Meme gespeichert"
          }
          multiline
        />
      );
  }
}

function AnswerReviewCard({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-sand-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sand-500">
        {label}
      </p>
      <p
        className={`mt-2 text-sand-900 ${
          multiline ? "text-[15px] leading-6" : "text-base font-semibold"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MemberAnswerReviewCard({
  label,
  members,
  fallback,
}: {
  label: string;
  members: MemberLite[];
  fallback: string;
}) {
  return (
    <div className="rounded-2xl bg-sand-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sand-500">
        {label}
      </p>
      {members.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {members.map((member) => (
            <div
              key={member.userId}
              className="inline-flex items-center gap-2 rounded-full bg-daily-soft/70 px-3 py-2 text-sm font-semibold text-sand-900 shadow-card-flat"
            >
              <AvatarCircle member={member} size="sm" />
              <span>{member.displayName}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-base font-semibold text-sand-900">{fallback}</p>
      )}
    </div>
  );
}
