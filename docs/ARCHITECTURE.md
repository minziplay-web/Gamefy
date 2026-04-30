# Architecture

Stand: 2026-04-29

## Zweck

Mijija ist eine private, mobile-first Web-App fuer eine feste Freundesgruppe. Das aktuelle Produkt ist stark auf Daily-Fragen, Profile, Admin-Verwaltung, Meme-Captions, Custom-Daily-Fragen ueber Trophies und eine Live-Lobby ausgerichtet. Es gibt keine Multi-Tenant- oder Gruppen-Entitaet.

## Produktentscheidungen

- Keine anonymen Fragen oder anonymen Votes. Antworten und Auswertungen duerfen nutzerbezogen sein.
- Historische Spec-Konzepte wie `anonymous: true`, `dailyAnonymousAggregates` und `liveAnonymousAggregates` werden nicht weiterverfolgt.

## Stack

- Next.js 16 App Router mit React 19 und TypeScript.
- Tailwind CSS v4 ueber `@tailwindcss/postcss`.
- Firebase Web SDK fuer Auth, Firestore und Storage im Browser.
- Firebase Admin SDK in Node-Routen fuer serverseitige Tokenpruefung und Cron-Operationen.
- Vercel als Hosting-Ziel.
- Firebase CLI fuer Firestore- und Storage-Rules/Indexes.
- Playwright nur als Dev-Abhaengigkeit fuer Preview-/Screenshot-Skripte.

## Grobe Struktur

- `src/app/` enthaelt App-Router-Routen, Layouts und API-Routes.
- `src/components/` enthaelt UI nach Feature-Bereichen: `admin`, `app-shell`, `auth`, `daily`, `home`, `lobby`, `onboarding`, `profile`, `ui`.
- `src/lib/auth/` kapselt Auth-State, Login, Registrierung, Logout und Auth-Guarding.
- `src/lib/firebase/` kapselt Firestore-Collections, clientseitige View-State-Hooks, Admin-Actions und serverseitigen Firebase Admin Zugriff.
- `src/lib/mapping/` baut View-Models, Datumslogik, Stats, Guards und Diagnostics aus Firestore-Dokumenten.
- `src/lib/daily/` enthaelt Daily-Run-Auswahl, Pairings und Custom-Daily-Fragen.
- `src/lib/types/` definiert Frontend-View-Models und Firestore-Dokumentformen.
- `src/lib/mocks/` erlaubt Betrieb ohne Firebase-Env als Mock-Modus.
- `public/` enthaelt statische Icons und Meme-Bilder.
- `docs/questions/` enthaelt Fragen-JSON und Meme-Quellen.
- `scripts/` enthaelt Preview-, Capture-, Backfill- und Env-Check-Skripte.

## Routing

App-Routen:

- `/login` fuer Auth.
- `/onboarding` fuer Profilabschluss.
- `/` fuer Home.
- `/daily` fuer aktuelle Daily.
- `/past-dailies` fuer vergangene Dailys.
- `/lobby` und `/lobby/[sessionId]` fuer Live-Runden.
- `/profile` und `/profile/[userId]` fuer Profile.
- `/admin` fuer Admin-Verwaltung.
- `/resolved` als eigener App-Screen.
- `/preview` und `/preview/[screen]/[variant]` fuer UI-Preview-Zustaende.

API-Routen:

- `GET/POST /api/cron/daily-rollover`: prueft optional `CRON_SECRET` und ruft `maybeAutoCreateDailyRun()` auf.
- `POST /api/daily/custom-question`: prueft Firebase-ID-Token per Admin SDK und erstellt oder erweitert Trophy-basierte Custom-Daily-Fragen.

## Auth Und Moduswahl

`AuthProvider` in `src/lib/auth/auth-context.tsx` ist der zentrale Auth-Kontext. Wenn keine vollstaendige `NEXT_PUBLIC_FIREBASE_*` Konfiguration vorhanden ist, startet die App im Mock-Modus mit `mockMe`.

Aktuell unterstuetzt der Code:

- Google Login per Popup.
- E-Mail/Passwort Login.
- E-Mail/Passwort Registrierung.
- Onboarding- und Profilupdates.

Die aeltere Backend-Spec beschreibt noch Magic-Link-only; das ist nicht mehr der aktuelle Codezustand.

## Datenfluss

Die meisten Screens werden durch clientseitige Hooks in `src/lib/firebase/` gespeist:

- `useHomeViewState()` liest aktuelle Runs, Antworten, Meme-Votes, Live-Sessions, Fragen und User.
- `useDailyViewState()` liest Daily-Runs, eigene private Antworten, oeffentliche Antworten, Meme-Votes, Fragen und Mitglieder.
- `useAdminViewState()` liest Fragen, Runs, User, App-Config und Diagnostics.
- `useProfileViewState()`, `useLobbyViewState()` und weitere Hooks folgen demselben Pattern.

Mapping-Funktionen in `src/lib/mapping/` und `src/lib/firebase/daily.ts` formen Firestore-Dokumente in UI-View-Models. Komponenten sollten moeglichst View-Models rendern und keine Firestore-Struktur interpretieren.

## Datenmodell

Wichtige Collections:

- `users/{userId}`: E-Mail, Anzeigename, Foto, Rolle, Onboarding, Aktivstatus, Bonus-Trophies.
- `questions/{questionId}`: Text, Kategorie, Fragetyp, `targetMode`, Aktivstatus, Lock-/Consumed-Felder, Optionen, Meme-Bildpfad, Custom-Question-Metadaten.
- `dailyRuns/{dateKey}`: kanonischer Daily-Run pro Datum mit `items`, `questionSnapshot`, `runId`, `runNumber`, `questionIds`, Status und Reveal-Policy.
- `dailyAnswers/{answerId}`: oeffentliche Antworten fuer Ergebnis- und Aktivitaetsanzeigen.
- `dailyPrivateAnswers/{answerId}`: eigene Antwortquelle je User; wird fuer Fortschritt und eigene History genutzt.
- `dailyFirstAnswers/{docId}`: First-Answer-Locks.
- `dailyMemeVotes/{docId}`: Votes auf Meme-Caption-Antworten.
- `liveSessions/{sessionId}` und Subcollection `participants`: Live-Status, Code, Host, Fragen, Timing und Teilnehmer.
- `liveLobbyCodes/{code}`: aktive Lobby-Code-Zuordnung.
- `liveAnswers` und `livePrivateAnswers`: Live-Antworten.
- `userStats/{userId}`: persistente aggregierte Profilwerte, im aktuellen Code nicht die einzige Quelle fuer Profil-/Home-Stats.
- `appConfig/main`: Daily-Anzahl, Reveal-Policy, Auto-Create, Kategorieplan und Onboarding.

Der aktuelle Code nutzt keine `dailyAnonymousAggregates` oder `liveAnonymousAggregates`. Das ist bewusst: Anonymitaet ist kein aktuelles Produktziel.

## Daily-Run-Logik

`src/lib/daily/daily-run-generator.ts` ist der Kern fuer Run-Erzeugung:

- Standard-Kategorien: `hot_takes`, `pure_fun`, `deep_talk`, `memories`, `career_life`, `relationships`, `hobbies_interests`, `dirty`, `group_knowledge`, `would_you_rather`, `conspiracy`, `meme_it`.
- Maximal 12 Kategorien, maximal 20 Fragen pro Run.
- Pro Kategorie wird hoechstens eine Pool-Frage ausgewaehlt.
- Custom-Trophy-Fragen werden vor Pool-Fragen in den Run gelegt.
- Duel-Pairings werden zentral beim Run-Build aus aktiven User-IDs erzeugt.
- `questionSnapshot` speichert Text/Kategorie/Optionen/Bild im Run, damit spaetere Frage-Aenderungen alte Runs nicht zerstoeren.

Admin-Actions in `src/lib/firebase/admin-actions.ts` erzeugen, ersetzen, erweitern, loeschen und bereinigen Runs. Fragen, die in Dailys landen, werden als consumed/locked markiert und deaktiviert.

## Kritische Module

- `src/lib/firebase/admin-actions.ts`: groesstes Risikomodul; enthaelt Import, CRUD, Run-Erzeugung, Replace/Delete, Cleanup und User-Admin-Aktionen.
- `src/lib/daily/daily-run-generator.ts`: Auswahl, Caps, Kategorieplan und Pairings.
- `src/lib/firebase/daily.ts`: Daily-Realtime-State, Reveal-Policy-Anwendung und Result-Mapping.
- `src/lib/firebase/home.ts`: kombiniert viele Collections fuer Home, Recaps, Trophies und Aktivitaet.
- `src/lib/firebase/live-actions.ts` und `src/lib/firebase/live.ts`: Live-Session- und Host-/Teilnehmerlogik.
- `src/app/api/daily/custom-question/route.ts`: serverseitiger Tokenpfad mit Firestore-Transaktion und Trophy-Accounting.
- `src/app/api/cron/daily-rollover/route.ts` plus `src/lib/firebase/daily-auto-create.ts`: automatischer Tageswechsel.
- `firestore.rules` und `storage.rules`: Sicherheitsgrenze fuer alle Client-Schreibpfade.

## Abhaengigkeiten Und Integrationen

- Firebase Auth ist Identitaetsquelle.
- Firestore ist Wahrheit fuer App-Daten.
- Firebase Storage wird fuer Profilbilder genutzt.
- GitHub Actions triggert stuendlich den Daily-Rollover-Endpunkt.
- Vercel hostet App und API-Routes.

## Architektur-Risiken

- Es gibt Drift zwischen `docs/backend-spec-v1.md` und aktuellem Code: Auth, Zielmodus, Kategorien, Typen und Anonymitaetsmodell haben sich geaendert. Die alten Specs sind historische Referenz.
- Viele clientseitige Hooks lesen ganze Collections oder grosse Querybereiche, z. B. Home liest alle oeffentlichen Daily-Antworten und alle Meme-Votes. Das ist fuer kleine Gruppen pragmatisch, skaliert aber schlecht.
- Anonyme Aggregat-Collections aus der Spec sind nicht implementiert und sollen nicht neu eingefuehrt werden.
- Admin-Actions sind sehr breit und clientseitig markiert (`"use client"`). Security Rules muessen jede Admin-Operation hart absichern.
- `lint` ist aktuell rot; siehe `docs/KNOWN_ISSUES.md`.
