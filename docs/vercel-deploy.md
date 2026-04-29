# Vercel Deploy

## Ziel

Die App so deployen, dass deine Freunde sie ueber eine normale URL nutzen koennen.

## Voraussetzungen

- GitHub-Repo ist vorhanden
- Firebase-Projekt ist eingerichtet
- Firestore Rules und Indexes sind bereits deployt

## 1. Vercel-Projekt anlegen

1. [Vercel](https://vercel.com/) oeffnen
2. `Add New Project`
3. GitHub-Repo `minziplay-web/mijija-live` importieren
4. Framework sollte automatisch als `Next.js` erkannt werden

## 2. Environment Variables setzen

Diese Variablen in Vercel eintragen:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

Hinweis:

- dieselben Werte wie lokal aus `.env.local`
- `MEASUREMENT_ID` kann leer bleiben

## 3. Deploy

Nach dem ersten Deploy erzeugt Vercel eine URL wie:

- `https://mijija.vercel.app`

oder eine Preview-URL pro Commit.

## 4. Firebase fuer die echte Domain freischalten

In Firebase:

1. `Authentication`
2. `Settings`
3. `Authorized domains`
4. Vercel-Domain hinzufuegen

Wichtig:

- `Email/Password` muss aktiviert sein
- `Magic Link` wird fuer dieses Projekt aktuell nicht verwendet

## 5. Erster Admin

Nach dem ersten Login:

1. Firestore oeffnen
2. `users/{uid}` suchen
3. `role` auf `admin` setzen

Dann sind verfuegbar:

- `/admin`
- Fragen importieren
- Daily erzeugen
- Live-Lobby hosten

## 6. Empfehlter erster Live-Test

1. du als Admin
2. 1-2 Freunde als normale Member
3. testen:
   - Registrierung / Login
   - Onboarding
   - Daily beantworten
   - Lobby erstellen
   - Live joinen
   - Profil pruefen

## 7. Falls etwas nicht geht

Zuerst pruefen:

1. sind alle `NEXT_PUBLIC_FIREBASE_*` Variablen in Vercel gesetzt?
2. ist die Vercel-Domain in Firebase `Authorized domains`?
3. ist `Email/Password` in Firebase aktiv?
4. sind `firestore.rules` und `firestore.indexes.json` deployt?
