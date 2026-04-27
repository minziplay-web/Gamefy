import type { DailyAnswerDraft, DailyQuestion } from "@/lib/types/frontend";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertValidDraftForQuestion(
  question: DailyQuestion,
  draft: DailyAnswerDraft,
) {
  assert(
    draft.questionId === question.questionId,
    "Antwortentwurf und Frage gehören nicht zusammen.",
  );
  assert(
    draft.type === question.type,
    "Antwortentwurf passt nicht zum Fragetyp.",
  );

  switch (question.type) {
    case "single_choice":
      assert(
        draft.type === "single_choice",
        "Single-Choice-Antwort hat den falschen Typ.",
      );
      assert(
        !!draft.selectedUserId,
        "Für diese Frage muss eine Person ausgewählt werden.",
      );
      assert(
        question.candidates.some((candidate) => candidate.userId === draft.selectedUserId),
        "Die ausgewählte Person gehört nicht zu dieser Frage.",
      );
      return;

    case "multi_choice": {
      assert(
        draft.type === "multi_choice",
        "Multi-Choice-Antwort hat den falschen Typ.",
      );
      assert(
        Array.isArray(draft.selectedUserIds) && draft.selectedUserIds.length > 0,
        "Bitte mindestens eine Person auswählen.",
      );
      const candidateIds = new Set(question.candidates.map((c) => c.userId));
      const uniqueIds = new Set(draft.selectedUserIds);
      assert(
        uniqueIds.size === draft.selectedUserIds.length,
        "Doppelte Auswahl in der Antwort.",
      );
      for (const id of draft.selectedUserIds) {
        assert(
          candidateIds.has(id),
          "Eine ausgewählte Person gehört nicht zu dieser Frage.",
        );
      }
      return;
    }

    case "open_text":
      assert(
        draft.type === "open_text",
        "Open-Text-Antwort hat den falschen Typ.",
      );
      assert(
        draft.textAnswer.trim().length > 0,
        "Textantwort darf nicht leer sein.",
      );
      assert(
        draft.textAnswer.trim().length <= question.maxLength,
        "Textantwort ist länger als erlaubt.",
      );
      return;

    case "duel_1v1":
      assert(
        draft.type === "duel_1v1",
        "Duel-1v1-Antwort hat den falschen Typ.",
      );
      assert(
        draft.selectedSide === "left" || draft.selectedSide === "right",
        "Bei diesem Duel muss links oder rechts gewählt werden.",
      );
      return;

    case "duel_2v2":
      assert(
        draft.type === "duel_2v2",
        "Duel-2v2-Antwort hat den falschen Typ.",
      );
      assert(
        draft.selectedTeam === "teamA" || draft.selectedTeam === "teamB",
        "Bei diesem Duel muss Team A oder Team B gewählt werden.",
      );
      return;

    case "either_or":
      assert(
        draft.type === "either_or",
        "Either-Or-Antwort hat den falschen Typ.",
      );
      assert(
        draft.selectedOptionIndex === 0 || draft.selectedOptionIndex === 1,
        "Bei dieser Frage muss Option 0 oder 1 gewählt werden.",
      );
      return;

    case "meme_caption":
      assert(
        draft.type === "meme_caption",
        "Meme-Antwort hat den falschen Typ.",
      );
      assert(
        draft.textAnswer.trim().length > 0,
        "Bildunterschrift darf nicht leer sein.",
      );
      assert(
        draft.textAnswer.trim().length <= question.maxLength,
        "Bildunterschrift ist länger als erlaubt.",
      );
      return;
  }
}
