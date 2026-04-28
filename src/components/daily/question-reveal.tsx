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
  MultiChoiceResult,
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
    case "multi_choice":
      return <MultiChoiceReveal result={result} />;
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
  const [rawIndex, setIndex] = useState(0);
  const [localVotes, setLocalVotes] = useState<
    Record<string, { iVoted: boolean; count: number }>
  >({});

  if (entries.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-card border border-sand-100 bg-white p-3 shadow-card-flat">
        <MemeImage imagePath={result.imagePath} />
        <p className="rounded-2xl bg-sand-50 px-3 py-3 text-sm text-sand-600">
          Noch keine Bildunterschriften.
        </p>
      </div>
    );
  }

  const hasLeaderboard = entries.length > 1;
  const totalSlides = entries.length + 1 + (hasLeaderboard ? 1 : 0);
  const winnerSlideIndex = entries.length;
  const leaderboardSlideIndex = hasLeaderboard ? entries.length + 1 : -1;
  const index = Math.min(Math.max(0, rawIndex), totalSlides - 1);

  const effectiveCount = (e: MemeCaptionResult["entries"][number]) => {
    const id = e.author?.userId;
    if (id && localVotes[id]) return localVotes[id].count;
    return e.thumbsUpCount ?? 0;
  };

  const effectiveVoted = (e: MemeCaptionResult["entries"][number]) => {
    const id = e.author?.userId;
    if (id && localVotes[id] !== undefined) return localVotes[id].iVoted;
    return e.iVoted ?? false;
  };

  const ranked = entries
    .map((e, originalIdx) => ({ entry: e, originalIdx, count: effectiveCount(e) }))
    .sort((a, b) =>
      b.count !== a.count ? b.count - a.count : a.originalIdx - b.originalIdx,
    );
  const winner = ranked[0];

  const isWinner = index === winnerSlideIndex;
  const isLeaderboard = index === leaderboardSlideIndex;
  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(totalSlides - 1, i + 1));

  const navLabel = isLeaderboard
    ? "Rangliste"
    : isWinner
      ? "Winner"
      : `Meme ${index + 1}`;

  // Image always shows current meme caption; winner + leaderboard show winning caption
  const imageEntry = isWinner || isLeaderboard ? winner.entry : entries[index];

  const handleVote = (targetUserId: string) => {
    const prev = localVotes[targetUserId];
    const baseEntry = entries.find((e) => e.author?.userId === targetUserId);
    const currentVoted = prev?.iVoted ?? baseEntry?.iVoted ?? false;
    const currentCount = prev?.count ?? baseEntry?.thumbsUpCount ?? 0;
    const nextVoted = !currentVoted;
    const nextCount = Math.max(0, currentCount + (nextVoted ? 1 : -1));
    setLocalVotes((lv) => ({
      ...lv,
      [targetUserId]: { iVoted: nextVoted, count: nextCount },
    }));
    if (onVote) {
      void onVote(targetUserId, nextVoted).catch(() => {
        setLocalVotes((lv) => ({
          ...lv,
          [targetUserId]: { iVoted: currentVoted, count: currentCount },
        }));
      });
    }
  };

  const winnerAuthorId = winner.entry.author?.userId;
  const currentEntry = !isWinner && !isLeaderboard ? entries[index] : undefined;
  const currentAuthorId = currentEntry?.author?.userId;
  const contentKey = isLeaderboard ? "leaderboard" : isWinner ? "winner" : `meme-${index}`;

  return (
    <div className="flex flex-col gap-3">
      {isLeaderboard ? (
        /* Leaderboard: rendered directly — no inner card, no extra border */
        <div key="leaderboard" className="anim-meme-slide-in">
          <MemeLeaderboard ranked={ranked} />
        </div>
      ) : (
        /* Meme / Winner: image anchored at top, panel swaps below */
        <div className={`rounded-card border p-3 ${isWinner ? "border-amber-200 bg-linear-to-b from-amber-50 to-white shadow-card-raised" : "border-sand-100 bg-white shadow-card-flat"}`}>
          {/* Image — identical layout in all states, winner overlay is absolute */}
          <div className={`relative${isWinner ? " rounded-2xl ring-2 ring-amber-400/60" : ""}`}>
            <MemeImage imagePath={result.imagePath} caption={imageEntry.text} />
          </div>
          <div key={contentKey} className="anim-meme-slide-in mt-3">
            {isWinner ? (
              <MemeWinnerPanel
                entry={winner.entry}
                count={effectiveCount(winner.entry)}
                iVoted={effectiveVoted(winner.entry)}
                onVote={winnerAuthorId ? () => handleVote(winnerAuthorId) : undefined}
              />
            ) : currentEntry ? (
              <MemeMiniFooter
                entry={currentEntry}
                count={effectiveCount(currentEntry)}
                iVoted={effectiveVoted(currentEntry)}
                onVote={currentAuthorId ? () => handleVote(currentAuthorId) : undefined}
              />
            ) : null}
          </div>
        </div>
      )}

      {/* Navigation — identical structure across all states */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="inline-flex size-9 items-center justify-center rounded-full border border-sand-200 bg-white text-sand-700 transition hover:border-sand-300 disabled:opacity-40"
          aria-label="Vorheriger Slide"
        >
          ‹
        </button>

        <div className="flex flex-1 items-center justify-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={`rounded-full transition ${i >= winnerSlideIndex ? "size-2" : "size-1.5"} ${
                i === index ? "bg-coral" : "bg-sand-200"
              }`}
            />
          ))}
        </div>

        <span
          className={`text-xs font-semibold ${
            isWinner || isLeaderboard
              ? "uppercase tracking-wider text-coral"
              : "tracking-wider text-sand-500"
          }`}
        >
          {navLabel}
        </span>

        <button
          type="button"
          onClick={goNext}
          disabled={index === totalSlides - 1}
          className="inline-flex size-9 items-center justify-center rounded-full border border-sand-200 bg-white text-sand-700 transition hover:border-sand-300 disabled:opacity-40"
          aria-label={
            isWinner
              ? hasLeaderboard
                ? "Zur Rangliste"
                : "Letzter Slide"
              : index === entries.length - 1
                ? "Zum Winner"
                : "Nächstes Meme"
          }
        >
          ›
        </button>
      </div>
    </div>
  );
}

function MemeMiniFooter({
  entry,
  count,
  iVoted,
  onVote,
}: {
  entry: MemeCaptionResult["entries"][number];
  count: number;
  iVoted: boolean;
  onVote?: () => void;
}) {
  return (
    <div className="flex min-h-[58px] items-center justify-between gap-3 rounded-2xl bg-sand-50 px-3 py-2.5">
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
          <span className="text-sm font-semibold text-sand-400">Unbekannt</span>
        )}
      </div>
      <button
        type="button"
        onClick={onVote}
        disabled={!onVote}
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
  );
}

function MemeWinnerPanel({
  entry,
  count,
  iVoted,
  onVote,
}: {
  entry: MemeCaptionResult["entries"][number];
  count: number;
  iVoted: boolean;
  onVote?: () => void;
}) {
  return (
    <div className="flex min-h-[58px] overflow-hidden rounded-2xl border-2 border-amber-300">
      {/* Amber strip with crown — mirrors leaderboard gold row */}
      <div className="flex w-11 shrink-0 items-center justify-center bg-amber-400">
        <div className="flex size-8 items-center justify-center rounded-full bg-white/80 shadow-sm">
          <span className="anim-crown-bob text-xl" aria-hidden>👑</span>
        </div>
      </div>
      {/* Content */}
      <div className="flex flex-1 items-center justify-between gap-3 bg-amber-50 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          {entry.author ? (
            <>
              <AvatarCircle member={entry.author} size="md" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-sand-900">
                  {entry.author.displayName}
                </p>
                <p className="truncate text-xs text-sand-600">
                  {iVoted ? "Du hast geherzt" : "Bestes Meme"}
                </p>
              </div>
            </>
          ) : (
            <span className="text-sm font-semibold text-sand-500">Unbekannt</span>
          )}
        </div>
        <button
          type="button"
          onClick={onVote}
          disabled={!onVote}
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
  );
}

function MemeLeaderboard({
  ranked,
}: {
  ranked: Array<{
    entry: MemeCaptionResult["entries"][number];
    originalIdx: number;
    count: number;
  }>;
}) {
  return (
    <div>
      {/* Header — matches the imposing winner badge style */}
      <div className="anim-winner-badge mb-3 flex justify-center">
        <div className="flex items-center gap-2 rounded-full bg-sand-900 px-5 py-1.5 shadow-card-flat">
          <span className="text-sm" aria-hidden>🏆</span>
          <span className="text-[11px] font-black uppercase tracking-[0.22em] text-cream">
            Rangliste
          </span>
        </div>
      </div>

      <ul className="space-y-1.5">
        {ranked.map(({ entry, originalIdx, count }, i) => {
          const medal = i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;

          if (medal) {
            // Podium rows: decreasing-width colored strip that contains the emoji
            const strip =
              i === 0
                ? { bg: "bg-amber-400", w: "w-11", border: "border-2 border-amber-300", row: "bg-amber-50", py: "py-3", emoji: "text-xl" }
                : i === 1
                  ? { bg: "bg-slate-300", w: "w-9", border: "border-2 border-slate-300", row: "bg-slate-50", py: "py-2.5", emoji: "text-lg" }
                  : { bg: "bg-orange-300", w: "w-8", border: "border-2 border-orange-300", row: "bg-orange-50", py: "py-2.5", emoji: "text-base" };

            return (
              <li
                key={originalIdx}
                className={`anim-rank-fade-up flex overflow-hidden rounded-2xl ${strip.border}`}
                style={{ animationDelay: `${220 + i * 70}ms` }}
              >
                {/* Colored accent strip — emoji on white backdrop for contrast */}
                <div className={`flex shrink-0 items-center justify-center ${strip.w} ${strip.bg}`}>
                  <div className="flex size-8 items-center justify-center rounded-full bg-white/80 shadow-sm">
                    <span className={strip.emoji} aria-hidden>{medal}</span>
                  </div>
                </div>
                {/* Row content */}
                <div className={`flex flex-1 items-center gap-3 ${strip.row} px-3 ${strip.py}`}>
                  {entry.author ? (
                    <AvatarCircle member={entry.author} size="md" />
                  ) : (
                    <div className="size-9 shrink-0 rounded-full bg-sand-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-sand-900">
                      {entry.author?.displayName ?? "Unbekannt"}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums text-coral">
                    <span aria-hidden>❤️</span>
                    {count}
                  </span>
                </div>
              </li>
            );
          }

          // Non-podium rows: simple flat style
          return (
            <li
              key={originalIdx}
              className="anim-rank-fade-up flex items-center gap-3 rounded-2xl border border-sand-100 bg-sand-50/50 px-3 py-2"
              style={{ animationDelay: `${220 + i * 70}ms` }}
            >
              <div className="flex w-7 shrink-0 items-center justify-center">
                <span className="text-xs font-semibold tabular-nums text-sand-400">{i + 1}</span>
              </div>
              {entry.author ? (
                <AvatarCircle member={entry.author} size="sm" />
              ) : (
                <div className="size-7 shrink-0 rounded-full bg-sand-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-sand-500">
                  {entry.author?.displayName ?? "Unbekannt"}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold tabular-nums text-coral">
                <span aria-hidden>❤️</span>
                {count}
              </span>
            </li>
          );
        })}
      </ul>
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
        const voters = (result.voterRows ?? [])
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

function MultiChoiceReveal({ result }: { result: MultiChoiceResult }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (result.totalVoters === 0) {
    return (
      <p className="rounded-2xl bg-sand-50 px-3 py-3 text-sm text-sand-600">
        Noch keine Stimmen abgegeben.
      </p>
    );
  }

  const sorted = [...result.counts].sort((a, b) => b.votes - a.votes);
  const withVotes = sorted.filter((row) => row.votes > 0);
  const hiddenCount = sorted.length - withVotes.length;
  const myChoices = new Set(result.myChoiceUserIds ?? []);

  return (
    <div className="space-y-2">
      <p className="px-1 text-[11px] text-sand-500">
        {result.totalVoters} {result.totalVoters === 1 ? "Antwort" : "Antworten"} ·
        Mehrfachauswahl
      </p>
      {withVotes.map((row, idx) => {
        const isMine = myChoices.has(row.candidate.userId);
        const isTop = idx === 0;
        const voters = (result.voterRows ?? [])
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
    (result.voterRows ?? [])
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
        <p className="text-xs font-medium text-sand-600">
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
    (result.voterRows ?? [])
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
      <p className="text-xs font-medium text-sand-600">
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
        <p className="text-xs font-medium text-sand-600">
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
                size="sm"
                className="ring-2 ring-white"
              />
            </div>
          ))}
          {voters.length > 4 ? (
            <span className="-ml-1.5 inline-flex size-6 items-center justify-center rounded-full bg-sand-200 text-[10px] font-semibold text-sand-700 ring-2 ring-white">
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
              className="inline-flex items-center gap-2 rounded-full bg-sand-50 px-2.5 py-1.5"
            >
              <AvatarCircle member={voter} size="sm" />
              <span className="text-xs font-medium text-sand-800">
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
        const voters = (result.voterRows ?? [])
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
            <span className="text-[15px] font-semibold text-sand-900">{label}</span>
            <span className="text-[15px] font-bold tabular-nums text-sand-900">
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
    return <p className="mt-1 text-xs font-medium text-sand-600">{label}</p>;
  }

  return (
    <div className="mt-1 space-y-1.5">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-sand-600">{label}</p>
        <div className="flex items-center">
          {voters.slice(0, 5).map((voter, index) => (
            <div
              key={`${voter.userId}_${index}`}
              className={index === 0 ? "" : "-ml-1.5"}
            >
              <AvatarCircle
                member={voter}
                size="sm"
                className="ring-2 ring-white"
              />
            </div>
          ))}
          {voters.length > 5 ? (
            <span className="-ml-1.5 inline-flex size-6 items-center justify-center rounded-full bg-sand-200 text-[10px] font-semibold text-sand-700 ring-2 ring-white">
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
              className="inline-flex items-center gap-2 rounded-full bg-sand-50 px-2.5 py-1.5"
            >
              <AvatarCircle member={voter} size="sm" />
              <span className="text-xs font-medium text-sand-800">
                {voter.displayName}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
