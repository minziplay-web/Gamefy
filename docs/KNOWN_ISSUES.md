# Known Issues

Stand: 2026-04-29

## Aktuelle Check-Ergebnisse

`npm run build`:

- Erfolgreich.
- Next.js 16.2.4 kompiliert, TypeScript laeuft durch, 14 App-Routen werden gebaut.

`npm run lint`:

- Erfolgreich ohne Errors oder Warnings.

## Behobene Lint-Themen

Am 2026-04-29 bereinigt:

- React `set-state-in-effect` in Daily/Home/Meme-Image.
- `prefer-const` in `admin-actions.ts`.
- Unused Values in Daily-Completion, Daily-Screen, Admin-Actions, Home und Live-Actions.

`npm run lint` ist seitdem wieder sauber.

## Spec-Drift

`docs/backend-spec-v1.md` und `docs/frontend-spec-v1.md` beschreiben nicht mehr vollstaendig den Ist-Stand:

- Spec nennt Magic-Link-only Auth; Code nutzt Google und E-Mail/Passwort.
- Spec kennt `targetMode: "daily" | "live" | "both"`; Code-Typ ist aktuell `targetMode: "daily"`.
- Spec nennt keine Kategorien `custom`, `conspiracy`, `meme_it`.
- Spec nennt keine Typen `multi_choice` und `meme_caption`.
- Spec beschreibt anonyme Aggregat-Collections, die im aktuellen Code nicht als Collections verwendet werden.
- Aktueller Code hat Trophy-/Custom-Daily-Logik, First-Answer-Locks, Meme-Votes und Run-Snapshots.

Entscheidung vom 2026-04-29: Anonyme Fragen/Votes sind kein Produktziel mehr. Backend- und Frontend-Spec sind als historische V1-Spec markiert.

## Historische Anonymitaets-Spec

Die alte Backend-Spec fordert, dass anonyme Votes nicht auf einzelne Voter rueckfuehrbar sind. Diese Anforderung wurde verworfen. Mijija unterstuetzt keine anonymen Fragen/Votes mehr.

Konsequenz:

- `dailyAnonymousAggregates`, `liveAnonymousAggregates` und `anonymous: true` sollen nicht neu implementiert werden.
- Bestehende Ergebnis-View-Models duerfen `voterRows` und Autor-/Voter-Bezug enthalten.
- Falls noch UI-Texte, Imports, Mocks oder alte Daten `anonymous` enthalten, sollten sie bei Gelegenheit entfernt oder ignoriert werden.

Empfehlung: Alte Spec-/Mock-Stellen mit `anonymous` bei Gelegenheit bereinigen, damit kuenftige Agenten daraus keine neue Privacy-Anforderung ableiten.

## Clientseitige Admin-Actions

`src/lib/firebase/admin-actions.ts` ist ein breites clientseitiges Modul fuer Admin-Operationen. Das ist nur tragfaehig, wenn `firestore.rules` jede Operation streng anhand der Rolle absichert.

Risiko:

- Client-Code kann nicht als Vertrauensgrenze dienen.
- Bulk-Delete, Run-Replace, Question-Import und User-Deaktivierung muessen serverseitig oder per Rules wasserdicht abgesichert sein.

Empfehlung: Rules gezielt gegen die Admin-Actions testen und mittelfristig kritische Mutationen in serverseitige API-Routes oder Cloud Functions verschieben.

## Realtime-Query-Kosten

Mehrere Hooks lesen breite Datenmengen:

- Home liest alle `dailyAnswers`, alle `dailyMemeVotes`, alle Runs, Fragen und User.
- Daily liest die Frage-Collection vollstaendig.
- Admin liest komplette Admin-Collections.

Das ist fuer eine feste kleine Gruppe vermutlich akzeptabel, kann aber bei wachsender Historie langsam und teuer werden.

Empfehlung:

- Home- und Profil-Queries nach Datum/User begrenzen.
- Aggregierte Stats konsequenter nutzen.
- Alte Runs/Antworten fuer Recaps gezielt paginieren.

## Datenmodell-Komplexitaet Bei Daily-Runs

Der Code kennt `runId`, `runNumber`, kanonische Runs, `dateKey`, `questionSnapshot`, `items`, `dailyLocked`, `consumedInDailyDateKey` und parallele Antwort-Collections. Einige Pfade filtern kanonische Runs mit `runNumber <= 1 || runId === dateKey`.

Risiko:

- Mehrere Dailys pro Tag oder alte migrierte Runs koennen in UI, Cleanup und Antwortzuordnung auseinanderlaufen.
- Loesch-/Replace-Operationen muessen `runId ?? dateKey` konsistent behandeln.

Empfehlung: Eine kurze Migrations-/Invarianznotiz fuer Daily-Runs ergaenzen und Tests fuer Replace, Extend, Delete und Past-Dailies schreiben.

## Secrets Und Beispiel-Env

`.env.live.example` enthaelt Live-Firebase-Web-Konfiguration. Firebase-Web-Keys sind keine Admin-Secrets, aber sie identifizieren das Live-Projekt.

Empfehlung:

- Keine Admin-Secrets in Beispiel-Dateien eintragen.
- Live-Web-Konfiguration bewusst behandeln und bei externem Teilen des Repos pruefen.

## Fehlende Automatisierte Tests

Im `package.json` gibt es aktuell kein `test`-Script. Es existieren Preview- und Capture-Skripte, aber keine Unit-/Integrationstests fuer:

- Daily-Run-Generator.
- Reveal-Policy.
- Trophy-Verbrauch.
- Custom-Daily-API.
- Firestore-Rules.
- Admin-Run-Replace/Delete.

Empfehlung: Zuerst reine Unit-Tests fuer `src/lib/daily/daily-run-generator.ts`, `src/lib/mapping/daily.ts`, `src/lib/mapping/stats.ts` und Payload-Guards einfuehren.
