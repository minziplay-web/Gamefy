"use client";

import { useState } from "react";

import { AvatarCircle } from "@/components/ui/avatar";
import { MemeImage } from "@/components/daily/meme-image";
import type {
  Duel1v1Result,
  Duel2v2Result,
  EitherOrResult,
  MemberLite,
  MemeCaptionResult,
  OpenTextResult,
  QuestionResult,
  SingleChoiceResult,
} from "@/lib/types/frontend";

export function QuestionReveal({
  result,
  onVoteMemeCaption,
}: {
  result: QuestionResult;
  onVoteMemeCaption?: (authorUserId: string, value: boolean) => Promise<void>;
}) {
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
    case "meme_caption":
      return <MemeCaptionReveal result={result} onVote={onVoteMemeCaption} />;
  }
}

function MemeCaptionReveal({
  result,
  onVote,
}: {
  result: MemeCaptionResult;
  onVote?: (authorUserId: string, value: boolean) => Promise<void>;
}) {
  const entries = result.entries;
  const totalSlides = entries.length + 1; // +1 for leaderboard
  const [rawIndex, setIndex] = useState(0);
  const [localVotes, setLocalVotes] = useState<
    Record<string, { iVoted: boolean; count: number }>
  >({});
  const index = Math.min(Math.max(0, rawIndex), totalSlides - 1);

  const effectiveCount = (e: MemeCaptionResult["entries"][number]) => {
    const id = e.author?.userId;
    if (id && localVotes[id]) return localVotes[id].count;
    return e.thumbsUpCount ?? 0;
  };

  if (entries.length === 0) {
    return (
      <div className="space-y-3">
        <MemeImage imagePath={result.imagePath} />
        <p className="rounded-2xl bg-sand-50 px-3 py-3 text-sm text-sand-600">
          Noch keine Bildunterschriften.
        </p>
      </div>
    );
  }

  const isLeaderboard = index === entries.length;
  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(totalSlides - 1, i + 1));

  if (isLeaderboard) {
    const ranked = entries
      .map((e, originalIdx) => ({ entry: e, originalIdx, count: effectiveCount(e) }))
      .sort((a, b) =>
        b.count !== a.count ? b.count - a.count : a.originalIdx - b.originalIdx,
      );

    const winner = ranked[0];

    return (
      <div className="flex flex-col gap-3">
        <div className="anim-winner-pop space-y-3 rounded-2xl border-2 border-coral bg-gradient-to-br from-coral-soft/40 to-white p-4 shadow-card-raised">
          <div className="flex items-center gap-2">
            <span className="anim-crown-bob text-xl" aria-hidden>
              👑
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-coral">
              Winner
            </p>
          </div>
          <MemeImage
            imagePath={result.imagePath}
            caption={winner.entry.text}
          />
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {winner.entry.author ? (
                <>
                  <AvatarCircle member={winner.entry.author} size="sm" />
                  <span className="truncate text-sm font-semibold text-sand-900">
                    {winner.entry.author.displayName}
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-sand-400">
                  Unbekannt
                </span>
              )}
            </div>
            <span className="anim-heart-glow inline-flex shrink-0 items-center gap-1.5 rounded-full bg-coral px-3 py-1 text-sm font-bold text-white">
              <span aria-hidden>❤️</span>
              <span className="tabular-nums">{winner.count}</span>
            </span>
          </div>
        </div>

        {ranked.length > 1 ? (
          <div className="space-y-2">
            <p className="px-1 text-xs font-semibold uppercase tracking-wider text-sand-500">
              Rangliste
            </p>
            <ul className="divide-y divide-sand-100 overflow-hidden rounded-2xl border border-sand-100 bg-white">
              {ranked.slice(1).map(({ entry, originalIdx, count }, i) => {
                const rankIdx = i + 1;
                const medal =
                  rankIdx === 1 ? "🥈" : rankIdx === 2 ? "🥉" : null;
                return (
                  <li
                    key={originalIdx}
                    className="anim-rank-fade-up flex items-center gap-3 px-3 py-3"
                    style={{ animationDelay: `${320 + rankIdx * 70}ms` }}
                  >
                    <div className="flex w-7 shrink-0 items-center justify-center text-base">
                      {medal ? (
                        <span aria-hidden>{medal}</span>
                      ) : (
                        <span className="text-sm font-semibold text-sand-500 tabular-nums">
                          {rankIdx + 1}
                        </span>
                      )}
                    </div>
                    {entry.author ? (
                      <AvatarCircle member={entry.author} size="sm" />
                    ) : (
                      <div className="size-8 shrink-0 rounded-full bg-sand-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-sand-500">
                        {entry.author?.displayName ?? "Unbekannt"}
                      </p>
                      <p className="line-clamp-1 text-sm font-medium text-sand-900">
                        „{entry.text}"
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums text-coral">
                      <span aria-hidden>❤️</span>
                      {count}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={index === 0}
            className="inline-flex size-9 items-center justify-center rounded-full border border-sand-200 bg-white text-sand-700 transition hover:border-sand-300 disabled:opacity-40"
            aria-label="Vorheriges Meme"
          >
            ‹
          </button>

          <div className="flex flex-1 items-center justify-center gap-1.5">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={`rounded-full transition ${
                  i === entries.length ? "size-2" : "size-1.5"
                } ${i === index ? "bg-coral" : "bg-sand-200"}`}
              />
            ))}
          </div>

          <span className="text-xs font-semibold uppercase tracking-wider text-coral">
            Rangliste
          </span>

          <button
            type="button"
            disabled
            aria-hidden
            className="inline-flex size-9 items-center justify-center rounded-full border border-sand-200 bg-white text-sand-700 opacity-40"
          >
            ›
          </button>
        </div>
      </div>
    );
  }

  const entry = entries[index];
  const authorId = entry.author?.userId;
  const local = authorId ? localVotes[authorId] : undefined;
  const baseCount = entry.thumbsUpCount ?? 0;
  const baseVoted = entry.iVoted ?? false;
  const iVoted = local?.iVoted ?? baseVoted;
  const count = local?.count ?? baseCount;

  const handleVote = () => {
    if (!authorId) return;
    const nextVoted = !iVoted;
    const nextCount = Math.max(0, count + (nextVoted ? 1 : -1));
    setLocalVotes((prev) => ({
      ...prev,
      [authorId]: { iVoted: nextVoted, count: nextCount },
    }));
    if (onVote) {
      void onVote(authorId, nextVoted).catch(() => {
        setLocalVotes((prev) => ({
          ...prev,
          [authorId]: { iVoted: !nextVoted, count },
        }));
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        key={index}
        className="anim-meme-slide-in space-y-3 rounded-2xl border border-sand-100 bg-white p-3 shadow-card-flat"
      >
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-sand-500">
          Meme · {index + 1} / {entries.length}
        </p>

        <MemeImage imagePath={result.imagePath} caption={entry.text} />

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-sand-50 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            {entry.author ? (
              <>
                <AvatarCircle member={entry.author} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-sand-900">
                    {entry.author.displayName}
                  </p>
                  <p className="truncate text-xs text-sand-500">
                    {iVoted ? "Du hast geherzt" : "Gefällt dir das Meme?"}
                  </p>
                </div>
              </>
            ) : (
              <span className="text-sm font-semibold text-sand-400">
                Unbekannt
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleVote}
            disabled={!authorId}
            aria-pressed={iVoted}
            aria-label={iVoted ? "Herz entfernen" : "Herz vergeben"}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
              iVoted
                ? "bg-coral text-white shadow-card-flat"
                : "border-2 border-sand-200 bg-white text-sand-700 hover:border-coral/60 hover:text-coral"
            } disabled:opacity-50`}
          >
            <span aria-hidden>{iVoted ? "❤️" : "🤍"}</span>
            <span className="tabular-nums">{count}</span>
          </button>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="inline-flex size-9 items-center justify-center rounded-full border border-sand-200 bg-white text-sand-700 transition hover:border-sand-300 disabled:opacity-40"
          aria-label="Vorheriges Meme"
        >
          ‹
        </button>

        <div className="flex flex-1 items-center justify-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={`rounded-full transition ${
                i === entries.length ? "size-2" : "size-1.5"
              } ${i === index ? "bg-coral" : "bg-sand-200"}`}
            />
          ))}
        </div>

        <span className="text-xs font-semibold tabular-nums text-sand-500">
          {index + 1} / {entries.length}
        </span>

        <button
          type="button"
          onClick={goNext}
          disabled={index === totalSlides - 1}
          className="inline-flex size-9 items-center justify-center rounded-full border border-sand-200 bg-white text-sand-700 transition hover:border-sand-300 disabled:opacity-40"
          aria-label={
            index === entries.length - 1 ? "Zur Rangliste" : "Nächstes Meme"
          }
        >
          ›
        </button>
      </div>
    </div>
  );
}

function SingleChoiceReveal({ result }: { result: SingleChoiceResult }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        const voters = result.anonymous
          ? []
          : (result.voterRows ?? [])
              .filter((voteRow) => voteRow.target.userId === row.candidate.userId)
              .map((voteRow) => voteRow.voter);
        const expanded = expandedId === row.candidate.userId;

        return (
          <RevealBar
            key={row.candidate.userId}
            member={row.candidate}
            label={row.candidate.displayName}
            votes={row.votes}
            percent={row.percent}
            highlight={isMine}
            top={isTop}
            voters={voters}
            expanded={expanded}
            onToggle={
              voters.length > 0
                ? () =>
                    setExpandedId((curr) =>
                      curr === row.candidate.userId ? null : row.candidate.userId,
                    )
                : undefined
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
        Noch keine Antworten.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {result.entries.map((entry, idx) => (
        <li
          key={idx}
          className="space-y-3 rounded-2xl border border-sand-100 bg-white px-4 py-3"
        >
          {entry.author ? (
            <div className="flex items-center gap-3 rounded-xl bg-sand-50 px-3 py-2">
              <AvatarCircle member={entry.author} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-sand-900">
                  {entry.author.displayName}
                </p>
                <p className="text-[11px] font-medium text-sand-500">
                  Antwort
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[11px] font-medium text-sand-400">Unbekannt</p>
          )}
          <p className="text-[15px] leading-6 text-sand-900">{entry.text}</p>
        </li>
      ))}
    </ul>
  );
}

function Duel1v1Reveal({ result }: { result: Duel1v1Result }) {
  const [expandedSide, setExpandedSide] = useState<"left" | "right" | null>(null);
  const leftWins =
    result.left.votes >= result.right.votes &&
    result.left.votes + result.right.votes > 0;
  const rightWins = !leftWins && result.right.votes > 0;

  const votersFor = (side: "left" | "right") =>
    result.anonymous
      ? []
      : (result.voterRows ?? [])
          .filter((row) => row.side === side)
          .map((row) => row.voter);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <DuelSideResult
          side={result.left}
          isMine={result.myChoice === "left"}
          winner={leftWins}
          voters={votersFor("left")}
          expanded={expandedSide === "left"}
          onToggle={() =>
            setExpandedSide((curr) => (curr === "left" ? null : "left"))
          }
        />
        <DuelSideResult
          side={result.right}
          isMine={result.myChoice === "right"}
          winner={rightWins}
          voters={votersFor("right")}
          expanded={expandedSide === "right"}
          onToggle={() =>
            setExpandedSide((curr) => (curr === "right" ? null : "right"))
          }
        />
      </div>
    </div>
  );
}

function DuelSideResult({
  side,
  isMine,
  winner,
  voters = [],
  expanded = false,
  onToggle,
}: {
  side: { member: MemberLite; votes: number; percent: number };
  isMine: boolean;
  winner: boolean;
  voters?: MemberLite[];
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const clickable = Boolean(onToggle) && voters.length > 0;
  const baseClass = `flex w-full flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition ${
    isMine
      ? "border-coral bg-coral-soft/40"
      : winner
        ? "border-sand-300 bg-white"
        : "border-sand-100 bg-white"
  } ${clickable ? "cursor-pointer hover:border-sand-300" : "cursor-default"}`;

  const inner = (
    <>
      <AvatarCircle member={side.member} size="lg" />
      <p className="text-sm font-semibold text-sand-900">
        {side.member.displayName}
      </p>
      <p className="text-2xl font-bold tabular-nums text-sand-900">
        {side.percent}%
      </p>
      {voters.length > 0 ? (
        <DuelVotersFooter
          votes={side.votes}
          voters={voters}
          expanded={expanded}
        />
      ) : (
        <p className="text-[11px] text-sand-500">
          {side.votes} {side.votes === 1 ? "Stimme" : "Stimmen"}
        </p>
      )}
      {isMine ? (
        <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          Dein Vote
        </span>
      ) : null}
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className={baseClass}
      >
        {inner}
      </button>
    );
  }

  return <div className={baseClass}>{inner}</div>;
}

function Duel2v2Reveal({ result }: { result: Duel2v2Result }) {
  const [expandedTeam, setExpandedTeam] = useState<"teamA" | "teamB" | null>(null);

  const votersFor = (team: "teamA" | "teamB") =>
    result.anonymous
      ? []
      : (result.voterRows ?? [])
          .filter((row) => row.team === team)
          .map((row) => row.voter);

  return (
    <div className="grid grid-cols-2 gap-3">
      <DuelTeamResult
        team={result.teamA}
        label="Team A"
        isMine={result.myChoice === "teamA"}
        voters={votersFor("teamA")}
        expanded={expandedTeam === "teamA"}
        onToggle={() =>
          setExpandedTeam((curr) => (curr === "teamA" ? null : "teamA"))
        }
      />
      <DuelTeamResult
        team={result.teamB}
        label="Team B"
        isMine={result.myChoice === "teamB"}
        voters={votersFor("teamB")}
        expanded={expandedTeam === "teamB"}
        onToggle={() =>
          setExpandedTeam((curr) => (curr === "teamB" ? null : "teamB"))
        }
      />
    </div>
  );
}

function DuelTeamResult({
  team,
  label,
  isMine,
  voters = [],
  expanded = false,
  onToggle,
}: {
  team: { members: [MemberLite, MemberLite]; votes: number; percent: number };
  label: string;
  isMine: boolean;
  voters?: MemberLite[];
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const clickable = Boolean(onToggle) && voters.length > 0;
  const baseClass = `flex w-full flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition ${
    isMine ? "border-coral bg-coral-soft/40" : "border-sand-100 bg-white"
  } ${clickable ? "cursor-pointer hover:border-sand-300" : "cursor-default"}`;

  const inner = (
    <>
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
      {voters.length > 0 ? (
        <DuelVotersFooter
          votes={team.votes}
          voters={voters}
          expanded={expanded}
        />
      ) : (
        <p className="text-[11px] text-sand-500">
          {team.votes} {team.votes === 1 ? "Stimme" : "Stimmen"}
        </p>
      )}
      {isMine ? (
        <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          Dein Vote
        </span>
      ) : null}
    </>
  );

  if (clickable) {
    return (
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className={baseClass}
      >
        {inner}
      </button>
    );
  }

  return <div className={baseClass}>{inner}</div>;
}

function DuelVotersFooter({
  votes,
  voters,
  expanded,
}: {
  votes: number;
  voters: MemberLite[];
  expanded: boolean;
}) {
  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-center gap-1.5">
        <p className="text-[11px] text-sand-500">
          {votes} {votes === 1 ? "Stimme" : "Stimmen"}
        </p>
        <div className="flex items-center">
          {voters.slice(0, 4).map((voter, index) => (
            <div
              key={`${voter.userId}_${index}`}
              className={index === 0 ? "" : "-ml-1.5"}
            >
              <AvatarCircle
                member={voter}
                size="xs"
                className="ring-2 ring-white"
              />
            </div>
          ))}
          {voters.length > 4 ? (
            <span className="-ml-1.5 inline-flex size-[18px] items-center justify-center rounded-full bg-sand-200 text-[9px] font-semibold text-sand-700 ring-2 ring-white">
              +{voters.length - 4}
            </span>
          ) : null}
        </div>
        <span
          aria-hidden
          className={`text-[10px] font-semibold text-sand-500 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </div>
      {expanded ? (
        <ul className="flex flex-wrap justify-center gap-1.5 pt-0.5">
          {voters.map((voter) => (
            <li
              key={voter.userId}
              className="inline-flex items-center gap-1.5 rounded-full bg-sand-50 px-2 py-1"
            >
              <AvatarCircle member={voter} size="xs" />
              <span className="text-[11px] font-medium text-sand-800">
                {voter.displayName}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function EitherOrReveal({ result }: { result: EitherOrResult }) {
  const [expandedIndex, setExpandedIndex] = useState<0 | 1 | null>(null);

  return (
    <div className="space-y-2">
      {result.options.map((opt, idx) => {
        const optionIndex = idx as 0 | 1;
        const isMine = idx === result.myChoiceIndex;
        const voters = result.anonymous
          ? []
          : (result.voterRows ?? [])
              .filter((row) => row.optionIndex === optionIndex)
              .map((row) => row.voter);
        const canToggle = voters.length > 0;
        const expanded = expandedIndex === optionIndex;

        return (
          <button
            key={idx}
            type="button"
            disabled={!canToggle}
            aria-expanded={canToggle ? expanded : undefined}
            onClick={() =>
              setExpandedIndex((curr) =>
                curr === optionIndex ? null : optionIndex,
              )
            }
            className={`block w-full rounded-2xl border-2 p-3 text-left transition ${
              isMine ? "border-coral bg-coral-soft/40" : "border-sand-100 bg-white"
            } ${canToggle ? "cursor-pointer hover:border-sand-200" : "cursor-default"}`}
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
            <VotersFooter
              votes={opt.votes}
              voters={voters}
              expanded={expanded}
            />
          </button>
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
  voters = [],
  expanded = false,
  onToggle,
}: {
  member?: MemberLite;
  label: string;
  votes: number;
  percent: number;
  highlight: boolean;
  top?: boolean;
  voters?: MemberLite[];
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const clickable = Boolean(onToggle);

  return (
    <button
      type="button"
      disabled={!clickable}
      aria-expanded={clickable ? expanded : undefined}
      onClick={onToggle}
      className={`block w-full rounded-2xl border p-3 text-left transition ${
        highlight
          ? "border-coral bg-coral-soft/40"
          : top
            ? "border-sand-200 bg-white"
            : "border-sand-100 bg-white"
      } ${clickable ? "cursor-pointer hover:border-sand-300" : "cursor-default"}`}
    >
      <div className="flex items-start gap-3">
        {member ? (
          <div className="shrink-0 pt-0.5">
            <AvatarCircle member={member} size="sm" />
          </div>
        ) : null}
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
          <VotersFooter votes={votes} voters={voters} expanded={expanded} />
        </div>
      </div>
    </button>
  );
}

function VotersFooter({
  votes,
  voters,
  expanded,
}: {
  votes: number;
  voters: MemberLite[];
  expanded: boolean;
}) {
  const hasVoters = voters.length > 0;
  const label = `${votes} ${votes === 1 ? "Stimme" : "Stimmen"}`;

  if (!hasVoters) {
    return <p className="mt-1 text-[11px] text-sand-500">{label}</p>;
  }

  return (
    <div className="mt-1 space-y-1.5">
      <div className="flex items-center gap-2">
        <p className="text-[11px] text-sand-500">{label}</p>
        <div className="flex items-center">
          {voters.slice(0, 5).map((voter, index) => (
            <div
              key={`${voter.userId}_${index}`}
              className={index === 0 ? "" : "-ml-1.5"}
            >
              <AvatarCircle
                member={voter}
                size="xs"
                className="ring-2 ring-white"
              />
            </div>
          ))}
          {voters.length > 5 ? (
            <span className="-ml-1.5 inline-flex size-[18px] items-center justify-center rounded-full bg-sand-200 text-[9px] font-semibold text-sand-700 ring-2 ring-white">
              +{voters.length - 5}
            </span>
          ) : null}
        </div>
        <span
          aria-hidden
          className={`ml-auto text-[10px] font-semibold text-sand-500 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </div>
      {expanded ? (
        <ul className="flex flex-wrap gap-1.5 pt-0.5">
          {voters.map((voter) => (
            <li
              key={voter.userId}
              className="inline-flex items-center gap-1.5 rounded-full bg-sand-50 px-2 py-1"
            >
              <AvatarCircle member={voter} size="xs" />
              <span className="text-[11px] font-medium text-sand-800">
                {voter.displayName}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
