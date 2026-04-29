# Firebase Environments

## Ziel

- `live`: echtes Produktivsystem fuer Vercel und echte Nutzer
- `test`: komplett getrenntes Firebase-Projekt fuer lokales Entwickeln und Testen

So vermeidest du, dass `localhost` direkt auf die Live-Datenbank schreibt.

## Empfohlene Struktur

- Vercel nutzt immer die `NEXT_PUBLIC_FIREBASE_*` Werte vom **Live-Projekt**
- lokal nutzt `.env.local` immer die Werte vom **Test-Projekt**

## Repo-Stand

Im Repo ist `live` bereits als Firebase-CLI-Alias hinterlegt:

```json
{
  "projects": {
    "live": "mijija-live"
  }
}
```

Du musst lokal noch deinen `test`-Alias ergaenzen.

Beispiel:

```json
{
  "projects": {
    "live": "mijija-live",
    "test": "mijija-test-12345"
  }
}
```

## Env-Dateien

- `.env.live.example`
- `.env.test.example`
- für serverseitige Cron-/Admin-Jobs zusätzlich:
  - `CRON_SECRET`
  - `FIREBASE_ADMIN_PROJECT_ID`
  - `FIREBASE_ADMIN_CLIENT_EMAIL`
  - `FIREBASE_ADMIN_PRIVATE_KEY`

## Auto-Daily auf Hobby

Vercel Hobby erlaubt Cron-Jobs nur **einmal täglich**. Für das Daily um Berliner Mitternacht
nutzt das Projekt deshalb einen **stündlichen GitHub-Action-Trigger** statt Vercel-Cron.

Die Route bleibt:

- `/api/cron/daily-rollover`

Der Scheduler liegt in:

- `.github/workflows/daily-rollover.yml`

Benötigte GitHub-Repository-Secrets:

- `DAILY_CRON_URL`
  - z. B. `https://mijija.vercel.app/api/cron/daily-rollover`
- `CRON_SECRET`

Die Route selbst prüft dann:

- ob Auto-Daily im Admin aktiviert ist
- ob in `Europe/Berlin` gerade `00:00` ist
- ob für den Tag schon ein Daily existiert

Praktischer Ablauf:

1. Test-Projekt in Firebase anlegen
2. `.env.test.example` nach `.env.local` kopieren
3. dort die Web-Config des Test-Projekts eintragen
4. `npm run dev`

Dann laeuft `localhost` gegen das Testsystem.

## Deploy-Kommandos

Firestore Rules / Indexes:

- `npm run firebase:deploy:live`
- `npm run firebase:deploy:test`

Storage Rules:

- `npm run firebase:deploy:storage:live`
- `npm run firebase:deploy:storage:test`

## Wichtige Firebase-Schritte fuer das Test-Projekt

Im Test-Projekt ebenfalls aktivieren:

- Authentication
- Firestore Database
- Firebase Storage

Und dann:

- `Authentication > Settings > Authorized domains`
- `localhost` drin lassen
- spaeter optional auch eine eigene Test-Domain

## Empfehlung fuer euren Alltag

- lokal immer `test`
- Vercel immer `live`
- Admin-Operationen wie Import, Reset, Reroll zuerst in `test`
- erst danach bewusst auf `live`
