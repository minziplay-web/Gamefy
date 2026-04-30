"use client";

import type { CustomDailyQuestionDraft } from "@/lib/types/frontend";

import { getFirebaseServices } from "@/lib/firebase/client";

export async function submitCustomDailyQuestion(
  draft: CustomDailyQuestionDraft,
) {
  const { auth } = getFirebaseServices();
  const user = auth?.currentUser;

  if (!user) {
    throw new Error("Nicht eingeloggt.");
  }

  const idToken = await user.getIdToken();
  const response = await fetch("/api/daily/custom-question", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(draft),
  });

  const payload = (await response.json()) as {
    ok?: boolean;
    error?: string;
  };

  if (!response.ok || payload.ok !== true) {
    throw new Error(
      mapCustomQuestionError(payload.error),
    );
  }
}

function mapCustomQuestionError(code?: string) {
  switch (code) {
    case "unauthorized":
      return "Du bist gerade nicht eingeloggt.";
    case "inactive":
      return "Dein Account ist aktuell nicht aktiv.";
    case "invalid_type":
      return "Dieser Fragetyp wird für Trophy-Fragen nicht unterstützt.";
    case "question_too_short":
      return "Deine Frage ist noch zu kurz.";
    case "missing_options":
      return "Bitte fülle mindestens zwei Antwortmöglichkeiten aus.";
    case "too_many_options":
      return "Bitte nutze maximal sechs Antwortmöglichkeiten.";
    case "no_trophies_left":
      return "Du hast gerade keine freie Trophy für eine eigene Frage.";
    case "already_created_for_target_daily":
      return "Für das nächste Daily hast du schon eine eigene Frage eingereicht.";
    default:
      return "Deine Trophy-Frage konnte nicht gespeichert werden.";
  }
}
