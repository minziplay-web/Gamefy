# Firebase Setup

## Ziel

Dieses Dokument bringt das Projekt vom Mock-Modus in den ersten echten End-to-End-Test mit Firebase Auth und Firestore.

## Bereits vorbereitet

- Firebase Client ist eingebaut
- Firestore Rules und Indexes liegen im Repo
- Onboarding, Daily, Admin und Live koennen gegen echte Firebase-Daten schreiben

## Was du brauchst

- ein Google-Konto
- ein Firebase-Projekt
- die Web-App-Konfiguration aus Firebase

## Schritt 1: Firebase Projekt anlegen

1. Neues Firebase-Projekt erstellen
2. Folgende Produkte aktivieren:
   - Authentication
   - Firestore Database
3. Unter `Authentication > Sign-in method`:
   - `Email/Password` aktivieren
4. Firestore anlegen

## Schritt 2: Web App registrieren

1. Im Firebase-Projekt eine Web App anlegen
2. Die Konfigurationswerte kopieren

## Schritt 3: `.env.local` anlegen

1. `C:\\VSProjects\\Gameapp\\.env.example` nach `C:\\VSProjects\\Gameapp\\.env.local` kopieren
2. Firebase-Werte eintragen

Beispiel:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

## Schritt 4: Env pruefen

```bash
npm run firebase:check-env
```

## Schritt 5: Firebase CLI verbinden

```bash
npm run firebase:login
npm run firebase:use
```

Bei `firebase use --add` das richtige Projekt auswaehlen.

## Schritt 6: Rules und Indexes deployen

```bash
npm run firebase:deploy
```

## Schritt 7: Erste Admin-Person setzen

Nach dem ersten Login erzeugt die App ein `users/{userId}` Dokument mit:

- `role: "member"`
- `isActive: true`

Fuer den ersten echten Admin-Test:

1. einmal normal in die App einloggen
2. Firestore oeffnen
3. `users/{deineUid}` finden
4. `role` manuell auf `admin` setzen

Danach funktionieren:

- `/admin`
- Fragen importieren
- Daily erstellen
- Live-Lobby hosten

## Schritt 8: Erster echter Testrun

1. `npm run dev`
2. `/login`
3. mit E-Mail + Passwort registrieren oder einloggen
4. Onboarding abschliessen
5. User in Firestore auf `admin` setzen
6. `/admin`
7. Fragen importieren
8. Daily erzeugen
9. `/daily` testen
10. `/lobby` testen

## Relevante Dateien

- `src/lib/firebase/client.ts`
- `src/lib/firebase/onboarding.ts`
- `src/lib/firebase/daily-actions.ts`
- `src/lib/firebase/live-actions.ts`
- `src/lib/firebase/admin-actions.ts`
- `firestore.rules`
- `firestore.indexes.json`
