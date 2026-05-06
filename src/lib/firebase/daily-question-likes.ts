"use client";

import {
  deleteDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import {
  dailyQuestionLikeDoc,
  dailyQuestionLikesCollection,
} from "@/lib/firebase/collections";
import type { DailyQuestionLikeDoc } from "@/lib/types/firestore";

export type DailyQuestionLikeState = {
  count: number;
  likedByMe: boolean;
};

export function dailyQuestionLikeId(params: {
  runId: string;
  questionId: string;
  userId: string;
}) {
  return `${params.runId}_${params.questionId}_${params.userId}`;
}

export function subscribeDailyQuestionLikes(
  params: {
    runId: string;
    questionId: string;
    userId?: string | null;
  },
  onNext: (state: DailyQuestionLikeState) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const likesRef = dailyQuestionLikesCollection();

  if (!likesRef) {
    queueMicrotask(() => onError?.(new Error("Firestore ist nicht verfügbar.")));
    return () => undefined;
  }

  return onSnapshot(
    query(
      likesRef,
      where("runId", "==", params.runId),
      where("questionId", "==", params.questionId),
    ),
    (snapshot) => {
      onNext({
        count: snapshot.size,
        likedByMe: params.userId
          ? snapshot.docs.some((likeDoc) => {
              const like = likeDoc.data() as DailyQuestionLikeDoc;
              return like.userId === params.userId;
            })
          : false,
      });
    },
    (error) => onError?.(error),
  );
}

export async function toggleDailyQuestionLike(params: {
  dateKey: string;
  runId: string;
  questionId: string;
  userId: string;
  liked: boolean;
}) {
  const likeRef = dailyQuestionLikeDoc(dailyQuestionLikeId(params));

  if (!likeRef) {
    throw new Error("Firestore ist nicht verfügbar.");
  }

  if (params.liked) {
    await deleteDoc(likeRef);
    return;
  }

  await setDoc(likeRef, {
    dateKey: params.dateKey,
    runId: params.runId,
    questionId: params.questionId,
    userId: params.userId,
    createdAt: serverTimestamp(),
  } satisfies DailyQuestionLikeDoc);
}
