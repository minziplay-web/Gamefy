"use client";

import { onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

import { STORY_COLORS } from "@/components/story/constants";
import { AvatarCircle } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/auth-context";
import { usersCollection } from "@/lib/firebase/collections";
import {
  createDailyComment,
  deleteDailyComment,
  subscribeDailyComments,
  updateDailyComment,
  type DailyComment,
} from "@/lib/firebase/daily-comments";
import {
  subscribeDailyQuestionLikes,
  toggleDailyQuestionLike,
} from "@/lib/firebase/daily-question-likes";
import { formatListenerError } from "@/lib/firebase/listener-errors";
import type { UserDoc } from "@/lib/types/firestore";

const MAX_COMMENT_LENGTH = 1000;
const DARK = {
  elevated: "#161616",
  text: "#FAFAFA",
  muted: "#A8A8A8",
  dim: "#6E6E73",
  hair: "#1F1F1F",
  hairStrong: "#2C2C2E",
};

export function InlineCommentsSection({
  dateKey,
  runId,
  questionId,
}: {
  dateKey: string;
  runId?: string;
  questionId: string;
}) {
  const { authState } = useAuth();
  const [comments, setComments] = useState<DailyComment[]>([]);
  const [users, setUsers] = useState<Map<string, UserDoc>>(new Map());
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<{ commentId: string; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [likeState, setLikeState] = useState({ count: 0, likedByMe: false });
  const [likeBusy, setLikeBusy] = useState(false);
  const resolvedRunId = runId ?? dateKey;
  const currentUser = authState.status === "authenticated" ? authState.user : null;

  useEffect(() => {
    const usersRef = usersCollection();

    if (!usersRef) {
      queueMicrotask(() => setError("Firestore ist noch nicht verbunden."));
      return;
    }

    const unsubscribeComments = subscribeDailyComments(
      { runId: resolvedRunId, questionId },
      (nextComments) => {
        setComments(nextComments);
        setError(null);
      },
      (listenerError) => setError(formatListenerError("Kommentare", listenerError)),
    );
    const unsubscribeLikes = subscribeDailyQuestionLikes(
      { runId: resolvedRunId, questionId, userId: currentUser?.userId },
      setLikeState,
      (listenerError) => setError(formatListenerError("Likes", listenerError)),
    );
    const unsubscribeUsers = onSnapshot(
      query(usersRef, where("isActive", "==", true)),
      (snapshot) => {
        setUsers(
          new Map(
            snapshot.docs.map((userDoc) => [
              userDoc.id,
              userDoc.data() as UserDoc,
            ]),
          ),
        );
      },
      (listenerError) => setError(formatListenerError("Mitglieder", listenerError)),
    );

    return () => {
      unsubscribeComments();
      unsubscribeLikes();
      unsubscribeUsers();
    };
  }, [currentUser?.userId, questionId, resolvedRunId]);

  const sortedComments = useMemo(
    () =>
      [...comments].sort(
        (left, right) =>
          readTimestampMs(left.createdAt) - readTimestampMs(right.createdAt),
      ),
    [comments],
  );

  const submit = async () => {
    if (!currentUser || submitting) {
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createDailyComment({
        dateKey,
        runId: resolvedRunId,
        questionId,
        userId: currentUser.userId,
        text: trimmed,
      });
      setText("");
    } catch (submitError) {
      setError(errorMessage(submitError, "Kommentar konnte nicht gesendet werden."));
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = async () => {
    if (!editing || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await updateDailyComment({
        commentId: editing.commentId,
        text: editing.text,
      });
      setEditing(null);
    } catch (submitError) {
      setError(errorMessage(submitError, "Kommentar konnte nicht gespeichert werden."));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (commentId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await deleteDailyComment(commentId);
    } catch (deleteError) {
      setError(errorMessage(deleteError, "Kommentar konnte nicht gelöscht werden."));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async () => {
    if (!currentUser || likeBusy) {
      return;
    }

    setLikeBusy(true);
    setError(null);
    try {
      await toggleDailyQuestionLike({
        dateKey,
        runId: resolvedRunId,
        questionId,
        userId: currentUser.userId,
        liked: likeState.likedByMe,
      });
    } catch (likeError) {
      setError(errorMessage(likeError, "Like konnte nicht gespeichert werden."));
    } finally {
      setLikeBusy(false);
    }
  };

  return (
    <section className="space-y-3" aria-label="Kommentare und Likes">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition disabled:opacity-40"
          style={{ color: likeState.likedByMe ? STORY_COLORS.archiv : DARK.muted }}
          disabled={!currentUser || likeBusy}
          aria-pressed={likeState.likedByMe}
          aria-label={likeState.likedByMe ? "Like entfernen" : "Frage liken"}
          onClick={() => void toggleLike()}
        >
          <HeartIcon filled={likeState.likedByMe} />
          <span
            className="text-[11px] tabular-nums"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {likeState.count}
          </span>
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition"
          style={{ color: expanded ? STORY_COLORS.daily : DARK.muted }}
          aria-expanded={expanded}
          aria-label={expanded ? "Kommentare einklappen" : "Kommentare anzeigen"}
          onClick={() => setExpanded((value) => !value)}
        >
          <CommentIcon />
          <span
            className="text-[11px] tabular-nums"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {comments.length}
          </span>
        </button>
      </div>

      {expanded ? (
        <div className="space-y-3 border-t pt-4" style={{ borderColor: DARK.hair }}>
          {error ? (
            <p
              className="rounded-lg px-3 py-2 text-xs text-red-200"
              style={{ backgroundColor: "#3A1414" }}
            >
              {error}
            </p>
          ) : null}

          {sortedComments.length === 0 ? (
            <p className="text-sm" style={{ color: DARK.muted }}>
              Noch keine Kommentare.
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: DARK.hair }}>
              {sortedComments.map((comment) => {
                const user = users.get(comment.userId);
                const isOwn = currentUser?.userId === comment.userId;
                const isEditing = editing?.commentId === comment.commentId;
                const displayName =
                  user?.displayName ?? (isOwn ? currentUser.displayName : "Jemand");

                return (
                  <li key={comment.commentId} className="py-3">
                    <div className="flex gap-3">
                      <AvatarCircle
                        member={{
                          userId: comment.userId,
                          displayName,
                          photoURL: user?.photoURL ?? null,
                        }}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-sm font-semibold" style={{ color: DARK.text }}>
                            {displayName}
                          </span>
                          <span
                            className="shrink-0 text-[10px] uppercase tracking-[0.12em]"
                            style={{ color: DARK.dim, fontFamily: "var(--font-mono)" }}
                          >
                            {formatCommentTime(comment.createdAt)}
                          </span>
                        </div>

                        {isEditing ? (
                          <div className="mt-2 space-y-2">
                            <CommentTextarea
                              value={editing.text}
                              rows={3}
                              disabled={submitting}
                              onChange={(value) =>
                                setEditing({ commentId: editing.commentId, text: value })
                              }
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                                style={{ color: DARK.muted }}
                                onClick={() => setEditing(null)}
                              >
                                Abbrechen
                              </button>
                              <button
                                type="button"
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                style={{ backgroundColor: STORY_COLORS.profil }}
                                disabled={submitting || !editing.text.trim()}
                                onClick={saveEdit}
                              >
                                Speichern
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p
                              className="mt-1 whitespace-pre-wrap text-sm leading-5"
                              style={{ color: DARK.muted }}
                            >
                              {comment.text}
                            </p>
                            {isOwn ? (
                              <div className="mt-2 flex gap-3">
                                <button
                                  type="button"
                                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                                  style={{ color: DARK.dim, fontFamily: "var(--font-mono)" }}
                                  onClick={() =>
                                    setEditing({
                                      commentId: comment.commentId,
                                      text: comment.text,
                                    })
                                  }
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                                  style={{ color: DARK.dim, fontFamily: "var(--font-mono)" }}
                                  onClick={() => void remove(comment.commentId)}
                                >
                                  Löschen
                                </button>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="space-y-2">
            <CommentTextarea
              value={text}
              rows={3}
              placeholder={currentUser ? "Kommentar schreiben..." : "Einloggen zum Kommentieren"}
              disabled={!currentUser || submitting}
              onChange={setText}
            />
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] tabular-nums"
                style={{ color: DARK.dim, fontFamily: "var(--font-mono)" }}
              >
                {text.length}/{MAX_COMMENT_LENGTH}
              </span>
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-40"
                style={{ backgroundColor: STORY_COLORS.daily, fontFamily: "var(--font-mono)" }}
                disabled={!currentUser || submitting || !text.trim()}
                onClick={() => void submit()}
              >
                Senden
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function CommentCountBadge({
  runId,
  questionId,
}: {
  runId: string;
  questionId: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeDailyComments(
      { runId, questionId },
      (nextComments) => setCount(nextComments.length),
      () => setCount(0),
    );

    return () => {
      unsubscribe();
    };
  }, [questionId, runId]);

  return <>{count}</>;
}

function CommentTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  rows,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows: number;
}) {
  return (
    <textarea
      value={value}
      maxLength={MAX_COMMENT_LENGTH}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition placeholder:text-[#6E6E73] disabled:opacity-60"
      style={{
        borderColor: DARK.hairStrong,
        backgroundColor: DARK.elevated,
        color: DARK.text,
      }}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
      <path
        d="M12 20.5S4.5 16.1 4.5 9.7A4 4 0 0 1 12 7.8a4 4 0 0 1 7.5 1.9c0 6.4-7.5 10.8-7.5 10.8Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
      <path
        d="M4 5.5h16v10.5H10l-4 3.5v-3.5H4v-10.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function readTimestampMs(value: unknown) {
  if (!value) {
    return 0;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof (value as { seconds?: unknown }).seconds === "number"
  ) {
    return (value as { seconds: number }).seconds * 1000;
  }

  return 0;
}

function formatCommentTime(value: unknown) {
  const ms = readTimestampMs(value);
  if (!ms) {
    return "";
  }

  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(new Date(ms));
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}
