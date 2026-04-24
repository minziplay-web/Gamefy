"use client";

import { AvatarCircle } from "@/components/ui/avatar";
import { TextArea } from "@/components/ui/text-field";
import type {
  DailyAnswerDraft,
  DailyQuestion,
  Duel1v1Question,
  Duel2v2Question,
  EitherOrQuestion,
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
            className={`flex min-h-28 flex-col items-center justify-center gap-2.5 rounded-2xl border-2 p-3 text-sm font-medium text-center transition ${
              active
                ? "border-coral bg-coral/5 text-sand-900"
                : "border-sand-100 bg-white text-sand-700 hover:border-sand-200"
            } disabled:opacity-60`}
          >
            <AvatarCircle member={candidate} size="md" />
            <span className="line-clamp-2 text-xs font-semibold leading-snug text-sand-800">
              {candidate.displayName}
            </span>
          </button>
        );
      })}
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
    <div className="grid grid-cols-2 gap-3">
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
            className={`flex min-h-40 flex-col items-center justify-center gap-3 rounded-3xl border-2 p-4 transition ${
              active
                ? "border-coral bg-coral/5"
                : "border-sand-100 bg-white hover:border-sand-200"
            } disabled:opacity-60`}
          >
            <AvatarCircle member={member} size="lg" />
            <span className="text-base font-semibold text-sand-900">
              {member.displayName}
            </span>
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
    <div className="grid grid-cols-2 gap-3">
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
            className={`flex min-h-44 flex-col items-center justify-center gap-3 rounded-3xl border-2 p-4 transition ${
              active
                ? "border-coral bg-coral/5"
                : "border-sand-100 bg-white hover:border-sand-200"
            } disabled:opacity-60`}
          >
            <div className="flex items-center gap-2">
              {team.members.map((m) => (
                <AvatarCircle key={m.userId} member={m} size="md" />
              ))}
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sand-500">
              {team.label}
            </span>
            <span className="text-sm font-semibold text-sand-900">
              {team.members.map((m) => m.displayName).join(" & ")}
            </span>
          </button>
        );
      })}
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
    <div className="space-y-2">
      {question.options.map((label, idx) => {
        const index = idx as 0 | 1;
        const active = draft?.selectedOptionIndex === index;
        return (
          <button
            key={label}
            type="button"
            disabled={disabled}
            onClick={() =>
              onDraftChange({
                type: "either_or",
                questionId: question.questionId,
                selectedOptionIndex: index,
              })
            }
            className={`flex min-h-16 w-full items-center justify-center rounded-3xl border-2 px-4 text-center text-base font-semibold transition ${
              active
                ? "border-coral bg-coral/5 text-sand-900"
                : "border-sand-100 bg-white text-sand-700 hover:border-sand-200"
            } disabled:opacity-60`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
