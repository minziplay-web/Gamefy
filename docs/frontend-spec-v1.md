# Frontend Spec V1

Referenz: `docs/backend-spec-v1.md`, `docs/claude-handoff.md`.

Diese Datei definiert UI-Types, Screen-Verhalten, Komponentenbaum und Mock-Daten fuer das V1-Frontend. Die Types sind View-Models fuer das Frontend, nicht die Firestore-Dokumente selbst. Ein Mapping-Layer im Frontend baut die View-Models aus den Firestore-Dokumenten (z. B. ersetzt `pairing.memberIds` durch `MemberLite`-Objekte aus der `users`-Collection).

---

## 1. UI Types

Ein einziger Type-Block, der die gesamte V1-Oberflaeche abdeckt. Alles was das Backend nicht liefert, wird im View-Layer berechnet oder aus anderen Collections angereichert.

```ts
// ---------------------------------------------------------
// Foundational
// ---------------------------------------------------------

export type UserId = string;
export type QuestionId = string;
export type SessionId = string;
export type DateKey = string; // "YYYY-MM-DD" in Europe/Berlin

export type Category =
  | "hot_takes"
  | "pure_fun"
  | "deep_talk"
  | "memories"
  | "career_life"
  | "relationships"
  | "hobbies_interests"
  | "dirty"
  | "group_knowledge"
  | "would_you_rather";

export type QuestionType =
  | "single_choice"
  | "open_text"
  | "duel_1v1"
  | "duel_2v2"
  | "either_or";

export type UserRole = "admin" | "member";

export type TargetMode = "daily" | "live" | "both";

export type RevealPolicy = "after_answer" | "after_day_end";

export interface MemberLite {
  userId: UserId;
  displayName: string;
  photoURL: string | null;
}

// ---------------------------------------------------------
// AppUser
// ---------------------------------------------------------

export interface AppUser {
  userId: UserId;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  onboardingCompleted: boolean;
}

// ---------------------------------------------------------
// AuthState
// ---------------------------------------------------------

export type AuthState =
  | { status: "initializing" }
  | { status: "unauthenticated" }
  | { status: "requesting_link"; email: string }
  | { status: "link_sent"; email: string }
  | { status: "verifying_link" }
  | { status: "authenticated"; user: AppUser }
  | { status: "error"; message: string; recoverable: boolean };

// ---------------------------------------------------------
// OnboardingState
// ---------------------------------------------------------

export interface OnboardingDraft {
  displayName: string;
  photoFile: File | null;
  photoPreviewUrl: string | null;
}

export type OnboardingState =
  | { status: "idle"; draft: OnboardingDraft; validation: OnboardingValidation }
  | { status: "uploading_photo"; draft: OnboardingDraft; progress: number }
  | { status: "submitting"; draft: OnboardingDraft }
  | { status: "completed" }
  | { status: "error"; draft: OnboardingDraft; message: string };

export interface OnboardingValidation {
  displayNameError: string | null;
  photoError: string | null;
  canSubmit: boolean;
}

// ---------------------------------------------------------
// HomeViewState
// ---------------------------------------------------------

export interface DailyTeaser {
  dateKey: DateKey;
  totalQuestions: number;
  answeredByMe: number;
  status: "scheduled" | "active" | "closed";
  revealPolicy: RevealPolicy;
}

export interface LiveSessionTeaser {
  sessionId: SessionId;
  code: string;
  hostDisplayName: string;
  participantCount: number;
  phase: "lobby" | "question" | "reveal" | "finished";
  iAmParticipant: boolean;
}

export interface HomeGreeting {
  displayName: string;
  localDateLabel: string; // "Donnerstag, 23. April"
  streakCurrent: number;
}

export type HomeViewState =
  | { status: "loading" }
  | {
      status: "ready";
      greeting: HomeGreeting;
      dailyTeaser: DailyTeaser | null;
      activeLiveSession: LiveSessionTeaser | null;
      canHostLive: boolean; // role === "admin"
      showAdminEntry: boolean; // role === "admin"
    }
  | { status: "error"; message: string };

// ---------------------------------------------------------
// Daily
// ---------------------------------------------------------

interface DailyQuestionBase {
  questionId: QuestionId;
  indexInRun: number;
  totalInRun: number;
  text: string;
  category: Category;
  anonymous: boolean;
}

export interface SingleChoiceQuestion extends DailyQuestionBase {
  type: "single_choice";
  candidates: MemberLite[];
}

export interface OpenTextQuestion extends DailyQuestionBase {
  type: "open_text";
  maxLength: number; // UI-Limit, z. B. 280
}

export interface Duel1v1Question extends DailyQuestionBase {
  type: "duel_1v1";
  left: MemberLite;
  right: MemberLite;
}

export interface Duel2v2Question extends DailyQuestionBase {
  type: "duel_2v2";
  teamA: [MemberLite, MemberLite];
  teamB: [MemberLite, MemberLite];
}

export interface EitherOrQuestion extends DailyQuestionBase {
  type: "either_or";
  options: [string, string];
}

export type DailyQuestion =
  | SingleChoiceQuestion
  | OpenTextQuestion
  | Duel1v1Question
  | Duel2v2Question
  | EitherOrQuestion;

// Answer drafts waehrend der Eingabe

export type DailyAnswerDraft =
  | { type: "single_choice"; questionId: QuestionId; selectedUserId?: UserId }
  | { type: "open_text"; questionId: QuestionId; textAnswer: string }
  | {
      type: "duel_1v1";
      questionId: QuestionId;
      selectedSide?: "left" | "right";
    }
  | {
      type: "duel_2v2";
      questionId: QuestionId;
      selectedTeam?: "teamA" | "teamB";
    }
  | {
      type: "either_or";
      questionId: QuestionId;
      selectedOptionIndex?: 0 | 1;
    };

// Reveal-Ergebnisse pro Fragetyp

export interface SingleChoiceResult {
  questionType: "single_choice";
  totalVotes: number;
  anonymous: boolean;
  counts: Array<{
    candidate: MemberLite;
    votes: number;
    percent: number;
  }>;
  myChoiceUserId?: UserId;
}

export interface OpenTextResult {
  questionType: "open_text";
  anonymous: boolean;
  entries: Array<{
    text: string;
    author?: MemberLite; // nur wenn !anonymous
  }>;
}

export interface Duel1v1Result {
  questionType: "duel_1v1";
  anonymous: boolean;
  left: { member: MemberLite; votes: number; percent: number };
  right: { member: MemberLite; votes: number; percent: number };
  myChoice?: "left" | "right";
}

export interface Duel2v2Result {
  questionType: "duel_2v2";
  anonymous: boolean;
  teamA: { members: [MemberLite, MemberLite]; votes: number; percent: number };
  teamB: { members: [MemberLite, MemberLite]; votes: number; percent: number };
  myChoice?: "teamA" | "teamB";
}

export interface EitherOrResult {
  questionType: "either_or";
  anonymous: boolean;
  options: [
    { label: string; votes: number; percent: number },
    { label: string; votes: number; percent: number }
  ];
  myChoiceIndex?: 0 | 1;
}

export type QuestionResult =
  | SingleChoiceResult
  | OpenTextResult
  | Duel1v1Result
  | Duel2v2Result
  | EitherOrResult;

// Zustand einer einzelnen Karte in der Daily-Ansicht

export type DailyQuestionCardState =
  | { phase: "unanswered"; question: DailyQuestion; draft?: DailyAnswerDraft }
  | {
      phase: "submitting";
      question: DailyQuestion;
      draft: DailyAnswerDraft;
    }
  | {
      phase: "submitted_waiting_reveal";
      question: DailyQuestion;
      myAnswer: DailyAnswerDraft;
    }
  | {
      phase: "revealed";
      question: DailyQuestion;
      myAnswer?: DailyAnswerDraft;
      result: QuestionResult;
    }
  | {
      phase: "error";
      question: DailyQuestion;
      message: string;
      lastDraft?: DailyAnswerDraft;
    };

export type DailyViewState =
  | { status: "loading" }
  | {
      status: "no_run";
      dateKey: DateKey;
      message: string;
    }
  | {
      status: "ready";
      dateKey: DateKey;
      runStatus: "scheduled" | "active" | "closed";
      revealPolicy: RevealPolicy;
      cards: DailyQuestionCardState[];
      progress: { answered: number; total: number };
    }
  | { status: "error"; message: string };

// ---------------------------------------------------------
// Lobby / Live
// ---------------------------------------------------------

export interface LobbyParticipant {
  userId: UserId;
  displayName: string;
  photoURL: string | null;
  isHost: boolean;
  connected: boolean;
}

export type LobbyPhase = "lobby" | "question" | "reveal" | "finished";

export interface LobbyConfigDraft {
  categories: Category[];
  questionCount: number;
  questionDurationSec: number;
  revealDurationSec: number;
}

export interface CountdownTiming {
  phaseStartedAtMs: number;
  durationSec: number;
}

export interface LiveQuestionView {
  questionIndex: number; // 0-basiert
  totalQuestions: number;
  question: DailyQuestion; // gleicher View-Shape wie Daily, Pairing vorverarbeitet
}

export type LiveQuestionState =
  | {
      phase: "question";
      view: LiveQuestionView;
      countdown: CountdownTiming;
      draft?: DailyAnswerDraft;
      submitStatus: "idle" | "submitting" | "submitted" | "error";
      submitError?: string;
    }
  | {
      phase: "reveal";
      view: LiveQuestionView;
      countdown: CountdownTiming;
      result: QuestionResult;
      myAnswer?: DailyAnswerDraft;
    };

export type RevealState = Extract<LiveQuestionState, { phase: "reveal" }>;

export interface LiveFinishedSummary {
  totalQuestions: number;
  myAnswersCount: number;
  topCategory: Category | null;
  rounds: Array<{
    questionIndex: number;
    questionText: string;
    category: Category;
    anonymous: boolean;
    result: QuestionResult;
  }>;
}

export type LobbyViewState =
  | { status: "landing" } // initiale Auswahl: erstellen oder joinen
  | {
      status: "creating";
      draft: LobbyConfigDraft;
      canSubmit: boolean;
      submitStatus: "idle" | "submitting" | "error";
      submitError?: string;
    }
  | {
      status: "joining_by_code";
      code: string;
      submitStatus: "idle" | "submitting" | "error";
      submitError?: string;
    }
  | {
      status: "connected";
      sessionId: SessionId;
      code: string;
      phase: LobbyPhase;
      participants: LobbyParticipant[];
      me: LobbyParticipant;
      isHost: boolean;
      live: LiveQuestionState | null; // null waehrend phase === "lobby"
      finishedSummary: LiveFinishedSummary | null;
      hostControls: {
        canStart: boolean; // nur host + phase === "lobby" + >=2 participants
        canAdvance: boolean; // nur host + phase === "reveal"
        canEnd: boolean; // nur host
      };
    }
  | { status: "error"; message: string };

// ---------------------------------------------------------
// Profile
// ---------------------------------------------------------

export interface ProfileStats {
  daily: {
    answeredCount: number;
    streakCurrent: number;
    streakBest: number;
    firstAnswerCount: number;
  };
  live: {
    roundsPlayed: number;
    roundsHosted: number;
    answersSubmitted: number;
  };
  duels: {
    wins: number;
    losses: number;
    winRatePercent: number | null; // null wenn 0 Duelle
  };
  publicVotesReceived: {
    total: number;
    byCategory: Partial<Record<Category, number>>;
  };
  categoryActivity: Partial<Record<Category, number>>;
}

export interface DailyHistoryEntry {
  dateKey: DateKey;
  totalInRun: number;
  answeredByMe: number;
  status: "scheduled" | "active" | "closed";
}

export type ProfileViewState =
  | { status: "loading" }
  | {
      status: "ready";
      user: AppUser;
      isSelf: boolean;
      stats: ProfileStats;
      dailyHistory: DailyHistoryEntry[];
      members: MemberLite[]; // Navigation zu anderen Profilen
    }
  | { status: "not_found" }
  | { status: "error"; message: string };

// ---------------------------------------------------------
// Admin
// ---------------------------------------------------------

export interface AdminQuestionRow {
  questionId: QuestionId;
  text: string;
  category: Category;
  type: QuestionType;
  anonymous: boolean;
  targetMode: TargetMode;
  active: boolean;
  createdAtIso: string;
  createdByDisplayName: string;
}

export interface AdminQuestionFilter {
  search: string;
  category: Category | "all";
  type: QuestionType | "all";
  active: "all" | "active" | "inactive";
  targetMode: TargetMode | "all";
}

export interface AdminDailyRunRow {
  dateKey: DateKey;
  status: "scheduled" | "active" | "closed";
  questionCount: number;
  createdByDisplayName: string;
}

export interface AdminConfigDraft {
  dailyQuestionCount: number;
  dailyRevealPolicy: RevealPolicy;
  liveDefaultQuestionDurationSec: number;
  liveDefaultRevealDurationSec: number;
  onboardingEnabled: boolean;
}

export type AdminTab = "questions" | "daily" | "config";

export type AdminViewState =
  | { status: "loading" }
  | { status: "forbidden" } // role !== "admin"
  | {
      status: "ready";
      activeTab: AdminTab;
      questions: {
        rows: AdminQuestionRow[];
        filter: AdminQuestionFilter;
        importStatus: "idle" | "importing" | "success" | "error";
        importError?: string;
      };
      dailyRuns: AdminDailyRunRow[];
      config: {
        draft: AdminConfigDraft;
        saveStatus: "idle" | "saving" | "saved" | "error";
        saveError?: string;
        dirty: boolean;
      };
    }
  | { status: "error"; message: string };
```

---

## 2. Screen-Spezifikation

### 2.1 Onboarding

- **Ziel:** Nach erstem Magic-Link-Login das Profil vervollstaendigen (Anzeigename + optionales Bild), bevor der User in die App kommt.
- **Hauptkomponenten:** `ScreenHeader`, `AvatarUploader`, `TextField` (Name), `Button` (primary), Hinweistext zur Sichtbarkeit.
- **Mobile Layout:** Zentrierter Content, volle Breite. Oben Titel "Willkommen", darunter Avatar-Circle mit Upload-Overlay, darunter Name-Feld, unten Sticky-Button "Profil speichern".
- **Primary CTA:** "Profil speichern" (inaktiv bis `displayName.trim().length >= 2`).
- **Secondary:** "Bild ueberspringen", "Abmelden" (klein, unten).
- **Loading State:** Upload-Progress ueber dem Avatar, Button `loading`.
- **Empty State:** N/A (es ist der initiale Screen).
- **Error State:** `ErrorBanner` oberhalb des Forms mit Retry. Fehlerhaftes Feld bekommt roten Rahmen + Inline-Message.

### 2.2 Home

- **Ziel:** Sofort klar machen: "Gibt es heute Dailys?" und "Laeuft gerade eine Live-Runde?". Plus kurzer persoenlicher Touch (Name, Streak).
- **Hauptkomponenten:** `ScreenHeader` (Greeting), `DailyCallout`, `LiveSessionCallout`, `QuickActionRow`, `BottomNav`.
- **Mobile Layout:**
  - Oben: Greeting "Hi $name" + Datum + Streak-Badge.
  - Card 1: Daily (Status, Progress "3/5 beantwortet", Button "Weitermachen").
  - Card 2: Aktive Live-Session (falls vorhanden) mit Host + Teilnehmerzahl + "Beitreten".
  - Card 3 (nur Admin): "Live-Runde starten".
  - Darunter: `BottomNav` fix am unteren Rand.
- **Primary CTA:** Kontext-abhaengig, nur eine sichtbar:
  - Daily offen: "Weitermachen"
  - Keine Daily, aber Live: "Live beitreten"
  - Nichts aktiv, Admin: "Live-Runde starten"
  - Nichts aktiv, Member: CTA versteckt, Hinweis "Warte auf die naechste Daily oder eine Live-Runde".
- **Secondary:** "Mein Profil", "Admin" (nur Admin).
- **Loading State:** Skeleton-Karten (Daily + Live) mit grauen Rechtecken.
- **Empty State:** Fuer Member ohne aktive Daily/Live: freundliche Message "Heute noch nichts los. Schau spaeter wieder rein." + Button "Mein Profil".
- **Error State:** Ganzer-Screen-`ErrorBanner` oben mit Retry-Button, Karten bleiben im Skeleton-Zustand.

### 2.3 Daily

- **Ziel:** Alle Fragen des Tages beantworten, Ergebnisse je nach `revealPolicy` sehen.
- **Hauptkomponenten:** `ScreenHeader` (Datum), `DailyProgress`, `QuestionCardShell` (eine pro Karte), `RevealResults`, `BottomNav`.
- **Mobile Layout:**
  - Oben: "Daily 23. April" + Fortschrittsbalken "3/5".
  - Darunter: vertikaler Feed aus `QuestionCardShell`, eine pro Frage, in der Reihenfolge aus `items`.
  - Jede Karte: Kategorie-Badge, Anonym-Label falls zutreffend, Fragetext, inputspezifische UI (siehe Komponenten), Submit-Button.
  - Beantwortete Karten klappen Ergebnis auf (nach Policy) oder zeigen "Ergebnis am Tagesende".
- **Primary CTA:** Pro Karte "Antwort abschicken". Kein globaler Submit.
- **Secondary:** "Antwort aendern" (deaktiviert nach Submit), "Zum naechsten scrollen".
- **Loading State:** Header + `DailyProgress` gefuellt, Karten als Skeletons.
- **Empty State `no_run`:** Grosse zentrierte Message "Heute wurde noch keine Daily erzeugt." + Untertitel "Schau morgen wieder vorbei." Fuer Admin zusaetzlich Button "Daily jetzt erstellen" (oeffnet Admin-Tab).
- **Error State:** `ErrorBanner` oben mit Retry. Pro-Karte-Fehler bleibt lokal in der Karte.

### 2.4 Lobby

Ein Screen mit drei Darstellungsstufen: Landing (Auswahl), Warteraum/Live (Connected), Finished-Summary.

- **Ziel:** Live-Runden hosten oder joinen, durch die Runde fuehren, Ergebnisse zeigen.
- **Hauptkomponenten:**
  - Landing: `HeroChoice` ("Erstellen" / "Joinen"), `CodeInput`.
  - Create-Flow (nur Admin): `CategoryPicker`, `NumberStepper` (Anzahl), `DurationStepper` x 2.
  - Warteraum: `LobbyCodeBadge` (gross), `ParticipantGrid`, `HostControls` (Start-Button).
  - Question-Phase: `CountdownRing`, `QuestionCardShell`, input-spezifische Komponente.
  - Reveal-Phase: `RevealResults`, `CountdownRing` (kleiner), "Naechste Frage" fuer Host.
  - Finished: `LiveRoundSummary` (Uebersicht aller Fragen + Ergebnisse).
- **Mobile Layout:**
  - Landing: Zwei grosse Buttons untereinander.
  - Connected: fullscreen ohne BottomNav. Oben Titel-Leiste (Code + Runde-Nummer X/Y), Hauptbereich je nach Phase, unten Host-Controls (sticky).
- **Primary CTA:** Phasenabhaengig:
  - Landing: "Runde erstellen" (Admin) oder "Beitreten"
  - Warteraum: Host "Runde starten"
  - Question: "Antwort abschicken"
  - Reveal: Host "Naechste Frage" / "Runde beenden"
  - Finished: "Zurueck zum Home"
- **Secondary:** "Lobby verlassen" (immer erreichbar), "Code teilen" (Clipboard), im Landing "Ich habe keinen Code".
- **Loading State:** Per Phase Skeleton. Beim Connect-Flow Spinner auf dem Start-Button.
- **Empty State:**
  - Warteraum mit nur dem Host: Hinweis "Warte auf weitere Teilnehmer".
  - Landing ohne Admin und ohne aktive Session: Hinweis "Es laeuft gerade keine Live-Runde. Nur Admins koennen starten."
- **Error State:**
  - Lobby getrennt: Vollbild-Error "Verbindung verloren" + Retry.
  - Falscher Code beim Joinen: Inline-Error am `CodeInput`.

### 2.5 Profil

- **Ziel:** Eigene Identitaet + Stats + Historie dauerhaft nachvollziehbar machen. Andere Mitglieder anschauen koennen.
- **Hauptkomponenten:** `ProfileHeader` (Avatar + Name + Rolle), `ProfileStatGrid`, `DailyHistoryList`, `MemberRail`, `BottomNav`.
- **Mobile Layout:**
  - Oben: gross Avatar, darunter Name, darunter kleine Rollen-Pill.
  - Stat-Grid 2x3 (Streak, Daily-Antworten, Live-Runden, Duel W/L, Erhaltene Votes, Top-Kategorie).
  - Liste: "Meine letzten Dailys" (scrollable horizontal oder vertikal), zeigt Datum + "X/Y beantwortet".
  - Unten: horizontale Avatar-Rail aller Mitglieder zum Hinnavigieren.
  - Bei fremdem Profil (`isSelf === false`): Historie verborgen, nur oeffentliche Stats.
- **Primary CTA:** Eigene: "Profil bearbeiten". Fremde: keine.
- **Secondary:** "Logout" (auf eigenem Profil, klein unten), "Admin oeffnen" (nur Admin, eigenes Profil).
- **Loading State:** Skeleton fuer Header + Grid, Liste dimmed.
- **Empty State:** `DailyHistoryList` leer: "Noch keine Dailys beantwortet. Los gehts morgen."
- **Error State:** `ErrorBanner` oberhalb von Header mit Retry. Bei `not_found` Vollbild-Message "Dieses Profil existiert nicht mehr."

### 2.6 Admin

- **Ziel:** Fragenpool verwalten, Dailys erzeugen, App-Konfiguration anpassen. Nur fuer Admins erreichbar.
- **Hauptkomponenten:** `AdminTabs`, `AdminQuestionTable`, `AdminQuestionFilterBar`, `AdminJsonImport`, `AdminDailyRunList`, `AdminDailyConfigForm`.
- **Mobile Layout:**
  - Oben: `AdminTabs` (Fragen / Daily / Config) als horizontale Segmented-Control.
  - Fragen-Tab: Filter-Bar, vertikale Liste (keine breite Tabelle) mit Cards (Text, Badges fuer Kategorie+Typ+Anonym, Toggle "aktiv"). Floating-Button "+ Importieren".
  - Daily-Tab: Liste vergangener `dailyRuns` + Button "Run fuer heute/morgen erzeugen".
  - Config-Tab: Formular mit Number-Inputs + Reveal-Policy-Toggle + Save-Button.
- **Primary CTA:** Tabs-abhaengig:
  - Fragen: "Fragen importieren"
  - Daily: "Neuen Run erzeugen"
  - Config: "Speichern" (nur wenn `dirty`)
- **Secondary:** "Frage deaktivieren", "Run oeffnen", "Zurueck zur App".
- **Loading State:** Tabs sichtbar, Inhalt Skeleton.
- **Empty State:**
  - Fragen leer: "Noch keine Fragen. Importiere JSON."
  - Daily leer: "Noch keine Runs erzeugt."
- **Error State:** `ErrorBanner` pro Tab; bei `forbidden` Vollbild "Nur fuer Admins".

---

## 3. UI-Komponentenliste

Gruppiert nach Verantwortung. Komponenten die im Handoff genannt sind, sind enthalten; einige sind ergaenzt um die 6 Screens sauber zu decken.

### App-Shell & Navigation

- `AppShell` — Layout-Wrapper mit Safe-Area + Toast-Container
- `AuthGuard` — blockt unautorisierten Zugriff, redirected zum Login/Onboarding
- `BottomNav` — Home / Daily / Lobby / Profil, Active-State, nicht sichtbar im Lobby-Connected und Onboarding
- `ScreenHeader` — Titel + optionaler Subtitle + optionale Action-Icons

### Auth & Onboarding

- `MagicLinkForm` — E-Mail-Eingabe + Sende-Button + Verified-Mail-Check-Screen
- `AvatarUploader` — Circle mit Kamera-Overlay, File-Picker, Preview, Progress
- `AuthStatusBanner` — zeigt z. B. "Link gesendet an ..."

### Primitive & Shared

- `Button` (primary / secondary / ghost / danger), loading+disabled States
- `TextField` mit Error/Helper-Text
- `Toggle` / `Checkbox`
- `Segmented` (Tabs / Radio-Gruppe)
- `Badge` / `CategoryBadge`
- `AvatarBubble` (1 Member)
- `AvatarRow` (Mehrzahl, horizontal scrollbar)
- `LoadingSkeleton`
- `ErrorBanner`
- `EmptyState`
- `Toast`
- `Modal` / `Sheet` (Bottom-Sheet fuer mobile)
- `Stepper` / `NumberStepper`

### Daily / Live gemeinsam

- `DailyProgress` — "3/5 beantwortet" + Balken
- `QuestionCardShell` — Rahmen, zeigt Kategorie-Badge, Anonym-Label, Fragetext, children-Input, Submit-Button-Slot
- `SingleChoiceInput` — Grid aus `MemberPickerTile`
- `MemberPickerTile` — Avatar + Name, selected-State
- `OpenTextInput` — Multiline mit Char-Counter
- `Duel1v1Input` — zwei grosse `DuelSide`-Bloecke
- `Duel2v2Input` — zwei `DuelTeam`-Bloecke
- `DuelSide` / `DuelTeam` — Avatar(s) + Label + tap-select
- `EitherOrInput` — zwei vertikale Optionsbuttons
- `CountdownRing` — SVG-Ring, lokal berechnet aus `CountdownTiming`
- `CountdownBar` — horizontale Alternative (z. B. waehrend Reveal)
- `RevealResults` — Dispatcher auf Ergebnistyp
- `RevealBar` — einzelne Balken-Zeile (Label + Avatar + %)
- `RevealOpenTextList` — Liste Texteintraege, ggf. mit Avatar
- `RevealDuelSplit` — zwei-seitige Ergebnisanzeige

### Home

- `DailyCallout`
- `LiveSessionCallout`
- `StreakBadge`
- `QuickActionRow`

### Lobby

- `LobbyLandingChoice`
- `LobbyCodeBadge` — grosser Share-Code
- `LobbyCodeInput` — fuer Joinen
- `ParticipantGrid` — Avatars + Online-Dot
- `HostControls` — Start / Next / End
- `LiveRoundSummary` — Liste aller Fragen + Ergebnisse am Ende

### Profil

- `ProfileHeader`
- `ProfileStatGrid` — 2x3 Stat-Karten
- `ProfileStatCard` — Icon + Value + Label
- `DailyHistoryList`
- `MemberRail` — horizontale Avatar-Liste

### Admin

- `AdminTabs`
- `AdminQuestionTable` — mobile-first als Card-List, nicht echte Table
- `AdminQuestionRow`
- `AdminQuestionFilterBar`
- `AdminJsonImport` — Textarea + Preview + "Importieren"
- `AdminDailyRunList`
- `AdminDailyRunCreateButton`
- `AdminDailyConfigForm`

---

## 4. Mock-Datenstrukturen

Mocks sollen in `src/lib/mocks/` liegen und den Types entsprechen. Sie dienen dem Entwickeln ohne Firebase-Verbindung.

### 4.1 Mitglieder

```ts
export const mockMembers: MemberLite[] = [
  { userId: "u_leon", displayName: "Leon", photoURL: null },
  { userId: "u_tim", displayName: "Tim", photoURL: null },
  { userId: "u_jana", displayName: "Jana", photoURL: null },
  { userId: "u_max", displayName: "Max", photoURL: null },
  { userId: "u_lisa", displayName: "Lisa", photoURL: null }
];
```

### 4.2 AppUser

```ts
export const mockMe: AppUser = {
  userId: "u_leon",
  email: "leon@example.com",
  displayName: "Leon",
  photoURL: null,
  role: "admin",
  onboardingCompleted: true
};
```

### 4.3 HomeViewState (ready)

```ts
export const mockHome: HomeViewState = {
  status: "ready",
  greeting: {
    displayName: "Leon",
    localDateLabel: "Donnerstag, 23. April",
    streakCurrent: 4
  },
  dailyTeaser: {
    dateKey: "2026-04-23",
    totalQuestions: 5,
    answeredByMe: 2,
    status: "active",
    revealPolicy: "after_answer"
  },
  activeLiveSession: null,
  canHostLive: true,
  showAdminEntry: true
};
```

### 4.4 DailyViewState (ready, Mischung aus Phasen)

```ts
export const mockDaily: DailyViewState = {
  status: "ready",
  dateKey: "2026-04-23",
  runStatus: "active",
  revealPolicy: "after_answer",
  progress: { answered: 2, total: 5 },
  cards: [
    {
      phase: "revealed",
      question: {
        questionId: "q1",
        indexInRun: 0,
        totalInRun: 5,
        type: "single_choice",
        category: "pure_fun",
        anonymous: false,
        text: "Wer wuerde am ehesten spontan einen Flug buchen?",
        candidates: mockMembers
      },
      myAnswer: {
        type: "single_choice",
        questionId: "q1",
        selectedUserId: "u_tim"
      },
      result: {
        questionType: "single_choice",
        totalVotes: 5,
        anonymous: false,
        myChoiceUserId: "u_tim",
        counts: [
          { candidate: mockMembers[1], votes: 3, percent: 60 },
          { candidate: mockMembers[3], votes: 2, percent: 40 },
          { candidate: mockMembers[0], votes: 0, percent: 0 },
          { candidate: mockMembers[2], votes: 0, percent: 0 },
          { candidate: mockMembers[4], votes: 0, percent: 0 }
        ]
      }
    },
    {
      phase: "submitted_waiting_reveal",
      question: {
        questionId: "q2",
        indexInRun: 1,
        totalInRun: 5,
        type: "open_text",
        category: "deep_talk",
        anonymous: true,
        text: "Was schaetzt du am meisten an unserer Gruppe?",
        maxLength: 280
      },
      myAnswer: {
        type: "open_text",
        questionId: "q2",
        textAnswer: "Dass wir ehrlich zueinander sind."
      }
    },
    {
      phase: "unanswered",
      question: {
        questionId: "q3",
        indexInRun: 2,
        totalInRun: 5,
        type: "duel_1v1",
        category: "hot_takes",
        anonymous: true,
        text: "Wer ist spontaner?",
        left: mockMembers[0],
        right: mockMembers[2]
      }
    },
    {
      phase: "unanswered",
      question: {
        questionId: "q4",
        indexInRun: 3,
        totalInRun: 5,
        type: "either_or",
        category: "would_you_rather",
        anonymous: true,
        text: "Wuerdest du eher nie wieder feiern oder nie wieder verreisen?",
        options: ["Nie wieder feiern", "Nie wieder verreisen"]
      }
    },
    {
      phase: "unanswered",
      question: {
        questionId: "q5",
        indexInRun: 4,
        totalInRun: 5,
        type: "duel_2v2",
        category: "pure_fun",
        anonymous: false,
        text: "Welches Duo ist chaotischer?",
        teamA: [mockMembers[0], mockMembers[1]],
        teamB: [mockMembers[3], mockMembers[4]]
      }
    }
  ]
};
```

### 4.5 LobbyViewState (connected, question-phase)

```ts
export const mockLobby: LobbyViewState = {
  status: "connected",
  sessionId: "sess_123",
  code: "FRND7",
  phase: "question",
  me: {
    userId: "u_leon",
    displayName: "Leon",
    photoURL: null,
    isHost: true,
    connected: true
  },
  isHost: true,
  participants: mockMembers.map((m, i) => ({
    ...m,
    isHost: m.userId === "u_leon",
    connected: i < 4
  })),
  live: {
    phase: "question",
    view: {
      questionIndex: 2,
      totalQuestions: 8,
      question: {
        questionId: "q3",
        indexInRun: 2,
        totalInRun: 8,
        type: "duel_1v1",
        category: "hot_takes",
        anonymous: true,
        text: "Wer ist spontaner?",
        left: mockMembers[0],
        right: mockMembers[2]
      }
    },
    countdown: {
      phaseStartedAtMs: Date.now() - 8_000,
      durationSec: 20
    },
    submitStatus: "idle"
  },
  finishedSummary: null,
  hostControls: { canStart: false, canAdvance: false, canEnd: true }
};
```

### 4.6 ProfileStats

```ts
export const mockProfileStats: ProfileStats = {
  daily: {
    answeredCount: 42,
    streakCurrent: 4,
    streakBest: 11,
    firstAnswerCount: 7
  },
  live: { roundsPlayed: 6, roundsHosted: 2, answersSubmitted: 48 },
  duels: { wins: 13, losses: 9, winRatePercent: 59 },
  publicVotesReceived: {
    total: 31,
    byCategory: { pure_fun: 12, hot_takes: 9, deep_talk: 6, memories: 4 }
  },
  categoryActivity: {
    pure_fun: 18,
    deep_talk: 12,
    hot_takes: 8,
    memories: 4
  }
};
```

### 4.7 AdminViewState (ready, Fragen-Tab)

```ts
export const mockAdmin: AdminViewState = {
  status: "ready",
  activeTab: "questions",
  questions: {
    filter: {
      search: "",
      category: "all",
      type: "all",
      active: "all",
      targetMode: "all"
    },
    importStatus: "idle",
    rows: [
      {
        questionId: "q1",
        text: "Wer wuerde am ehesten spontan einen Flug buchen?",
        category: "pure_fun",
        type: "single_choice",
        anonymous: false,
        targetMode: "both",
        active: true,
        createdAtIso: "2026-04-10T18:22:00.000Z",
        createdByDisplayName: "Leon"
      },
      {
        questionId: "q2",
        text: "Wer ist spontaner?",
        category: "hot_takes",
        type: "duel_1v1",
        anonymous: true,
        targetMode: "both",
        active: true,
        createdAtIso: "2026-04-10T18:23:00.000Z",
        createdByDisplayName: "Leon"
      }
    ]
  },
  dailyRuns: [
    {
      dateKey: "2026-04-23",
      status: "active",
      questionCount: 5,
      createdByDisplayName: "Leon"
    },
    {
      dateKey: "2026-04-22",
      status: "closed",
      questionCount: 5,
      createdByDisplayName: "Leon"
    }
  ],
  config: {
    draft: {
      dailyQuestionCount: 5,
      dailyRevealPolicy: "after_answer",
      liveDefaultQuestionDurationSec: 20,
      liveDefaultRevealDurationSec: 10,
      onboardingEnabled: true
    },
    saveStatus: "idle",
    dirty: false
  }
};
```

---

## 5. Hinweise fuer die Implementierung

- **Mapping-Layer:** Die View-Models `DailyQuestion`, `LiveQuestionView`, `QuestionResult` werden aus Firestore-Dokumenten zusammengesetzt. `pairing.memberIds` und `pairing.teamA/teamB` werden durch `MemberLite`-Objekte aus der `users`-Collection ersetzt. Das Mapping gehoert in `src/lib/mapping/` und nicht in die Komponenten.
- **Countdown:** Nur `phaseStartedAt` aus Firestore lesen; `useCountdown(timing)` berechnet lokal sekundengenau und triggert auf 0 keinen weiteren Schreibvorgang, sondern wartet auf den naechsten Phasenwechsel aus Firestore.
- **Reveal-Policy (strikt View-Regel):** Die `dailyAnonymousAggregates` und `dailyAnswers` sind technisch jederzeit lesbar — die Reveal-Policy wird *ausschliesslich* im Mapping-/View-Layer durchgesetzt, nie in der Komponente. Regel:
  - `after_answer`: sobald die eigene Antwort geschrieben ist, darf die Karte als `revealed` gemappt werden.
  - `after_day_end`: Ergebnisse duerfen *erst* angezeigt werden, wenn der Berliner Tag gewechselt hat, auch wenn Aggregate schon vorhanden sind. Das Mapping ermittelt den Tageswechsel aus `now() in Europe/Berlin > dateKey`. Bis dahin bleibt die Karte `submitted_waiting_reveal`, `result` wird nicht ans View-Model gehaengt. Komponenten rendern nur was ihnen das View-Model gibt — sie treffen nie selbst eine Policy-Entscheidung.
  - Hilfsfunktion: `shouldReveal(revealPolicy, runStatus, dateKey, hasOwnAnswer, nowBerlin)` gehoert in `src/lib/mapping/daily.ts` und ist die einzige Stelle, die diese Logik kennt.
- **Anonymitaet:** Die UI darf bei `question.anonymous === true` in den Ergebnis-Komponenten niemals `author` / `myChoiceUserId` einer anderen Person zeigen. Das eigene `myAnswer` bleibt lokal sichtbar, zaehlt aber nicht in Person-Stats.
- **Host-Only-Controls:** `HostControls` nur rendern wenn `isHost === true`. Button-Disable-Logic kommt aus `hostControls.canStart` etc., nicht aus eigenen Berechnungen in der Komponente.
- **Admin-Gate:** `AdminViewState.status === "forbidden"` muss als Vollbild-Screen gerendert werden — nie als Teil des normalen App-Shells mit BottomNav-Eintrag.
- **Bilder:** `photoURL` kann `null` sein, `AvatarBubble` rendert dann Initialen aus `displayName`.

---

## 6. Nicht in V1

Folgendes ist bewusst ausgeklammert und nur als Orientierung notiert:

- Push-Notifications (PWA) — kommt mit PWA-Ausbau
- Gruppen-Entitaet / Multi-Tenant — explizit aus V1 gestrichen
- Mitgliederliste als eigener Screen — in V1 in Profil-Screen integriert
- Globale Gruppenstatistiken — nur persoenliche Stats in V1
- Kategorie-Gewichtung und Pin-Fragen im Daily-Algorithmus
