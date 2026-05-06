"use client";

import { AvatarCircle } from "@/components/ui/avatar";
import { MemeImage } from "@/components/daily/meme-image";
import { TextArea } from "@/components/ui/text-field";
import { STORY_COLORS } from "@/components/story";
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

// Tab-Akzent: Antworten/Fragen-Tab ist Brand Blue. Selected-Option nutzt diesen Akzent.
const ACCENT = STORY_COLORS.antworten; // #4A5699
const optionBaseClass =
  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-60";

function optionClasses(active: boolean) {
  return active
    ? `${optionBaseClass} text-[#FAFAFA]`
    : `${optionBaseClass} text-[#FAFAFA] hover:bg-[#1F1F1F]`;
}

function optionStyle(active: boolean): React.CSSProperties {
  return {
    backgroundColor: active ? `${ACCENT}33` : "#161616",
    borderColor: active ? ACCENT : "#2C2C2E",
    fontWeight: active ? 600 : 500,
  };
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
            className={optionClasses(active)}
            style={optionStyle(active)}
          >
            <AvatarCircle member={candidate} size="sm" />
            <span className="min-w-0 flex-1 truncate text-[14px] leading-snug">
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
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    onDraftChange({
      type: "multi_choice",
      questionId: question.questionId,
      selectedUserIds: Array.from(next),
    });
  };

  return (
    <div className="space-y-2">
      <div
        className="flex items-center justify-between rounded-xl px-3 py-1.5 text-[11px]"
        style={{
          backgroundColor: "#0E0E0E",
          color: "#A8A8A8",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.04em",
        }}
      >
        <span className="uppercase tracking-[0.18em]">MEHRFACHAUSWAHL</span>
        <span style={{ color: "#FAFAFA", fontWeight: 600 }}>
          {selected.size} GEWÄHLT
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
              className={optionClasses(active)}
              style={optionStyle(active)}
            >
              <AvatarCircle member={candidate} size="sm" />
              <span className="min-w-0 flex-1 truncate text-[14px] leading-snug">
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
            className={optionClasses(active)}
            style={optionStyle(active)}
          >
            <AvatarCircle member={member} size="sm" />
            <span className="min-w-0 flex-1 truncate text-[14px] leading-snug">
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
            className={optionClasses(active)}
            style={optionStyle(active)}
          >
            <div className="flex shrink-0 items-center gap-1.5">
              {team.members.map((m) => (
                <AvatarCircle key={m.userId} member={m} size="xs" />
              ))}
            </div>
            <span className="min-w-0 flex-1">
              <span
                className="block text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "#6E6E73", fontFamily: "var(--font-mono)" }}
              >
                {team.label}
              </span>
              <span className="mt-0.5 block truncate text-[14px] leading-snug">
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
            className={optionClasses(active)}
            style={optionStyle(active)}
          >
            <span
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style={{
                backgroundColor: active ? ACCENT : "#0E0E0E",
                color: active ? "#FFFFFF" : "#A8A8A8",
              }}
            >
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="min-w-0 flex-1 text-[14px] leading-snug">
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
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition"
      style={{
        backgroundColor: active ? ACCENT : "transparent",
        borderColor: active ? ACCENT : "#2C2C2E",
        color: active ? "#FFFFFF" : "transparent",
      }}
    >
      ✓
    </span>
  );
}
