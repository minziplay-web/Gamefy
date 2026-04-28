"use client";

import { useMemo, useState } from "react";

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

type RevealTone = "daily" | "recap" | "archive" | "neutral";

const revealToneClasses: Record<
  RevealTone,
  {
    dot: string;
    navText: string;
    selectedBorder: string;
    selectedBg: string;
    selectedPill: string;
    fill: string;
    track: string;
    voteActive: string;
    voteHover: string;
  }
> = {
  daily: {
    dot: "bg-daily-primary",
    navText: "text-daily-text",
    selectedBorder: "border-daily-primary",
    selectedBg: "bg-daily-soft",
    selectedPill: "bg-daily-text",
    fill: "bg-daily-primary",
    track: "bg-daily-track",
    voteActive: "bg-daily-text",
    voteHover: "hover:border-daily-primary/60 hover:text-daily-text",
  },
  recap: {
    dot: "bg-recap-primary",
    navText: "text-recap-text",
    selectedBorder: "border-recap-primary",
    selectedBg: "bg-[#fff8fd]",
    selectedPill: "bg-recap-primary",
    fill: "bg-recap-primary",
    track: "bg-slate-100",
    voteActive: "bg-recap-primary",
    voteHover: "hover:border-recap-primary/60 hover:text-recap-text",
  },
  archive: {
    dot: "bg-archive-primary",
    navText: "text-archive-primary",
    selectedBorder: "border-archive-primary",
    selectedBg: "bg-archive-soft",
    selectedPill: "bg-archive-primary",
    fill: "bg-archive-primary",
    track: "bg-archive-soft",
    voteActive: "bg-archive-primary",
    voteHover: "hover:border-archive-primary/60 hover:text-archive-primary",
  },
  neutral: {
    dot: "bg-brand-primary",
    navText: "text-brand-primary",
    selectedBorder: "border-brand-primary",
    selectedBg: "bg-brand-soft",
    selectedPill: "bg-brand-primary",
    fill: "bg-brand-primary",
    track: "bg-slate-100",
    voteActive: "bg-brand-primary",
    voteHover: "hover:border-brand-primary/50 hover:text-brand-primary",
  },
};

export function QuestionReveal({
  result,
  onVoteMemeCaption,
  tone = "daily",
}: {
  result: QuestionResult;
  onVoteMemeCaption?: (authorUserId: string, value: boolean) => Promise<void>;
  tone?: RevealTone;
}) {
  switch (result.questionType) {
    case "single_choice":
      return <SingleChoiceReveal result={result} tone={tone} />;
    case "multi_choice":
      return <MultiChoiceReveal result={result} tone={tone} />;
    case "open_text":
      return <OpenTextReveal result={result} />;
    case "duel_1v1":
      return <Duel1v1Reveal result={result} tone={tone} />;
    case "duel_2v2":
      return <Duel2v2Reveal result={result} tone={tone} />;
    case "either_or":
      return <EitherOrReveal result={result} tone={tone} />;
    case "meme_caption":
      return (
        <MemeCaptionReveal
          result={result}
          tone={tone}
          onVote={onVoteMemeCaption}
        />
      );
  }
}

function MemeCaptionReveal({
  result,
  onVote,
  tone,
}: {
  result: MemeCaptionResult;
  onVote?: (authorUserId: string, value: boolean) => Promise<void>;
  tone: RevealTone;
}) {
  const toneClasses = revealToneClasses[tone];
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
      ? "Gewinner"
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
          <MemeLeaderboard
            ranked={ranked}
            tone={tone}
            onSelectMeme={(targetIndex) => setIndex(targetIndex)}
          />
        </div>
      ) : (
        /* Meme / Winner: one integrated poster surface, no nested cards */
        <div
          className={`overflow-hidden rounded-[1.75rem] shadow-card-raised ${
            isWinner
              ? "bg-linear-to-b from-award-primary via-award-soft to-white"
              : "bg-white"
          }`}
        >
          <div className="relative">
            {isWinner ? (
              <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-award-primary px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-award-text shadow-card-flat">
                <span aria-hidden>🏆</span>
                Gewinner
              </div>
            ) : null}
            <MemeImage
              imagePath={result.imagePath}
              caption={imageEntry.text}
              frame="stage"
            />
          </div>
          <div key={contentKey} className="anim-meme-slide-in">
            {isWinner ? (
              <MemeWinnerPanel
                entry={winner.entry}
                count={effectiveCount(winner.entry)}
                iVoted={effectiveVoted(winner.entry)}
                tone={tone}
                onVote={winnerAuthorId ? () => handleVote(winnerAuthorId) : undefined}
              />
            ) : currentEntry ? (
              <MemeMiniFooter
                entry={currentEntry}
                count={effectiveCount(currentEntry)}
                iVoted={effectiveVoted(currentEntry)}
                tone={tone}
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
                i === index ? toneClasses.dot : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <span
          className={`text-xs font-semibold ${
            isWinner || isLeaderboard
              ? `uppercase tracking-wider ${toneClasses.navText}`
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
  tone,
  onVote,
}: {
  entry: MemeCaptionResult["entries"][number];
  count: number;
  iVoted: boolean;
  tone: RevealTone;
  onVote?: () => void;
}) {
  const toneClasses = revealToneClasses[tone];
  return (
    <div className="flex min-h-[58px] items-center justify-between gap-3 bg-white px-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {entry.author ? (
          <>
            <AvatarCircle member={entry.author} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sand-900">
                {entry.author.displayName}
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
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition ${
          iVoted
            ? `${toneClasses.voteActive} text-white shadow-card-flat`
            : `bg-white text-slate-700 ring-1 ring-slate-200 ${toneClasses.voteHover}`
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
  tone,
  onVote,
}: {
  entry: MemeCaptionResult["entries"][number];
  count: number;
  iVoted: boolean;
  tone: RevealTone;
  onVote?: () => void;
}) {
  const toneClasses = revealToneClasses[tone];
  return (
    <div className="flex min-h-[62px] overflow-hidden bg-white">
      {/* Trophy strip mirrors the leaderboard gold row. */}
      <div className="flex w-11 shrink-0 items-center justify-center bg-award-primary">
        <div className="flex size-8 items-center justify-center rounded-full bg-white/80 shadow-sm">
          <span className="anim-crown-bob text-xl" aria-hidden>🏆</span>
        </div>
      </div>
      {/* Content */}
      <div className="flex flex-1 items-center justify-between gap-3 bg-white px-3 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {entry.author ? (
            <>
              <AvatarCircle member={entry.author} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-sand-900">
                  {entry.author.displayName}
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
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition ${
            iVoted
              ? `${toneClasses.voteActive} text-white shadow-card-flat`
              : `bg-white text-slate-700 ring-1 ring-slate-200 ${toneClasses.voteHover}`
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
  tone,
  onSelectMeme,
}: {
  ranked: Array<{
    entry: MemeCaptionResult["entries"][number];
    originalIdx: number;
    count: number;
  }>;
  tone: RevealTone;
  onSelectMeme?: (index: number) => void;
}) {
  const toneClasses = revealToneClasses[tone];

  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card-raised">
      <div className="anim-winner-badge flex items-center justify-between gap-3 bg-linear-to-br from-recap-soft via-white to-award-soft px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="flex size-8 items-center justify-center rounded-full bg-award-soft text-base ring-1 ring-award-primary/30"
            aria-hidden
          >
            🏆
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sand-900">
              Rangliste
            </p>
            <p className="text-[11px] font-medium text-sand-500">
              Tippe auf eine Person, um das Meme zu sehen.
            </p>
          </div>
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {ranked.map(({ entry, originalIdx, count }, i) => {
          const medal = i === 0 ? "🏆" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;

          if (medal) {
            // Podium rows keep the medal color, but live inside one shared list.
            const strip =
              i === 0
                ? { bg: "bg-award-primary", w: "w-11", row: "bg-award-soft/45", py: "py-3.5", emoji: "text-xl" }
                : i === 1
                  ? { bg: "bg-slate-300", w: "w-10", row: "bg-slate-50", py: "py-3", emoji: "text-lg" }
                  : { bg: "bg-[#CD7F32]", w: "w-10", row: "bg-[#FFF3E8]", py: "py-3", emoji: "text-base" };

            return (
              <li
                key={originalIdx}
                className={`anim-rank-fade-up flex overflow-hidden transition ${
                  onSelectMeme ? "cursor-pointer hover:bg-slate-50" : ""
                }`}
                style={{ animationDelay: `${220 + i * 70}ms` }}
                onClick={onSelectMeme ? () => onSelectMeme(originalIdx) : undefined}
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
                  <span className={`inline-flex shrink-0 items-center gap-1 text-sm font-bold tabular-nums ${toneClasses.navText}`}>
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
              className={`anim-rank-fade-up flex items-center gap-3 bg-white px-4 py-2.5 transition ${
                onSelectMeme ? "cursor-pointer hover:bg-slate-50" : ""
              }`}
              style={{ animationDelay: `${220 + i * 70}ms` }}
              onClick={onSelectMeme ? () => onSelectMeme(originalIdx) : undefined}
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
              <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-bold tabular-nums ${toneClasses.navText}`}>
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

function SingleChoiceReveal({
  result,
  tone,
}: {
  result: SingleChoiceResult;
  tone: RevealTone;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const sorted = useMemo(
    () => [...result.counts].sort((a, b) => b.votes - a.votes),
    [result.counts],
  );
  const votersByTargetId = useMemo(
    () => groupVotersByTargetId(result.voterRows ?? []),
    [result.voterRows],
  );

  if (result.totalVotes === 0) {
    return (
      <p className="rounded-2xl bg-sand-50 px-3 py-3 text-sm text-sand-600">
        Noch keine Stimmen abgegeben.
      </p>
    );
  }

  const withVotes = sorted.filter((row) => row.votes > 0);
  const hiddenCount = sorted.length - withVotes.length;

  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card-raised">
      {withVotes.map((row, idx) => {
        const isMine = row.candidate.userId === result.myChoiceUserId;
        const isTop = idx === 0;
        const voters = votersByTargetId.get(row.candidate.userId) ?? [];
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
            tone={tone}
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
        <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-sand-500">
          {hiddenCount} weitere ohne Stimme
        </p>
      ) : null}
    </div>
  );
}

function MultiChoiceReveal({
  result,
  tone,
}: {
  result: MultiChoiceResult;
  tone: RevealTone;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const sorted = useMemo(
    () => [...result.counts].sort((a, b) => b.votes - a.votes),
    [result.counts],
  );
  const votersByTargetId = useMemo(
    () => groupVotersByTargetId(result.voterRows ?? []),
    [result.voterRows],
  );
  const myChoices = useMemo(
    () => new Set(result.myChoiceUserIds ?? []),
    [result.myChoiceUserIds],
  );

  if (result.totalVoters === 0) {
    return (
      <p className="rounded-2xl bg-sand-50 px-3 py-3 text-sm text-sand-600">
        Noch keine Stimmen abgegeben.
      </p>
    );
  }

  const withVotes = sorted.filter((row) => row.votes > 0);
  const hiddenCount = sorted.length - withVotes.length;

  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card-raised">
      <p className="bg-slate-50 px-4 py-2 text-[11px] text-sand-500">
        {result.totalVoters} {result.totalVoters === 1 ? "Antwort" : "Antworten"} ·
        Mehrfachauswahl
      </p>
      {withVotes.map((row, idx) => {
        const isMine = myChoices.has(row.candidate.userId);
        const isTop = idx === 0;
        const voters = votersByTargetId.get(row.candidate.userId) ?? [];
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
            tone={tone}
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
        <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-sand-500">
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
    <ul className="overflow-hidden rounded-[1.75rem] bg-white shadow-card-raised">
      {result.entries.map((entry, idx) => (
        <li
          key={idx}
          className="space-y-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
        >
          {entry.author ? (
            <div className="flex items-center gap-3">
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

function Duel1v1Reveal({
  result,
  tone,
}: {
  result: Duel1v1Result;
  tone: RevealTone;
}) {
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
    <div className={tone === "recap" ? "overflow-hidden rounded-[1.75rem] bg-white shadow-card-raised" : "grid grid-cols-2 overflow-hidden rounded-[1.75rem] bg-white shadow-card-raised"}>
        <DuelSideResult
          side={result.left}
          isMine={result.myChoice === "left"}
          winner={leftWins}
          voters={votersFor("left")}
          expanded={expandedSide === "left"}
          tone={tone}
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
          tone={tone}
          onToggle={() =>
            setExpandedSide((curr) => (curr === "right" ? null : "right"))
          }
        />
    </div>
  );
}

function DuelSideResult({
  side,
  isMine,
  winner,
  voters = [],
  expanded = false,
  tone,
  onToggle,
}: {
  side: { member: MemberLite; votes: number; percent: number };
  isMine: boolean;
  winner: boolean;
  voters?: MemberLite[];
  expanded?: boolean;
  tone: RevealTone;
  onToggle?: () => void;
}) {
  const toneClasses = revealToneClasses[tone];
  const clickable = Boolean(onToggle) && voters.length > 0;
  const compact = tone === "recap";

  if (compact) {
    const compactClass = `flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left transition last:border-b-0 ${
      isMine
        ? `${toneClasses.selectedBg}`
        : winner
          ? "bg-white"
          : "bg-white"
    } ${clickable ? "cursor-pointer hover:bg-slate-50" : "cursor-default"}`;
    const compactInner = (
      <>
        <AvatarCircle member={side.member} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-sand-900">
              {side.member.displayName}
            </p>
            {isMine ? (
              <span
                className={`shrink-0 rounded-full ${toneClasses.selectedPill} px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white`}
              >
                Du
              </span>
            ) : null}
          </div>
          <DuelVotersFooter
            votes={side.votes}
            voters={voters}
            expanded={expanded}
          />
        </div>
        <p className="shrink-0 text-lg font-bold tabular-nums text-sand-900">
          {side.percent}%
        </p>
      </>
    );

    if (clickable) {
      return (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={onToggle}
          className={compactClass}
        >
          {compactInner}
        </button>
      );
    }

    return <div className={compactClass}>{compactInner}</div>;
  }

  const baseClass = `flex w-full flex-col items-center gap-2 p-3 text-center transition ${
    isMine
      ? `${toneClasses.selectedBg}`
      : winner
        ? "bg-white"
        : "bg-white"
  } ${clickable ? "cursor-pointer hover:bg-slate-50" : "cursor-default"}`;

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
        <span className={`rounded-full ${toneClasses.selectedPill} px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white`}>
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

function Duel2v2Reveal({
  result,
  tone,
}: {
  result: Duel2v2Result;
  tone: RevealTone;
}) {
  const [expandedTeam, setExpandedTeam] = useState<"teamA" | "teamB" | null>(null);

  const votersFor = (team: "teamA" | "teamB") =>
    (result.voterRows ?? [])
      .filter((row) => row.team === team)
      .map((row) => row.voter);

  return (
    <div className={tone === "recap" ? "overflow-hidden rounded-[1.75rem] bg-white shadow-card-raised" : "grid grid-cols-2 overflow-hidden rounded-[1.75rem] bg-white shadow-card-raised"}>
      <DuelTeamResult
        team={result.teamA}
        label="Team A"
        isMine={result.myChoice === "teamA"}
        voters={votersFor("teamA")}
        expanded={expandedTeam === "teamA"}
        tone={tone}
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
        tone={tone}
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
  tone,
  onToggle,
}: {
  team: { members: [MemberLite, MemberLite]; votes: number; percent: number };
  label: string;
  isMine: boolean;
  voters?: MemberLite[];
  expanded?: boolean;
  tone: RevealTone;
  onToggle?: () => void;
}) {
  const toneClasses = revealToneClasses[tone];
  const clickable = Boolean(onToggle) && voters.length > 0;
  const compact = tone === "recap";

  if (compact) {
    const compactClass = `flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left transition last:border-b-0 ${
      isMine
        ? `${toneClasses.selectedBg}`
        : "bg-white"
    } ${clickable ? "cursor-pointer hover:bg-slate-50" : "cursor-default"}`;
    const compactInner = (
      <>
        <div className="flex shrink-0 items-center">
          {team.members.map((m, index) => (
            <div key={m.userId} className={index === 0 ? "" : "-ml-2"}>
              <AvatarCircle
                member={m}
                size="sm"
                className="ring-2 ring-white"
              />
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-sand-900">
              {team.members.map((m) => m.displayName).join(" & ")}
            </p>
            {isMine ? (
              <span
                className={`shrink-0 rounded-full ${toneClasses.selectedPill} px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white`}
              >
                Du
              </span>
            ) : null}
          </div>
          <DuelVotersFooter
            votes={team.votes}
            voters={voters}
            expanded={expanded}
          />
        </div>
        <p className="shrink-0 text-lg font-bold tabular-nums text-sand-900">
          {team.percent}%
        </p>
      </>
    );

    if (clickable) {
      return (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={onToggle}
          className={compactClass}
        >
          {compactInner}
        </button>
      );
    }

    return <div className={compactClass}>{compactInner}</div>;
  }

  const baseClass = `flex w-full flex-col items-center gap-2 p-3 text-center transition ${
    isMine ? `${toneClasses.selectedBg}` : "bg-white"
  } ${clickable ? "cursor-pointer hover:bg-slate-50" : "cursor-default"}`;

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
        <span className={`rounded-full ${toneClasses.selectedPill} px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white`}>
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
  const hasVoters = voters.length > 0;

  return (
    <div className="w-full space-y-1.5">
      <VoteSummary
        votes={votes}
        voters={voters}
        expanded={expanded}
        align="center"
        previewLimit={4}
      />
      <VoterChipList voters={voters} expanded={expanded && hasVoters} center />
    </div>
  );
}

function EitherOrReveal({
  result,
  tone,
}: {
  result: EitherOrResult;
  tone: RevealTone;
}) {
  const toneClasses = revealToneClasses[tone];
  const [expandedIndex, setExpandedIndex] = useState<0 | 1 | null>(null);
  const votersByOption = useMemo(() => {
    const grouped = new Map<0 | 1, MemberLite[]>();
    for (const row of result.voterRows ?? []) {
      const voters = grouped.get(row.optionIndex) ?? [];
      voters.push(row.voter);
      grouped.set(row.optionIndex, voters);
    }
    return grouped;
  }, [result.voterRows]);

  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-card-raised">
      {result.options.map((opt, idx) => {
        const optionIndex = idx as 0 | 1;
        const isMine = idx === result.myChoiceIndex;
        const voters = votersByOption.get(optionIndex) ?? [];
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
            className={`block w-full border-b border-slate-100 p-4 text-left transition last:border-b-0 ${
              isMine ? `${toneClasses.selectedBg}` : "bg-white"
            } ${canToggle ? "cursor-pointer hover:bg-slate-50" : "cursor-default"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-sand-900">
                {opt.label}
              </span>
              <span className="text-sm font-bold tabular-nums text-sand-900">
                {opt.percent}%
              </span>
            </div>
            <div className={`mt-2 h-2 overflow-hidden rounded-full ${toneClasses.track}`}>
              <div
                className={`h-full rounded-full ${toneClasses.fill} transition-[width] duration-500`}
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
  tone,
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
  tone: RevealTone;
  onToggle?: () => void;
}) {
  const toneClasses = revealToneClasses[tone];
  const clickable = Boolean(onToggle);

  return (
    <button
      type="button"
      disabled={!clickable}
      aria-expanded={clickable ? expanded : undefined}
      onClick={onToggle}
      className={`block w-full border-b border-slate-100 p-4 text-left transition last:border-b-0 ${
        highlight
          ? `${toneClasses.selectedBg}`
          : top
            ? "bg-white"
            : "bg-white"
      } ${clickable ? "cursor-pointer hover:bg-slate-50" : "cursor-default"}`}
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
          <div className={`mt-1 h-1.5 overflow-hidden rounded-full ${toneClasses.track}`}>
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${
                highlight ? toneClasses.fill : "bg-slate-400"
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

  if (!hasVoters) {
    return (
      <p className="mt-1 text-xs font-medium text-sand-600">
        {votes} {votes === 1 ? "Stimme" : "Stimmen"}
      </p>
    );
  }

  return (
    <div className="mt-1 space-y-1.5">
      <VoteSummary votes={votes} voters={voters} expanded={expanded} />
      <VoterChipList voters={voters} expanded={expanded} />
    </div>
  );
}

function VoteSummary({
  votes,
  voters,
  expanded,
  align = "left",
  previewLimit = 5,
}: {
  votes: number;
  voters: MemberLite[];
  expanded: boolean;
  align?: "left" | "center";
  previewLimit?: number;
}) {
  const label = `${votes} ${votes === 1 ? "Stimme" : "Stimmen"}`;
  const center = align === "center";

  return (
    <div
      className={`flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 ${
        center ? "justify-center" : ""
      }`}
    >
      <p className="shrink-0 text-xs font-semibold text-sand-700">{label}</p>
      <AvatarStack voters={voters} limit={Math.min(previewLimit, 4)} />
      {voters.length > 0 ? (
        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-sand-400 min-[390px]:inline">
          gewählt von
        </span>
      ) : null}
      {voters.length > 0 ? (
        <span
          aria-hidden
          className={`${
            center ? "" : "ml-auto"
          } text-[10px] font-semibold text-sand-500 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      ) : null}
    </div>
  );
}

function AvatarStack({
  voters,
  limit = 5,
}: {
  voters: MemberLite[];
  limit?: number;
}) {
  if (voters.length === 0) return null;

  return (
    <div className="flex items-center">
      {voters.slice(0, limit).map((voter, index) => (
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
      {voters.length > limit ? (
        <span className="-ml-1.5 inline-flex size-6 items-center justify-center rounded-full bg-sand-200 text-[10px] font-semibold text-sand-700 ring-2 ring-white">
          +{voters.length - limit}
        </span>
      ) : null}
    </div>
  );
}

function VoterChipList({
  voters,
  expanded,
  center = false,
}: {
  voters: MemberLite[];
  expanded: boolean;
  center?: boolean;
}) {
  if (!expanded) {
    return null;
  }

  return (
    <div
      className="anim-voter-list mt-2"
      aria-hidden={false}
    >
      <div className="border-t border-slate-100 pt-2">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sand-400">
          Gewählt von
        </p>
        <ul className={`grid gap-1.5 min-[390px]:flex min-[390px]:flex-wrap ${center ? "min-[390px]:justify-center" : ""}`}>
          {voters.map((voter) => (
            <li
              key={voter.userId}
              className="inline-flex min-w-0 items-center gap-2 px-0.5 py-1"
            >
              <AvatarCircle member={voter} size="sm" />
              <span className="truncate text-xs font-semibold text-sand-800">
                {voter.displayName}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function groupVotersByTargetId(
  rows: Array<{ voter: MemberLite; target: MemberLite }>,
) {
  const grouped = new Map<string, MemberLite[]>();
  for (const row of rows) {
    const voters = grouped.get(row.target.userId) ?? [];
    voters.push(row.voter);
    grouped.set(row.target.userId, voters);
  }
  return grouped;
}
