import type { FirestoreError } from "firebase/firestore";

function describeCode(code?: string) {
  switch (code) {
    case "permission-denied":
      return "Zugriff wurde von Firestore abgelehnt.";
    case "unauthenticated":
      return "Die Session ist nicht mehr gueltig.";
    case "unavailable":
      return "Firestore ist gerade nicht erreichbar.";
    case "failed-precondition":
      return "Firestore meldet fehlende Voraussetzungen fuer diese Abfrage.";
    default:
      return "Firestore konnte die Daten nicht laden.";
  }
}

export function formatListenerError(scope: string, error: unknown) {
  const firestoreError = error as FirestoreError | undefined;
  const details =
    firestoreError?.message && firestoreError.message !== firestoreError.code
      ? ` ${firestoreError.message}`
      : "";

  return `${scope}: ${describeCode(firestoreError?.code)}${details}`.trim();
}
