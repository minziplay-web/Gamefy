# Backend Spec V1

## Ziel

Private mobile-first Web-App fuer eine feste Freundesgruppe. Keine Multi-Tenant-Logik, keine Gruppen-Entitaet, keine temporaeren Identitaeten.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Firebase Auth
- Cloud Firestore
- Vercel

## Produktentscheidungen

- Genau eine feste Freundesgruppe
- Zeitzone ist fest `Europe/Berlin`
- Daily reset um `00:00 Europe/Berlin`
- Profile, Antworten, Historie und Stats sind dauerhaft gespeichert
- `dirty` ist normale Kategorie
- Duel-Pairings werden zur Laufzeit erzeugt
- Anonyme Votes duerfen nicht auf einzelne Voter rueckfuehrbar sein

## Auth

### V1 Entscheidung

- Login per Firebase Magic Link per E-Mail
- Keine Passwoerter
- Keine nur lokal gespeicherten Gast-Identitaeten

### Flow

1. User oeffnet die App
2. User gibt E-Mail ein
3. Firebase sendet Magic Link
4. Nach erfolgreichem Login:
   - wenn `users/{userId}.onboardingCompleted === false`: Onboarding
   - sonst direkt Home
5. Onboarding speichert Anzeigename und optional Profilbild

### Konsequenz

- Identitaet bleibt geraeteuebergreifend erhalten
- Stats und Historie sind dauerhaft an Firebase Auth UID gebunden

## Rollen

### Rollen in V1

- `admin`
- `member`

### Admin darf

- Fragen verwalten/importieren
- Daily-Konfiguration aendern
- Daily-Runs erzeugen
- Live-Lobbys hosten und steuern
- App-Konfiguration aendern

## Kategorien

- `hot_takes`
- `pure_fun`
- `deep_talk`
- `memories`
- `career_life`
- `relationships`
- `hobbies_interests`
- `dirty`
- `group_knowledge`
- `would_you_rather`

## Fragetypen

- `single_choice`
- `open_text`
- `duel_1v1`
- `duel_2v2`
- `either_or`

## Firestore Collections

- `users`
- `questions`
- `dailyRuns`
- `dailyAnswers`
- `dailyAnonymousAggregates`
- `liveSessions`
- `liveAnswers`
- `liveAnonymousAggregates`
- `userStats`
- `appConfig`

## Collection Details

### users/{userId}

```ts
{
  email: string,
  displayName: string,
  photoURL: string | null,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastSeenAt: Timestamp,
  role: "admin" | "member",
  onboardingCompleted: boolean,
  isActive: boolean
}
```

Zweck:

- Profilseite
- Rollen und Zugriffsrechte
- Mitgliedsliste

### questions/{questionId}

```ts
{
  text: string,
  category:
    | "hot_takes"
    | "pure_fun"
    | "deep_talk"
    | "memories"
    | "career_life"
    | "relationships"
    | "hobbies_interests"
    | "dirty"
    | "group_knowledge"
    | "would_you_rather",
  type:
    | "single_choice"
    | "open_text"
    | "duel_1v1"
    | "duel_2v2"
    | "either_or",
  anonymous: boolean,
  targetMode: "daily" | "live" | "both",
  active: boolean,
  options?: string[],
  createdAt: Timestamp,
  createdBy: string
}
```

Regeln:

- Duel-Fragen enthalten keine festen Personen
- `options` nur bei `either_or`

### dailyRuns/{dateKey}

Dokument-ID ist das Berliner Tagesdatum, z. B. `2026-04-23`.

```ts
{
  dateKey: string,
  timezone: "Europe/Berlin",
  status: "scheduled" | "active" | "closed",
  questionCount: number,
  revealPolicy: "after_answer" | "after_day_end",
  questionIds: string[],
  items: Array<{
    questionId: string,
    type: "single_choice" | "open_text" | "duel_1v1" | "duel_2v2" | "either_or",
    pairing?: {
      memberIds?: [string, string],
      teamA?: [string, string],
      teamB?: [string, string]
    }
  }>,
  createdAt: Timestamp,
  createdBy: string
}
```

Wichtig:

- Pairings werden beim Daily-Run zentral festgelegt
- Damit ist die Daily fuer alle User identisch und spaeter nachvollziehbar

### dailyAnswers/{answerId}

Nur fuer nicht-anonyme Antworten mit User-Bezug.

```ts
{
  dateKey: string,
  questionId: string,
  userId: string,
  questionType:
    | "single_choice"
    | "open_text"
    | "duel_1v1"
    | "duel_2v2"
    | "either_or",
  anonymous: false,
  selectedUserId?: string,
  selectedOptionIndex?: number,
  selectedSide?: "left" | "right",
  selectedTeam?: "teamA" | "teamB",
  textAnswer?: string,
  duelContext?: {
    memberIds?: string[],
    teamA?: string[],
    teamB?: string[]
  },
  createdAt: Timestamp
}
```

Zweck:

- persoenliche Historie
- oeffentliche Ergebnisansicht
- nachvollziehbare Stats aus nicht-anonymen Daten

### dailyAnonymousAggregates/{dateKey_questionId}

Nur aggregierte anonyme Ergebnisse, ohne rueckverfolgbaren Voter.

```ts
{
  dateKey: string,
  questionId: string,
  questionType:
    | "single_choice"
    | "open_text"
    | "duel_1v1"
    | "duel_2v2"
    | "either_or",
  counts?: Record<string, number>,
  textAnswers?: string[],
  duelContext?: {
    memberIds?: string[],
    teamA?: string[],
    teamB?: string[]
  },
  updatedAt: Timestamp
}
```

Regel:

- Keine `userId`
- Keine Rueckverfolgung auf Einzelperson

### liveSessions/{sessionId}

```ts
{
  hostUserId: string,
  code: string,
  status: "lobby" | "question" | "reveal" | "finished",
  categories: string[],
  questionIds: string[],
  currentQuestionIndex: number,
  questionDurationSec: number,
  revealDurationSec: number,
  createdAt: Timestamp,
  startedAt: Timestamp | null,
  phaseStartedAt: Timestamp | null,
  finishedAt: Timestamp | null,
  items: Array<{
    questionId: string,
    type: "single_choice" | "open_text" | "duel_1v1" | "duel_2v2" | "either_or",
    pairing?: {
      memberIds?: [string, string],
      teamA?: [string, string],
      teamB?: [string, string]
    }
  }>
}
```

### liveSessions/{sessionId}/participants/{userId}

```ts
{
  userId: string,
  displayName: string,
  photoURL: string | null,
  joinedAt: Timestamp,
  isHost: boolean,
  connected: boolean
}
```

### liveAnswers/{answerId}

Nur fuer nicht-anonyme Antworten mit User-Bezug.

```ts
{
  sessionId: string,
  questionId: string,
  questionIndex: number,
  userId: string,
  anonymous: false,
  selectedUserId?: string,
  selectedOptionIndex?: number,
  selectedSide?: "left" | "right",
  selectedTeam?: "teamA" | "teamB",
  textAnswer?: string,
  duelContext?: {
    memberIds?: string[],
    teamA?: string[],
    teamB?: string[]
  },
  submittedAt: Timestamp
}
```

### liveAnonymousAggregates/{sessionId_questionIndex}

```ts
{
  sessionId: string,
  questionId: string,
  questionIndex: number,
  questionType:
    | "single_choice"
    | "open_text"
    | "duel_1v1"
    | "duel_2v2"
    | "either_or",
  counts?: Record<string, number>,
  textAnswers?: string[],
  duelContext?: {
    memberIds?: string[],
    teamA?: string[],
    teamB?: string[]
  },
  updatedAt: Timestamp
}
```

### userStats/{userId}

Persistente aggregierte Profilwerte. Rohdaten bleiben trotzdem bestehen.

```ts
{
  userId: string,
  daily: {
    answeredCount: number,
    streakCurrent: number,
    streakBest: number,
    firstAnswerCount: number
  },
  live: {
    roundsPlayed: number,
    roundsHosted: number,
    answersSubmitted: number
  },
  duels: {
    wins: number,
    losses: number
  },
  publicVotesReceived: {
    total: number,
    byCategory: Record<string, number>
  },
  categoryActivity: Record<string, number>,
  updatedAt: Timestamp
}
```

Regeln:

- basiert nur auf nicht-anonymen oder explizit erlaubten Daten
- anonyme Votes zaehlen nicht in rueckverfolgbare Person-Stats

### appConfig/main

```ts
{
  timezone: "Europe/Berlin",
  dailyQuestionCount: number,
  dailyRevealPolicy: "after_answer" | "after_day_end",
  onboardingEnabled: boolean,
  liveDefaultQuestionDurationSec: number,
  liveDefaultRevealDurationSec: number
}
```

## Persistenzstrategie

Folgende Daten sind dauerhaft:

- User-Profile
- nicht-anonyme Daily-Antworten
- nicht-anonyme Live-Antworten
- anonyme Aggregationen
- Live-Teilnahmen
- Daily-Runs
- User-Stats

Die Wahrheit liegt in Firestore, nicht im Browser-Storage.

## Statistikstrategie

### Rohdaten

Bleiben dauerhaft gespeichert fuer:

- Historie
- Auditierbarkeit
- spaeteres Nachberechnen neuer Stats

### Aggregierte Stats

Werden zusaetzlich gepflegt fuer schnelle Profilseiten:

- Daily-Streak
- beantwortete Fragen
- Live-Runden
- Duel W/L
- oeffentliche Votes erhalten

### Anonyme Votes

- nie mit `userId` querbar
- nur aggregiert
- nicht fuer "wer hat mich wie oft gewaehlt"

## Daily-Auswahl

V1 Vorschlag:

- Admin konfiguriert Anzahl
- System zieht zufaellig aus aktivem Fragenpool
- Filter:
  - `active === true`
  - `targetMode === "daily" || targetMode === "both"`

Spaeter moeglich:

- Kategorie-Gewichtung
- manuelle Pin-Fragen

## Duel-Pairing

Nicht clientseitig.

Stattdessen zentral beim Erzeugen:

- im Daily: beim Erstellen von `dailyRuns/{dateKey}`
- im Live-Modus: beim Vorbereiten der `liveSessions/{sessionId}.items`

Vorteile:

- kein Manipulationsrisiko
- fuer alle User identisch
- in Historie und Ergebnis sauber nachvollziehbar

## Countdown

Kein sekundenweises Firestore-Schreiben.

Stattdessen:

- Firestore schreibt `phaseStartedAt`
- Client berechnet `remaining = phaseStartedAt + duration - now`
- Firestore aendert nur Phasenstatus

## Security Rules Richtung

- nur eingeloggte User duerfen App-Daten lesen
- User duerfen nur ihr eigenes Profil aktualisieren
- User duerfen nur eigene nicht-anonyme Antworten schreiben
- Admin darf Fragen, Daily-Runs, Live-Sessions und App-Config verwalten
- anonyme Daten nur ueber kontrollierte Schreibpfade aggregieren

## V1 Screens

- Onboarding
- Home
- Daily
- Lobby
- Profil
- Admin
