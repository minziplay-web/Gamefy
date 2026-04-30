"use client";

import { AvatarCircle } from "@/components/ui/avatar";
import { MemeImage } from "@/components/daily/meme-image";
import { TextArea } from "@/components/ui/text-field";
import type {
  DailyAnswerDraft,
  DailyQuestion,
  Duel1v1Question,
  Duel2v2Question,
  EitherOrQuestion,
  MemeCaptionQuestion,
  MultiChoiceQuestion,
  OpenTextQuestion,
  SingleChoiceQuestion,
} from "@/lib/types/frontend";

interface Props {
  question: DailyQuestion;
  draft?: DailyAnswerDraft;
  disabled?: boolean;
  onDraftChange: (next: DailyAnswerDraft) => void;
}

export function QuestionInput({ question, draft, disabled, onDraftChange }: Props) {
  switch (question.type) {
    case "single_choice":
      return (
        <SingleChoiceInput
          question={question}
          draft={draft as Extract<DailyAnswerDraft, { type: "single_choice" }> | undefined}
          disabled={disabled}
          onDraftChange={onDraftChange}
        />
      );
    case "multi_choice":
      return (
        <MultiChoiceInput
          question={question}
          draft={draft as Extract<DailyAnswerDraft, { type: "multi_choice" }> | undefined}
          disabled={disabled}
          onDraftChange={onDraftChange}
        />
      );
    case "open_text":
      return (
        <OpenTextInput
          question={question}
          draft={draft as Extract<DailyAnswerDraft, { type: "open_text" }> | undefined}
          disabled={disabled}
          onDraftChange={onDraftChange}
        />
      );
    case "duel_1v1":
      return (
        <Duel1v1Input
          question={question}
          draft={draft as Extract<DailyAnswerDraft, { type: "duel_1v1" }> | undefined}
          disabled={disabled}
          onDraftChange={onDraftChange}
        />
      );
    case "duel_2v2":
      return (
        <Duel2v2Input
          question={question}
          draft={draft as Extract<DailyAnswerDraft, { type: "duel_2v2" }> | undefined}
          disabled={disabled}
          onDraftChange={onDraftChange}
        />
      );
    case "either_or":
      return (
        <EitherOrInput
          question={question}
          draft={draft as Extract<DailyAnswerDraft, { type: "either_or" }> | undefined}
          disabled={disabled}
          onDraftChange={onDraftChange}
        />
      );
    case "meme_caption":
      return (
        <MemeCaptionInput
          question={question}
          draft={draft as Extract<DailyAnswerDraft, { type: "meme_caption" }> | undefined}
          disabled={disabled}
          onDraftChange={onDraftChange}
        />
      );
  }
}

function SingleChoiceInput({
  question,
  draft,
  disabled,
  onDraftChange,
}: {
  question: SingleChoiceQuestion;
  draft?: Extract<DailyAnswerDraft, { type: "single_choice" }>;
  disabled?: boolean;
  onDraftChange: (next: DailyAnswerDraft) => void;
}) {
  const selected = draft?.selectedUserId;

  return (
    <div className="grid gap-1.5">
      {question.candidates.map((candidate) => {
        const active = candidate.userId === selected;
        return (
          <button
            key={candidate.userId}
            type="button"
            disabled={disabled}
            onClick={() =>
              onDraftChange({
                type: "single_choice",
                questionId: question.questionId,
                selectedUserId: candidate.userId,
              })
            }
            className={`flex min-h-12 items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
              active
                ? "border-daily-primary bg-daily-soft/80 text-sand-950 shadow-card-flat"
                : "border-slate-200 bg-white text-sand-800 hover:border-daily-primary/45"
            } disabled:opacity-60`}
          >
            <AvatarCircle member={candidate} size="md" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold leading-snug">
              {candidate.displayName}
            </span>
            <ChoiceMark active={active} />
          </button>
        );
      })}
    </div>
  );
}

function MultiChoiceInput({
  question,
  draft,
  disabled,
  onDraftChange,
}: {
  question: MultiChoiceQuestion;
  draft?: Extract<DailyAnswerDraft, { type: "multi_choice" }>;
  disabled?: boolean;
  onDraftChange: (next: DailyAnswerDraft) => void;
}) {
  const selected = new Set(draft?.selectedUserIds ?? []);

  const toggle = (userId: string) => {
    const next = new Set(selected);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    onDraftChange({
      type: "multi_choice",
      questionId: question.questionId,
      selectedUserIds: Array.from(next),
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-2xl bg-sand-50 px-3 py-2 text-xs text-sand-500 ring-1 ring-sand-200">
        <span className="font-medium">Mehrfachauswahl möglich</span>
        <span className="font-semibold tabular-nums text-sand-800">
          {selected.size} gewählt
        </span>
      </div>
      <div className="grid gap-1.5">
        {question.candidates.map((candidate) => {
          const active = selected.has(candidate.userId);
          return (
            <button
              key={candidate.userId}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => toggle(candidate.userId)}
              className={`flex min-h-12 items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                active
                  ? "border-daily-primary bg-daily-soft/80 text-sand-950 shadow-card-flat"
                  : "border-slate-200 bg-white text-sand-800 hover:border-daily-primary/45"
              } disabled:opacity-60`}
            >
              <AvatarCircle member={candidate} size="md" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold leading-snug">
                {candidate.displayName}
              </span>
              <ChoiceMark active={active} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OpenTextInput({
  question,
  draft,
  disabled,
  onDraftChange,
}: {
  question: OpenTextQuestion;
  draft?: Extract<DailyAnswerDraft, { type: "open_text" }>;
  disabled?: boolean;
  onDraftChange: (next: DailyAnswerDraft) => void;
}) {
  const value = draft?.textAnswer ?? "";
  const remaining = Math.max(0, question.maxLength - value.length);

  return (
    <TextArea
      value={value}
      disabled={disabled}
      placeholder="Schreib deine Antwort..."
      maxLength={question.maxLength}
      rows={2}
      className="min-h-[60px]"
      helper={`${remaining} Zeichen übrig`}
      onChange={(event) =>
        onDraftChange({
          type: "open_text",
          questionId: question.questionId,
          textAnswer: event.target.value,
        })
      }
    />
  );
}

function Duel1v1Input({
  question,
  draft,
  disabled,
  onDraftChange,
}: {
  question: Duel1v1Question;
  draft?: Extract<DailyAnswerDraft, { type: "duel_1v1" }>;
  disabled?: boolean;
  onDraftChange: (next: DailyAnswerDraft) => void;
}) {
  const sides: Array<{ side: "left" | "right"; member: typeof question.left }> = [
    { side: "left", member: question.left },
    { side: "right", member: question.right },
  ];

  return (
    <div className="grid gap-1.5">
      {sides.map(({ side, member }) => {
        const active = draft?.selectedSide === side;
        return (
          <button
            key={side}
            type="button"
            disabled={disabled}
            onClick={() =>
              onDraftChange({
                type: "duel_1v1",
                questionId: question.questionId,
                selectedSide: side,
              })
            }
            className={`flex min-h-20 items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${
              active
                ? "border-daily-primary bg-daily-soft/80 shadow-card-flat"
                : "border-slate-200 bg-white hover:border-daily-primary/45"
            } disabled:opacity-60`}
          >
            <AvatarCircle member={member} size="md" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-sand-900">
              {member.displayName}
            </span>
            <ChoiceMark active={active} />
          </button>
        );
      })}
    </div>
  );
}

function Duel2v2Input({
  question,
  draft,
  disabled,
  onDraftChange,
}: {
  question: Duel2v2Question;
  draft?: Extract<DailyAnswerDraft, { type: "duel_2v2" }>;
  disabled?: boolean;
  onDraftChange: (next: DailyAnswerDraft) => void;
}) {
  const teams: Array<{
    key: "teamA" | "teamB";
    label: string;
    members: typeof question.teamA;
  }> = [
    { key: "teamA", label: "Team A", members: question.teamA },
    { key: "teamB", label: "Team B", members: question.teamB },
  ];

  return (
    <div className="grid gap-1.5">
      {teams.map((team) => {
        const active = draft?.selectedTeam === team.key;
        return (
          <button
            key={team.key}
            type="button"
            disabled={disabled}
            onClick={() =>
              onDraftChange({
                type: "duel_2v2",
                questionId: question.questionId,
                selectedTeam: team.key,
              })
            }
            className={`flex min-h-24 items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${
              active
                ? "border-daily-primary bg-daily-soft/80 shadow-card-flat"
                : "border-slate-200 bg-white hover:border-daily-primary/45"
            } disabled:opacity-60`}
          >
            <div className="flex shrink-0 items-center gap-1.5">
              {team.members.map((m) => (
                <AvatarCircle key={m.userId} member={m} size="sm" />
              ))}
            </div>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wider text-sand-500">
                {team.label}
              </span>
              <span className="mt-0.5 block truncate text-sm font-semibold text-sand-900">
                {team.members.map((m) => m.displayName).join(" & ")}
              </span>
            </span>
            <ChoiceMark active={active} />
          </button>
        );
      })}
    </div>
  );
}

function MemeCaptionInput({
  question,
  draft,
  disabled,
  onDraftChange,
}: {
  question: MemeCaptionQuestion;
  draft?: Extract<DailyAnswerDraft, { type: "meme_caption" }>;
  disabled?: boolean;
  onDraftChange: (next: DailyAnswerDraft) => void;
}) {
  const value = draft?.textAnswer ?? "";
  const remaining = Math.max(0, question.maxLength - value.length);

  return (
    <div className="space-y-3">
      <MemeImage imagePath={question.imagePath} caption={value} />
      <TextArea
        value={value}
        disabled={disabled}
        placeholder="Schreib deine Bildunterschrift..."
        maxLength={question.maxLength}
        rows={2}
        className="min-h-[60px]"
        helper={`${remaining} Zeichen übrig`}
        onChange={(event) =>
          onDraftChange({
            type: "meme_caption",
            questionId: question.questionId,
            textAnswer: event.target.value,
          })
        }
      />
    </div>
  );
}

function EitherOrInput({
  question,
  draft,
  disabled,
  onDraftChange,
}: {
  question: EitherOrQuestion;
  draft?: Extract<DailyAnswerDraft, { type: "either_or" }>;
  disabled?: boolean;
  onDraftChange: (next: DailyAnswerDraft) => void;
}) {
  return (
    <div className="space-y-1.5">
      {question.options.map((label, idx) => {
        const active = draft?.selectedOptionIndex === idx;
        return (
          <button
            key={`${idx}:${label}`}
            type="button"
            disabled={disabled}
            onClick={() =>
              onDraftChange({
                type: "either_or",
                questionId: question.questionId,
                selectedOptionIndex: idx,
              })
            }
            className={`flex min-h-11 w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
              active
                ? "border-daily-primary bg-daily-soft/80 text-sand-950 shadow-card-flat"
                : "border-slate-200 bg-white text-sand-800 hover:border-daily-primary/45"
            } disabled:opacity-60`}
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-sand-100 text-xs font-bold text-sand-600">
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">
              {label}
            </span>
            <ChoiceMark active={active} />
          </button>
        );
      })}
    </div>
  );
}

function ChoiceMark({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition ${
        active
          ? "border-daily-text bg-daily-text text-white"
          : "border-slate-200 bg-white text-transparent"
      }`}
    >
      ✓
    </span>
  );
}
