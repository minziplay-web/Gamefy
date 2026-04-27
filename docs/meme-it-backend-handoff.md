# "Meme it" — Backend-Handoff für Codex/ChatGPT

Stand: Frontend ist fertig — Live-Preview im Input (Impact-Style Text auf Bild),
Reveal als Karussell mit Herz pro Meme. Votes laufen aktuell **nur lokal**
im React-State. Damit das persistiert, braucht es die unten beschriebenen Backend-
Ergänzungen.

## 1. Frontend-Vertrag (was bereits da ist)

### Question-Side
- Neuer `QuestionType`: `"meme_caption"`
- `QuestionDoc.imagePath?: string` (Pfad relativ zu `public/`, z. B. `/memes/Bossy_Boots.webp`)
- `DailyRunItemDoc.questionSnapshot.imagePath?: string` (für persistierte Snapshots)
- Antwort wird in `DailyAnswerDoc.textAnswer` gespeichert (gleich wie `open_text`)

### Result-Vertrag (`MemeCaptionResult` in [src/lib/types/frontend.ts](src/lib/types/frontend.ts))
```ts
{
  questionType: "meme_caption";
  anonymous: boolean;
  imagePath: string;
  entries: Array<{
    text: string;                  // die Bildunterschrift
    author?: MemberLite;           // Autor (für meme_it immer gesetzt, da non-anonymous)
    thumbsUpCount?: number;        // ⭐ Backend muss füllen
    iVoted?: boolean;              // ⭐ Backend muss füllen (true wenn aktueller User schon geliked hat)
  }>;
}
```

`thumbsUpCount` und `iVoted` sind aktuell `undefined` — Frontend zeigt 0/false als
Default. Sobald der Mapper sie liefert, funktioniert das Reveal sofort persistent.

## 2. Was du im Backend bauen musst

### A) Neue Collection: `dailyMemeVotes`

Pro Vote ein Dokument. Doc-ID-Schema:
```
{dateKey}_{questionId}_{authorUserId}_{voterUserId}
```

Damit ist sichergestellt: ein User kann pro Meme genau einmal liken (idempotent).

Frontend-Type (schon angelegt in [src/lib/types/firestore.ts](src/lib/types/firestore.ts)):
```ts
interface DailyMemeVoteDoc {
  dateKey: string;
  questionId: string;
  authorUserId: string;     // wer das Meme gepostet hat
  voterUserId: string;      // wer geliked hat
  createdAt?: Timestamp;
}
```

**Selbst-Voten erlauben?** Empfehlung: ja, ist harmlos. Falls nein, im Action-Handler
verbieten (`authorUserId !== voterUserId`).

### B) Action: Vote setzen / entfernen

Neue Funktion `submitMemeCaptionVote` in [src/lib/firebase/daily-actions.ts](src/lib/firebase/daily-actions.ts):

```ts
export async function submitMemeCaptionVote(params: {
  dateKey: string;
  questionId: string;
  authorUserId: string;
  voterUserId: string;
  on: boolean;              // true = setzen, false = entfernen
}) {
  const docId = `${params.dateKey}_${params.questionId}_${params.authorUserId}_${params.voterUserId}`;
  const ref = dailyMemeVoteDoc(docId);
  if (!ref) throw new Error("Firestore nicht verfügbar.");

  if (params.on) {
    await setDoc(ref, {
      dateKey: params.dateKey,
      questionId: params.questionId,
      authorUserId: params.authorUserId,
      voterUserId: params.voterUserId,
      createdAt: serverTimestamp(),
    } satisfies DailyMemeVoteDoc);
  } else {
    await deleteDoc(ref);
  }
}
```

Validierung:
- Run muss `active` sein (analog zu `submitDailyAnswer`)
- Frage muss zum aktuellen Run gehören
- Frage muss `type: "meme_caption"` sein
- Author muss tatsächlich eine `dailyAnswers`-Entry für diese Frage haben (sonst auf Geist liken)

### C) Listener + Mapper-Extension

In [src/lib/firebase/daily.ts](src/lib/firebase/daily.ts) `useDailyViewState`:

1. **Neuer Listener** auf `dailyMemeVotes` für `dateKey`:
   ```ts
   onSnapshot(
     query(memeVotesCollection(), where("dateKey", "==", dateKey)),
     (snapshot) => {
       memeVotes = snapshot.docs.map(d => d.data() as DailyMemeVoteDoc);
       emit();
     },
     handleError("Meme-Votes"),
   );
   ```

2. **Übergabe an `mapQuestionResult`**: zusätzlicher Parameter `memeVotes: DailyMemeVoteDoc[]`,
   gefiltert nach `questionId`.

3. **Im `case "meme_caption"`** in `mapQuestionResult`:
   ```ts
   case "meme_caption":
     return {
       questionType: "meme_caption",
       anonymous: false,
       imagePath: question.imagePath,
       entries: publicAnswers
         .filter((answer) => answer.textAnswer)
         .map((answer) => {
           const votesForThisMeme = memeVotes.filter(
             v => v.questionId === answer.questionId && v.authorUserId === answer.userId
           );
           return {
             text: answer.textAnswer!,
             author: members?.get(answer.userId),
             thumbsUpCount: votesForThisMeme.length,
             iVoted: votesForThisMeme.some(v => v.voterUserId === currentUserId),
           };
         }),
     };
   ```

   Du brauchst dafür `currentUserId` im Mapper — entweder als optionaler Parameter
   reinreichen, oder den Mapper-Aufruf anpassen.

### D) Frontend-Plumbing für `onVote`

`MemeCaptionReveal` in [src/components/daily/question-reveal.tsx](src/components/daily/question-reveal.tsx)
nimmt schon eine optionale `onVote?: (authorUserId, value) => Promise<void>` Prop entgegen
und macht optimistic update + Rollback bei Error. Du musst sie nur durchreichen:

`QuestionReveal` → neue Prop `onVoteMemeCaption?` →
`QuestionCardShell` → neue Prop →
`DailyScreen` → neue Prop `onVoteMemeCaption?` →
in `app/(app)/daily/page.tsx` an `submitMemeCaptionVote` binden mit
`dateKey`, `questionId` (aus dem Card-Context), `voterUserId` (aktueller User).

### E) Firestore Rules

Neue Rule für `dailyMemeVotes`:

```
match /dailyMemeVotes/{voteId} {
  allow read: if isSignedIn();
  allow create: if isSignedIn()
                && request.auth.uid == request.resource.data.voterUserId
                && voteId == request.resource.data.dateKey + "_"
                          + request.resource.data.questionId + "_"
                          + request.resource.data.authorUserId + "_"
                          + request.resource.data.voterUserId;
  allow delete: if isSignedIn() && resource.data.voterUserId == request.auth.uid;
  allow update: if false;  // Votes sind immutable, nur create/delete
}
```

`textAnswer` auf `dailyAnswers` für `meme_caption` muss schon erlaubt sein (gleiche
Schreibregel wie `open_text` — die textAnswer-Validierung ist type-agnostisch).
Bitte verifizieren, dass `meme_caption` im erlaubten Question-Type-Set steht.

### F) Admin-Import

Der Admin-JSON-Import muss `imagePath` als optionales Feld auf `QuestionDoc`
durchschreiben. Aktuell unbekannt, ob euer Validator das Feld droppt — kurz prüfen.

### G) Daily-Run-Generator

Wenn der Generator `questionSnapshot` schreibt, muss `imagePath` mit kopiert werden,
sonst geht das Bild bei späterer Question-Löschung verloren. Snapshot-Type ist schon
erweitert in `DailyRunItemDoc.questionSnapshot.imagePath?: string`.

## 3. Optionale Optimierungen

- **Aggregate-Doc** mit `counts: Record<authorUserId, number>` statt einzelne
  Vote-Docs auflisten. Spart Reads bei vielen Votes. Für eine 15-Personen-Gruppe
  aber nicht nötig — bleib bei einzelnen Vote-Docs, das ist simpler.
- **Reveal-Policy**: aktuell sind Memes (wie open_text) `targetMode: "daily"`. Reveal
  passiert genauso wie bei open_text — keine Sonderbehandlung nötig.

## 4. Was Frontend NICHT macht (und du auch nicht brauchst)

- Kein Canvas-Rendering / Image-Generation. Caption liegt nur als String vor und wird
  per CSS-Overlay gezeichnet. Wenn ihr später Sharing/Download wollt: dann Canvas.
- Keine Animationen / Confetti bei Vote.
- Keine Voter-Liste pro Meme (analog zu duel-VoterRows). Nur Count + iVoted.
  Falls gewünscht später erweiterbar — dazu reicht es, in `entries[]` eine
  `voters?: MemberLite[]` zu ergänzen und im Mapper aus `dailyMemeVotes`-Docs
  via `members.get(voterUserId)` zu mappen.

## 5. TL;DR Checkliste für Codex

- [ ] Collection `dailyMemeVotes` anlegen (kein Index nötig — Composite-ID reicht)
- [ ] `submitMemeCaptionVote` Action in `src/lib/firebase/daily-actions.ts`
- [ ] `dailyMemeVoteDoc()` Collection-Helper in `src/lib/firebase/collections.ts`
- [ ] Listener in `useDailyViewState` + Mapper-Extension für `thumbsUpCount` / `iVoted`
- [ ] Prop `onVoteMemeCaption` durch `DailyScreen → QuestionCardShell → QuestionReveal` plumben
- [ ] Page-Level Wiring in `app/(app)/daily/page.tsx`
- [ ] Firestore-Rules für `dailyMemeVotes`
- [ ] Verifizieren: Admin-Import lässt `imagePath` durch
- [ ] Verifizieren: Daily-Run-Generator kopiert `imagePath` in Snapshot
- [ ] Verifizieren: `meme_caption` ist im erlaubten Question-Type-Set in den Rules
