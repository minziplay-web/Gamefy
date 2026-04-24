# Gameapp

Private mobile-first Web-App fuer eine feste Freundesgruppe.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Firebase Auth / Firestore
- Vercel

## Setup

1. `npm install`
2. `.env.example` nach `.env.local` kopieren
3. Firebase-Werte eintragen
4. `npm run dev`
5. optional mit Firebase CLI deployen:
   - `firebase init firestore`
   - `firebase deploy --only firestore:rules,firestore:indexes`

## Wichtige Pfade

- `src/lib/firebase/client.ts`
- `src/lib/auth/auth-context.tsx`
- `src/lib/mocks/`
- `src/lib/mapping/`
- `src/components/`
- `src/app/`

## Dokumentation

- `docs/backend-spec-v1.md`
- `docs/frontend-spec-v1.md`
- `docs/claude-handoff.md`

## Firebase Dateien

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
