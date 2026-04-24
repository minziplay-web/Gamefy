# Claude Handoff

## Kontext

Dieses Projekt ist eine private mobile-first Web-App fuer genau eine feste Freundesgruppe. Backend und Datenmodell orientieren sich an `docs/backend-spec-v1.md`.

Bitte richte alle UI-Entscheidungen, Screen-States und Types strikt an dieser Spezifikation aus.

## Stack fuer UI

- Next.js
- TypeScript
- Tailwind CSS
- mobile-first

## Wichtige Produktregeln

- Keine Gruppen-Entitaet in V1
- Eine feste Freundesgruppe, die App selbst ist die Gruppe
- Login per Magic Link
- Persistente Profile und Stats, nichts darf nur temporaer sein
- Zeitzone fest `Europe/Berlin`
- Daily reset um `00:00 Europe/Berlin`
- Dirty ist normale Kategorie
- Duel-Pairings werden zur Laufzeit erzeugt und nicht in Fragen codiert

## Screens fuer V1

1. Onboarding
2. Home
3. Daily
4. Lobby
5. Profil
6. Admin

## Was du liefern sollst

### 1. UI-Types

Bitte skizziere TypeScript-Types fuer UI-Zustand und View-Models, nicht fuer rohe Firestore-Dokumente.

Wichtig:

- Types sollen zur Backend-Spezifikation passen
- keine Fantasie-Felder
- alle wesentlichen `loading`, `empty`, `error` States mitdenken

Gewuenschte Bereiche:

- `AppUser`
- `AuthState`
- `OnboardingState`
- `HomeViewState`
- `DailyViewState`
- `DailyQuestionCardState`
- `LobbyViewState`
- `LiveQuestionState`
- `RevealState`
- `ProfileViewState`
- `AdminViewState`

### 2. Screen-Spezifikation

Bitte pro Screen liefern:

- Ziel
- Hauptkomponenten
- Mobile Layout
- Primare CTA
- Secondary Actions
- Loading State
- Empty State
- Error State

### 3. UI-Komponentenliste

Bitte eine sinnvolle erste Komponentenliste definieren, z. B.:

- `AppShell`
- `BottomNav`
- `DailyProgress`
- `QuestionCard`
- `VoteOption`
- `CountdownRing`
- `RevealResults`
- `ProfileStatGrid`
- `AvatarRow`
- `AdminQuestionTable`

### 4. Inhaltsformat fuer Fragen

Neue Fragen bitte in genau diesem JSON-Format liefern:

```json
[
  {
    "text": "Wer von uns wuerde am ehesten spontan einen Flug buchen?",
    "category": "pure_fun",
    "type": "single_choice",
    "anonymous": false,
    "targetMode": "both"
  },
  {
    "text": "Was schaetzt du am meisten an unserer Freundesgruppe?",
    "category": "deep_talk",
    "type": "open_text",
    "anonymous": true,
    "targetMode": "daily"
  },
  {
    "text": "Wer ist spontaner?",
    "category": "hot_takes",
    "type": "duel_1v1",
    "anonymous": true,
    "targetMode": "both"
  },
  {
    "text": "Wuerdest du eher nie wieder feiern oder nie wieder verreisen?",
    "category": "would_you_rather",
    "type": "either_or",
    "anonymous": true,
    "targetMode": "both",
    "options": ["Nie wieder feiern", "Nie wieder verreisen"]
  }
]
```

## Leitplanken fuer UI

- mobile-first
- grosse Tap-Flaechen
- max. eine primaere Aktion pro Screen
- einfache Navigation
- keine Desktop-Sidebar-Struktur
- Karten-UI statt Tabellenfokus
- Profil und Stats muessen sich persistent und persoenlich anfuehlen

## Wichtig fuer Profil/Stats

Bitte UI so denken, dass User nachvollziehen koennen:

- welche Dailys sie beantwortet haben
- welchen Fortschritt sie haben
- welche oeffentlichen Stats dauerhaft gespeichert sind
- welche Historie persoenlich sichtbar ist

Die App soll sich nicht wie ein temporaeres Party-Spiel anfuehlen, sondern wie ein dauerhaftes Gruppenarchiv mit Spielmechanik.
