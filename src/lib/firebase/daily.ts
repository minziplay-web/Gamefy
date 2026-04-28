"use client";

import { onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-context";
import { shouldHideUserTrophyQuestionForUser } from "@/lib/daily/custom-daily-questions";
import {
  dailyAnswersCollection,
  dailyMemeVotesCollection,
  dailyPrivateAnswersCollection,
  dailyRunDoc,
  questionsCollection,
  usersCollection,
} from "@/lib/firebase/collections";
import { formatListenerError } from "@/lib/firebase/listener-errors";
import { resolveDailyRunStatus, validateDailyRun } from "@/lib/mapping/daily-run";
import { shouldReveal } from "@/lib/mapping/daily";
import { berlinDateKey } from "@/lib/mapping/date";
import { mockDaily } from "@/lib/mocks";
import type {
  DailyAnswerDraft,
  DailyQuestion,
  DailyQuestionCardState,
  DailyViewState,
  MemberLite,
  QuestionResult,
} from "@/lib/types/frontend";
import type {
  DailyAnswerDoc,
  DailyMemeVoteDoc,
  DailyPrivateAnswerDoc,
  DailyRunItemDoc,
  DailyRunDoc,
  QuestionDoc,
  UserDoc,
} from "@/lib/types/firestore";

type QuestionLike = Pick<
  QuestionDoc,
  "text" | "category" | "type" | "options" | "imagePath"
>;

export function useDailyViewState(targetDateKey?: string): DailyViewState {
  const { authState, isMockMode } = useAuth();
  const [state, setState] = useState<DailyViewState>(
    isMockMode ? mockDaily : { status: "loading" },
  );

  useEffect(() => {
    if (isMockMode) {
      return;
    }

    if (authState.status !== "authenticated") {
      queueMicrotask(() => setState({ status: "loading" }));
      return;
    }

    const todayDateKey = berlinDateKey();
    const dateKey = targetDateKey ?? todayDateKey;
    const runRef = dailyRunDoc(dateKey);
    const answersRef = dailyAnswersCollection();
    const privateAnswersRef = dailyPrivateAnswersCollection();
    const memeVotesRef = dailyMemeVotesCollection();
    const questionsRef = questionsCollection();
    const usersRef = usersCollection();

    if (
      !runRef ||
      !answersRef ||
      !privateAnswersRef ||
      !memeVotesRef ||
      !questionsRef ||
      !usersRef
    ) {
      queueMicrotask(() =>
        setState({ status: "error", message: "Firestore ist noch nicht verbunden." }),
      );
      return;
    }

    let runData: DailyRunDoc | null = null;
    let questions = new Map<string, QuestionDoc>();
    let members = new Map<string, MemberLite>();
    let activeMembers = new Map<string, MemberLite>();
    let myAnswers = new Map<string, DailyAnswerDoc>();
    let allPublicAnswers = new Map<string, DailyAnswerDoc[]>();
    let memeVotes = new Map<string, DailyMemeVoteDoc[]>();

    const emit = () => {
      if (!runData) {
        setState({
          status: "no_run",
          dateKey,
          message: "Heute wurde noch keine Daily erzeugt.",
        });
        return;
      }

      const run = runData;
      const effectiveRunStatus = resolveDailyRunStatus(run);
      const validatedRun = validateDailyRun({
        run,
        questions,
        activeMemberIds: new Set(activeMembers.keys()),
      });
      const visibleItems = validatedRun.playableItems.filter((item) => {
        const question = questions.get(item.questionId);
        return !question
          || !shouldHideUserTrophyQuestionForUser(question, authState.user.userId);
      });
      const playableQuestionIds = new Set(
        visibleItems.map((item) => item.questionId),
      );
      const answeredPlayableCount = Array.from(myAnswers.keys()).filter((questionId) =>
        playableQuestionIds.has(questionId),
      ).length;
      const isCatchUpMode = dateKey < todayDateKey;
      const holdResultsUntilFinished =
        (effectiveRunStatus === "active" || isCatchUpMode) &&
        answeredPlayableCount < visibleItems.length;

      if (validatedRun.isUnplayable) {
        setState({
          status: "run_unplayable",
          dateKey,
          reason:
            validatedRun.reason ?? "Der heutige Run enthält keine spielbaren Fragen.",
          isAdmin: authState.user.role === "admin",
        });
        return;
      }

      const cards = visibleItems.reduce<DailyQuestionCardState[]>(
        (acc, item, index) => {
        const questionDoc = getQuestionSource(item, questions);
        if (!questionDoc) {
          return acc;
        }

        const question = mapDailyQuestion({
              questionId: item.questionId,
              question: questionDoc,
              index,
              total: visibleItems.length,
              members: activeMembers,
              pairing: item.pairing,
            });

        if (!question) {
          return acc;
        }

        const myAnswerDoc = myAnswers.get(item.questionId);
        const myAnswer = myAnswerDoc ? mapDailyAnswerDraft(myAnswerDoc) : undefined;
        const reveal = holdResultsUntilFinished
          ? false
          : shouldReveal({
              revealPolicy: run.revealPolicy,
              runStatus: effectiveRunStatus,
              dateKey: run.dateKey,
              hasOwnAnswer: Boolean(myAnswer),
            });

        if (!myAnswer && reveal) {
          acc.push({
            phase: "revealed",
            question,
            result: mapQuestionResult({
              question,
              publicAnswers: allPublicAnswers.get(item.questionId) ?? [],
              memeVotes: memeVotes.get(item.questionId) ?? [],
              currentUserId: authState.user.userId,
              members,
            }),
          });
          return acc;
        }

        if (!myAnswer) {
          acc.push({ phase: "unanswered", question });
          return acc;
        }

        if (!reveal) {
          acc.push({ phase: "submitted_waiting_reveal", question, myAnswer });
          return acc;
        }

          acc.push({
            phase: "revealed",
            question,
            myAnswer,
            result: mapQuestionResult({
              question,
              myAnswer,
              publicAnswers: allPublicAnswers.get(item.questionId) ?? [],
              memeVotes: memeVotes.get(item.questionId) ?? [],
              currentUserId: authState.user.userId,
              members,
            }),
          });

        return acc;
      }, []);

      setState({
        status: "ready",
        dateKey,
        runStatus: effectiveRunStatus,
        revealPolicy: run.revealPolicy,
        cards,
        progress: {
          answered: cards.filter(
            (card) =>
              card.phase === "submitted_waiting_reveal" || card.phase === "revealed",
          ).length,
          total: cards.length,
        },
        hasIncompleteItems: validatedRun.hasIncompleteItems,
      });
    };

    const handleError = (scope: string) => (error: unknown) => {
      setState({
        status: "error",
        message: formatListenerError(scope, error),
      });
    };

    const unsubscribers = [
      onSnapshot(
        runRef,
        (snapshot) => {
          runData = snapshot.exists() ? (snapshot.data() as DailyRunDoc) : null;
          emit();
        },
        handleError("Daily-Run"),
      ),
      onSnapshot(
        questionsRef,
        (snapshot) => {
          questions = new Map(
            snapshot.docs.map((doc) => [doc.id, doc.data() as QuestionDoc]),
          );
          emit();
        },
        handleError("Daily-Fragen"),
      ),
      onSnapshot(
        usersRef,
        (snapshot) => {
          const nextMembers = new Map<string, MemberLite>();
          const nextActiveMembers = new Map<string, MemberLite>();

          for (const doc of snapshot.docs) {
            const data = doc.data() as UserDoc;
            const member = {
              userId: doc.id,
              displayName: data.displayName,
              photoURL: data.photoURL ?? null,
            } satisfies MemberLite;

            nextMembers.set(doc.id, member);
            if (data.isActive) {
              nextActiveMembers.set(doc.id, member);
            }
          }

          members = nextMembers;
          activeMembers = nextActiveMembers;
          emit();
        },
        handleError("Mitglieder"),
      ),
      onSnapshot(
        query(
          privateAnswersRef,
          where("dateKey", "==", dateKey),
          where("userId", "==", authState.user.userId),
        ),
        (snapshot) => {
          myAnswers = new Map(
            snapshot.docs.map((doc) => {
              const data = doc.data() as DailyPrivateAnswerDoc;
              return [data.questionId, data as DailyAnswerDoc];
            }),
          );
          emit();
        },
        handleError("Eigene Daily-Antworten"),
      ),
      onSnapshot(
        query(answersRef, where("dateKey", "==", dateKey)),
        (snapshot) => {
          const grouped = new Map<string, DailyAnswerDoc[]>();
          for (const doc of snapshot.docs) {
            const data = doc.data() as DailyAnswerDoc;
            const list = grouped.get(data.questionId) ?? [];
            list.push(data);
            grouped.set(data.questionId, list);
          }
          allPublicAnswers = grouped;
          emit();
        },
        handleError("Öffentliche Daily-Antworten"),
      ),
      onSnapshot(
        query(memeVotesRef, where("dateKey", "==", dateKey)),
        (snapshot) => {
          const grouped = new Map<string, DailyMemeVoteDoc[]>();
          for (const doc of snapshot.docs) {
            const data = doc.data() as DailyMemeVoteDoc;
            const list = grouped.get(data.questionId) ?? [];
            list.push(data);
            grouped.set(data.questionId, list);
          }
          memeVotes = grouped;
          emit();
        },
        handleError("Meme-Votes"),
      ),
    ];

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }, [authState, isMockMode, targetDateKey]);

  return state;
}

export function mapDailyQuestion(params: {
  questionId: string;
  question: QuestionLike;
  index: number;
  total: number;
  members: Map<string, MemberLite>;
  pairing?: DailyRunItemDoc["pairing"];
}): DailyQuestion | null {
  const { questionId, question, index, total, members, pairing } = params;
  const base = {
    questionId,
    indexInRun: index,
    totalInRun: total,
    text: question.text,
    category: question.category,
  };

  switch (question.type) {
    case "single_choice":
      return {
        ...base,
        type: "single_choice",
        candidates: Array.from(members.values()),
      };
    case "multi_choice":
      return {
        ...base,
        type: "multi_choice",
        candidates: Array.from(members.values()),
      };
    case "open_text":
      return {
        ...base,
        type: "open_text",
        maxLength: 280,
      };
    case "either_or":
      return {
        ...base,
        type: "either_or",
        options: [
          question.options?.[0] ?? "Option A",
          question.options?.[1] ?? "Option B",
        ],
      };
    case "meme_caption":
      return {
        ...base,
        type: "meme_caption",
        imagePath: question.imagePath ?? "",
        maxLength: 140,
      };
    case "duel_1v1": {
      const left = pairing?.memberIds?.[0] ? members.get(pairing.memberIds[0]) : undefined;
      const right = pairing?.memberIds?.[1] ? members.get(pairing.memberIds[1]) : undefined;
      if (!left || !right) return null;
      return {
        ...base,
        type: "duel_1v1",
        left,
        right,
      };
    }
    case "duel_2v2": {
      const teamA0 = pairing?.teamA?.[0] ? members.get(pairing.teamA[0]) : undefined;
      const teamA1 = pairing?.teamA?.[1] ? members.get(pairing.teamA[1]) : undefined;
      const teamB0 = pairing?.teamB?.[0] ? members.get(pairing.teamB[0]) : undefined;
      const teamB1 = pairing?.teamB?.[1] ? members.get(pairing.teamB[1]) : undefined;
      if (!teamA0 || !teamA1 || !teamB0 || !teamB1) return null;
      return {
        ...base,
        type: "duel_2v2",
        teamA: [teamA0, teamA1],
        teamB: [teamB0, teamB1],
      };
    }
  }
}

export function mapDailyAnswerDraft(answer: DailyAnswerDoc): DailyAnswerDraft {
  switch (answer.questionType) {
    case "single_choice":
      return {
        type: "single_choice",
        questionId: answer.questionId,
        selectedUserId: answer.selectedUserId,
      };
    case "multi_choice":
      return {
        type: "multi_choice",
        questionId: answer.questionId,
        selectedUserIds: Array.isArray(answer.selectedUserIds)
          ? answer.selectedUserIds
          : [],
      };
    case "open_text":
      return {
        type: "open_text",
        questionId: answer.questionId,
        textAnswer: answer.textAnswer ?? "",
      };
    case "duel_1v1":
      return {
        type: "duel_1v1",
        questionId: answer.questionId,
        selectedSide: answer.selectedSide,
      };
    case "duel_2v2":
      return {
        type: "duel_2v2",
        questionId: answer.questionId,
        selectedTeam: answer.selectedTeam,
      };
    case "either_or":
      return {
        type: "either_or",
        questionId: answer.questionId,
        selectedOptionIndex:
          answer.selectedOptionIndex === 0 || answer.selectedOptionIndex === 1
            ? answer.selectedOptionIndex
            : undefined,
      };
    case "meme_caption":
      return {
        type: "meme_caption",
        questionId: answer.questionId,
        textAnswer: answer.textAnswer ?? "",
      };
  }
}

export function mapQuestionResult(params: {
  question: DailyQuestion;
  myAnswer?: DailyAnswerDraft;
  publicAnswers: DailyAnswerDoc[];
  memeVotes?: DailyMemeVoteDoc[];
  currentUserId?: string;
  members?: Map<string, MemberLite>;
}): QuestionResult {
  const { question, myAnswer, publicAnswers, memeVotes = [], currentUserId, members } = params;

  switch (question.type) {
    case "multi_choice": {
      const validAnswers = publicAnswers.filter(
        (answer) => Array.isArray(answer.selectedUserIds) && answer.selectedUserIds.length > 0,
      );
      const totalVoters = validAnswers.length;
      const counts = question.candidates.map((candidate) => {
        const votes = validAnswers.filter((answer) =>
          (answer.selectedUserIds ?? []).includes(candidate.userId),
        ).length;
        return {
          candidate,
          votes,
          percent: totalVoters > 0 ? Math.round((votes / totalVoters) * 100) : 0,
        };
      });
      return {
        questionType: "multi_choice",
        totalVoters,
        counts,
        voterRows: validAnswers.flatMap((answer) => {
          const voter = members?.get(answer.userId);
          if (!voter) return [];
          const targets = (answer.selectedUserIds ?? [])
            .map((targetId) =>
              question.candidates.find((candidate) => candidate.userId === targetId),
            )
            .filter((target): target is MemberLite => Boolean(target));
          return targets.map((target) => ({ voter, target }));
        }),
        myChoiceUserIds:
          myAnswer?.type === "multi_choice" ? myAnswer.selectedUserIds : undefined,
      };
    }
    case "single_choice": {
      const totalVotes = publicAnswers.length;
      const counts = question.candidates.map((candidate) => {
        const votes = publicAnswers.filter((answer) => answer.selectedUserId === candidate.userId).length;
        return {
          candidate,
          votes,
          percent: totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0,
        };
      });
        return {
          questionType: "single_choice",
            totalVotes,
          counts,
          voterRows: publicAnswers
            .map((answer) => {
              const voter = members?.get(answer.userId);
              const target = answer.selectedUserId
                ? question.candidates.find(
                    (candidate) => candidate.userId === answer.selectedUserId,
                  )
                : undefined;

              if (!voter || !target) {
                return null;
              }

              return { voter, target };
            })
            .filter((row): row is { voter: MemberLite; target: MemberLite } => row !== null),
          myChoiceUserId:
            myAnswer?.type === "single_choice" ? myAnswer.selectedUserId : undefined,
        };
    }
    case "open_text":
      return {
        questionType: "open_text",
        entries: publicAnswers
          .filter((answer) => answer.textAnswer)
          .map((answer) => ({
            text: answer.textAnswer!,
            author: members?.get(answer.userId),
          })),
      };
    case "duel_1v1": {
      const leftVotes = publicAnswers.filter((answer) => answer.selectedSide === "left").length;
      const rightVotes = publicAnswers.filter((answer) => answer.selectedSide === "right").length;
      const totalVotes = leftVotes + rightVotes;
      return {
        questionType: "duel_1v1",
        left: {
          member: question.left,
          votes: leftVotes,
          percent: totalVotes > 0 ? Math.round((leftVotes / totalVotes) * 100) : 0,
        },
        right: {
          member: question.right,
          votes: rightVotes,
          percent: totalVotes > 0 ? Math.round((rightVotes / totalVotes) * 100) : 0,
        },
        voterRows: publicAnswers
          .map((answer) => {
            const voter = members?.get(answer.userId);
            if (!voter || (answer.selectedSide !== "left" && answer.selectedSide !== "right")) {
              return null;
            }

            return { voter, side: answer.selectedSide };
          })
          .filter(
            (
              row,
            ): row is { voter: MemberLite; side: "left" | "right" } => row !== null,
          ),
        myChoice: myAnswer?.type === "duel_1v1" ? myAnswer.selectedSide : undefined,
      };
    }
    case "duel_2v2": {
      const teamAVotes = publicAnswers.filter((answer) => answer.selectedTeam === "teamA").length;
      const teamBVotes = publicAnswers.filter((answer) => answer.selectedTeam === "teamB").length;
      const totalVotes = teamAVotes + teamBVotes;
      return {
        questionType: "duel_2v2",
        teamA: {
          members: question.teamA,
          votes: teamAVotes,
          percent: totalVotes > 0 ? Math.round((teamAVotes / totalVotes) * 100) : 0,
        },
        teamB: {
          members: question.teamB,
          votes: teamBVotes,
          percent: totalVotes > 0 ? Math.round((teamBVotes / totalVotes) * 100) : 0,
        },
        voterRows: publicAnswers
          .map((answer) => {
            const voter = members?.get(answer.userId);
            if (!voter || (answer.selectedTeam !== "teamA" && answer.selectedTeam !== "teamB")) {
              return null;
            }

            return { voter, team: answer.selectedTeam };
          })
          .filter(
            (
              row,
            ): row is { voter: MemberLite; team: "teamA" | "teamB" } => row !== null,
          ),
        myChoice: myAnswer?.type === "duel_2v2" ? myAnswer.selectedTeam : undefined,
      };
    }
    case "either_or": {
      const option0Votes = publicAnswers.filter((answer) => answer.selectedOptionIndex === 0).length;
      const option1Votes = publicAnswers.filter((answer) => answer.selectedOptionIndex === 1).length;
      const totalVotes = option0Votes + option1Votes;
      return {
        questionType: "either_or",
        options: [
          {
            label: question.options[0],
            votes: option0Votes,
            percent: totalVotes > 0 ? Math.round((option0Votes / totalVotes) * 100) : 0,
          },
          {
            label: question.options[1],
            votes: option1Votes,
            percent: totalVotes > 0 ? Math.round((option1Votes / totalVotes) * 100) : 0,
          },
        ],
        voterRows: publicAnswers
          .map((answer) => {
            const voter = members?.get(answer.userId);
            const optionIndex =
              answer.selectedOptionIndex === 0 || answer.selectedOptionIndex === 1
                ? answer.selectedOptionIndex
                : undefined;

            if (!voter || optionIndex === undefined) {
              return null;
            }

            return { voter, optionIndex };
          })
          .filter(
            (row): row is { voter: MemberLite; optionIndex: 0 | 1 } => row !== null,
          ),
        myChoiceIndex:
          myAnswer?.type === "either_or" ? myAnswer.selectedOptionIndex : undefined,
      };
    }
    case "meme_caption":
      return {
        questionType: "meme_caption",
        imagePath: question.imagePath,
        entries: publicAnswers
          .filter((answer) => answer.textAnswer)
          .map((answer) => ({
            text: answer.textAnswer!,
            author: members?.get(answer.userId),
            thumbsUpCount: memeVotes.filter(
              (vote) => vote.authorUserId === answer.userId,
            ).length,
            iVoted: memeVotes.some(
              (vote) =>
                vote.authorUserId === answer.userId &&
                vote.voterUserId === currentUserId,
            ),
          })),
      };
  }
}

function getQuestionSource(
  item: DailyRunItemDoc,
  questions: Map<string, QuestionDoc>,
): QuestionLike | null {
  const liveQuestion = questions.get(item.questionId);
  if (liveQuestion) {
    return liveQuestion;
  }

  if (!item.questionSnapshot) {
    return null;
  }

  return {
    text: item.questionSnapshot.text,
    category: item.questionSnapshot.category,
    type: item.type,
    options: item.questionSnapshot.options,
    imagePath: item.questionSnapshot.imagePath,
  };
}
