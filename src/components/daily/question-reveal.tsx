import { AvatarCircle } from "@/components/ui/avatar";
import type {
  Duel1v1Result,
  Duel2v2Result,
  EitherOrResult,
  MemberLite,
  OpenTextResult,
  QuestionResult,
  SingleChoiceResult,
} from "@/lib/types/frontend";

export function QuestionReveal({ result }: { result: QuestionResult }) {
  switch (result.questionType) {
    case "single_choice":
      return <SingleChoiceReveal result={result} />;
    case "open_text":
      return <OpenTextReveal result={result} />;
    case "duel_1v1":
      return <Duel1v1Reveal result={result} />;
    case "duel_2v2":
      return <Duel2v2Reveal result={result} />;
    case "either_or":
      return <EitherOrReveal result={result} />;
  }
}

function SingleChoiceReveal({ result }: { result: SingleChoiceResult }) {
  if (result.totalVotes === 0) {
    return (
      <p className="rounded-2xl bg-sand-50 px-3 py-3 text-sm text-sand-600">
        Noch keine Stimmen abgegeben.
      </p>
    );
  }

  const sorted = [...result.counts].sort((a, b) => b.votes - a.votes);
  const withVotes = sorted.filter((row) => row.votes > 0);
  const hiddenCount = sorted.length - withVotes.length;

  return (
    <div className="space-y-2">
      {withVotes.map((row, idx) => {
        const isMine = row.candidate.userId === result.myChoiceUserId;
        const isTop = idx === 0;
        return (
          <RevealBar
            key={row.candidate.userId}
            member={row.candidate}
            label={row.candidate.displayName}
            votes={row.votes}
            percent={row.percent}
            highlight={isMine}
            top={isTop}
            voterAvatars={
              result.anonymous
                ? []
                : (result.voterRows ?? [])
                    .filter((voteRow) => voteRow.target.userId === row.candidate.userId)
                    .map((voteRow) => voteRow.voter)
            }
          />
        );
      })}
      {hiddenCount > 0 ? (
        <p className="px-1 text-[11px] text-sand-500">
          {hiddenCount} weitere ohne Stimme
        </p>
      ) : null}
    </div>
  );
}

function OpenTextReveal({ result }: { result: OpenTextResult }) {
  if (result.entries.length === 0) {
    return (
      <p className="rounded-2xl bg-sand-50 px-3 py-3 text-sm text-sand-600">
        {result.anonymous
          ? "Anonyme Antworten werden nach Tagesende sichtbar."
          : "Noch keine Antworten."}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {result.entries.map((entry, idx) => (
        <li
          key={idx}
          className="space-y-2 rounded-2xl border border-sand-100 bg-white px-4 py-3"
        >
          <p className="text-sm leading-relaxed text-sand-900">{entry.text}</p>
          {entry.author ? (
            <div className="flex items-center gap-2 text-[11px] font-medium text-sand-500">
              <AvatarCircle member={entry.author} size="sm" />
              {entry.author.displayName}
            </div>
          ) : (
            <p className="text-[11px] font-medium text-sand-400">Anonym</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function Duel1v1Reveal({ result }: { result: Duel1v1Result }) {
  const leftWins = result.left.votes >= result.right.votes && result.left.votes + result.right.votes > 0;
  const rightWins = !leftWins && result.right.votes > 0;
  return (
    <div className="grid grid-cols-2 gap-3">
      <DuelSideResult
        side={result.left}
        isMine={result.myChoice === "left"}
        winner={leftWins}
      />
      <DuelSideResult
        side={result.right}
        isMine={result.myChoice === "right"}
        winner={rightWins}
      />
    </div>
  );
}

function DuelSideResult({
  side,
  isMine,
  winner,
}: {
  side: { member: MemberLite; votes: number; percent: number };
  isMine: boolean;
  winner: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition ${
        isMine
          ? "border-coral bg-coral-soft/40"
          : winner
            ? "border-sand-300 bg-white"
            : "border-sand-100 bg-white"
      }`}
    >
      <AvatarCircle member={side.member} size="lg" />
      <p className="text-sm font-semibold text-sand-900">
        {side.member.displayName}
      </p>
      <p className="text-2xl font-bold tabular-nums text-sand-900">
        {side.percent}%
      </p>
      <p className="text-[11px] text-sand-500">
        {side.votes} {side.votes === 1 ? "Stimme" : "Stimmen"}
      </p>
      {isMine ? (
        <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          Dein Vote
        </span>
      ) : null}
    </div>
  );
}

function Duel2v2Reveal({ result }: { result: Duel2v2Result }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <DuelTeamResult
        team={result.teamA}
        label="Team A"
        isMine={result.myChoice === "teamA"}
      />
      <DuelTeamResult
        team={result.teamB}
        label="Team B"
        isMine={result.myChoice === "teamB"}
      />
    </div>
  );
}

function DuelTeamResult({
  team,
  label,
  isMine,
}: {
  team: { members: [MemberLite, MemberLite]; votes: number; percent: number };
  label: string;
  isMine: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 ${
        isMine ? "border-coral bg-coral-soft/40" : "border-sand-100 bg-white"
      }`}
    >
      <div className="flex items-center gap-1">
        {team.members.map((m) => (
          <AvatarCircle key={m.userId} member={m} size="md" />
        ))}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-sand-500">
        {label}
      </p>
      <p className="text-sm font-medium text-sand-900">
        {team.members.map((m) => m.displayName).join(" & ")}
      </p>
      <p className="text-2xl font-bold tabular-nums text-sand-900">
        {team.percent}%
      </p>
      <p className="text-[11px] text-sand-500">
        {team.votes} {team.votes === 1 ? "Stimme" : "Stimmen"}
      </p>
      {isMine ? (
        <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          Dein Vote
        </span>
      ) : null}
    </div>
  );
}

function EitherOrReveal({ result }: { result: EitherOrResult }) {
  return (
    <div className="space-y-2">
      {result.options.map((opt, idx) => {
        const isMine = idx === result.myChoiceIndex;
        return (
          <div
            key={idx}
            className={`rounded-2xl border-2 p-3 transition ${
              isMine ? "border-coral bg-coral-soft/40" : "border-sand-100 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-sand-900">
                {opt.label}
              </span>
              <span className="text-sm font-bold tabular-nums text-sand-900">
                {opt.percent}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand-100">
              <div
                className="h-full rounded-full bg-coral transition-[width] duration-500"
                style={{ width: `${opt.percent}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-sand-500">
              {opt.votes} {opt.votes === 1 ? "Stimme" : "Stimmen"}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function RevealBar({
  member,
  label,
  votes,
  percent,
  highlight,
  top,
  voterAvatars = [],
}: {
  member?: MemberLite;
  label: string;
  votes: number;
  percent: number;
  highlight: boolean;
  top?: boolean;
  voterAvatars?: MemberLite[];
}) {
  return (
    <div
      className={`rounded-2xl border p-3 transition ${
        highlight
          ? "border-coral bg-coral-soft/40"
          : top
            ? "border-sand-200 bg-white"
            : "border-sand-100 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        {member ? <AvatarCircle member={member} size="sm" /> : null}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-sand-900">{label}</span>
            <span className="text-sm font-bold tabular-nums text-sand-900">
              {percent}%
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand-100">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${
                highlight ? "bg-coral" : "bg-sand-400"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-[11px] text-sand-500">
              {votes} {votes === 1 ? "Stimme" : "Stimmen"}
            </p>
            {voterAvatars.length > 0 ? (
              <div className="flex items-center">
                {voterAvatars.map((voter, index) => (
                  <div key={`${voter.userId}_${index}`} className={index === 0 ? "" : "-ml-1.5"}>
                    <AvatarCircle
                      member={voter}
                      size="xs"
                      className="ring-2 ring-white"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
