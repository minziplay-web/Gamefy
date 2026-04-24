"use client";

import { onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-context";
import {
  dailyAnswersCollection,
  dailyAnonymousAggregatesCollection,
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
  DailyAnonymousAggregateDoc,
  DailyPrivateAnswerDoc,
  DailyRunItemDoc,
  DailyRunDoc,
  QuestionDoc,
  UserDoc,
} from "@/lib/types/firestore";

export function useDailyViewState(): DailyViewState {
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

    const dateKey = berlinDateKey();
    const runRef = dailyRunDoc(dateKey);
    const answersRef = dailyAnswersCollection();
    const privateAnswersRef = dailyPrivateAnswersCollection();
    const aggregatesRef = dailyAnonymousAggregatesCollection();
    const questionsRef = questionsCollection();
    const usersRef = usersCollection();

    if (
      !runRef ||
      !answersRef ||
      !privateAnswersRef ||
      !aggregatesRef ||
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
    let myAnswers = new Map<string, DailyAnswerDoc>();
    let allPublicAnswers = new Map<string, DailyAnswerDoc[]>();
    let anonymousAggregates = new Map<string, DailyAnonymousAggregateDoc>();

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
        activeMemberIds: new Set(members.keys()),
      });

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

      const cards = validatedRun.playableItems.reduce<DailyQuestionCardState[]>(
        (acc, item, index) => {
        const questionDoc = questions.get(item.questionId);
        if (!questionDoc) {
          return acc;
        }

        const question = mapDailyQuestion({
          questionId: item.questionId,
          question: questionDoc,
          index,
          total: validatedRun.playableItems.length,
          members,
          pairing: item.pairing,
        });

        if (!question) {
          return acc;
        }

        const myAnswerDoc = myAnswers.get(item.questionId);
        const myAnswer = myAnswerDoc ? mapDailyAnswerDraft(myAnswerDoc) : undefined;
        const reveal = shouldReveal({
          revealPolicy: run.revealPolicy,
          runStatus: effectiveRunStatus,
          dateKey: run.dateKey,
          hasOwnAnswer: Boolean(myAnswer),
        });

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
              anonymousAggregate: anonymousAggregates.get(item.questionId),
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
        query(questionsRef, where("active", "==", true)),
        (snapshot) => {
          questions = new Map(
            snapshot.docs.map((doc) => [doc.id, doc.data() as QuestionDoc]),
          );
          emit();
        },
        handleError("Daily-Fragen"),
      ),
      onSnapshot(
        query(usersRef, where("isActive", "==", true)),
        (snapshot) => {
          members = new Map(
            snapshot.docs.map((doc) => [
              doc.id,
              {
                userId: doc.id,
                displayName: (doc.data() as UserDoc).displayName,
                photoURL: (doc.data() as UserDoc).photoURL ?? null,
              } satisfies MemberLite,
            ]),
          );
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
              return [
                data.questionId,
                {
                  ...data,
                  anonymous: false,
                } as DailyAnswerDoc,
              ];
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
        query(aggregatesRef, where("dateKey", "==", dateKey)),
        (snapshot) => {
          anonymousAggregates = new Map(
            snapshot.docs.map((doc) => {
              const data = doc.data() as DailyAnonymousAggregateDoc;
              return [data.questionId, data];
            }),
          );
          emit();
        },
        handleError("Anonyme Daily-Ergebnisse"),
      ),
    ];

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }, [authState, isMockMode]);

  return state;
}

export function mapDailyQuestion(params: {
  questionId: string;
  question: QuestionDoc;
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
    anonymous: question.anonymous,
  };

  switch (question.type) {
    case "single_choice":
      return {
        ...base,
        type: "single_choice",
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
  }
}

export function mapQuestionResult(params: {
  question: DailyQuestion;
  myAnswer?: DailyAnswerDraft;
  publicAnswers: DailyAnswerDoc[];
  anonymousAggregate?: DailyAnonymousAggregateDoc;
  members?: Map<string, MemberLite>;
}): QuestionResult {
  const { question, myAnswer, publicAnswers, anonymousAggregate, members } = params;

  switch (question.type) {
    case "single_choice": {
      const totalVotes = question.anonymous
        ? Object.values(anonymousAggregate?.counts ?? {}).reduce((sum, count) => sum + count, 0)
        : publicAnswers.length;
      const counts = question.candidates.map((candidate) => {
        const votes = question.anonymous
          ? anonymousAggregate?.counts?.[candidate.userId] ?? 0
          : publicAnswers.filter((answer) => answer.selectedUserId === candidate.userId).length;
        return {
          candidate,
          votes,
          percent: totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0,
        };
      });
        return {
          questionType: "single_choice",
          anonymous: question.anonymous,
          totalVotes,
          counts,
          voterRows: question.anonymous
            ? undefined
            : publicAnswers
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
        anonymous: question.anonymous,
        entries: question.anonymous
          ? (anonymousAggregate?.textAnswers ?? []).map((text) => ({ text }))
          : publicAnswers
              .filter((answer) => answer.textAnswer)
              .map((answer) => ({ text: answer.textAnswer! })),
      };
    case "duel_1v1": {
      const leftVotes = question.anonymous
        ? anonymousAggregate?.counts?.left ?? 0
        : publicAnswers.filter((answer) => answer.selectedSide === "left").length;
      const rightVotes = question.anonymous
        ? anonymousAggregate?.counts?.right ?? 0
        : publicAnswers.filter((answer) => answer.selectedSide === "right").length;
      const totalVotes = leftVotes + rightVotes;
      return {
        questionType: "duel_1v1",
        anonymous: question.anonymous,
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
        myChoice: myAnswer?.type === "duel_1v1" ? myAnswer.selectedSide : undefined,
      };
    }
    case "duel_2v2": {
      const teamAVotes = question.anonymous
        ? anonymousAggregate?.counts?.teamA ?? 0
        : publicAnswers.filter((answer) => answer.selectedTeam === "teamA").length;
      const teamBVotes = question.anonymous
        ? anonymousAggregate?.counts?.teamB ?? 0
        : publicAnswers.filter((answer) => answer.selectedTeam === "teamB").length;
      const totalVotes = teamAVotes + teamBVotes;
      return {
        questionType: "duel_2v2",
        anonymous: question.anonymous,
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
        myChoice: myAnswer?.type === "duel_2v2" ? myAnswer.selectedTeam : undefined,
      };
    }
    case "either_or": {
      const option0Votes = question.anonymous
        ? anonymousAggregate?.counts?.option_0 ?? 0
        : publicAnswers.filter((answer) => answer.selectedOptionIndex === 0).length;
      const option1Votes = question.anonymous
        ? anonymousAggregate?.counts?.option_1 ?? 0
        : publicAnswers.filter((answer) => answer.selectedOptionIndex === 1).length;
      const totalVotes = option0Votes + option1Votes;
      return {
        questionType: "either_or",
        anonymous: question.anonymous,
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
        myChoiceIndex:
          myAnswer?.type === "either_or" ? myAnswer.selectedOptionIndex : undefined,
      };
    }
  }
}
