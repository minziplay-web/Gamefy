import type { DailyRecapItem, MemberLite } from "@/lib/types/frontend";

// Test-only preview data. Consumers MUST gate any usage behind
// isTestFirebaseProject() so this never renders on the live project.
// See: src/app/(app)/resolved/page.tsx for the call site.

const previewMembers: MemberLite[] = [
  { userId: "preview-anna", displayName: "Anna", photoURL: null },
  { userId: "preview-marcel", displayName: "Marcel", photoURL: null },
  { userId: "preview-lisa", displayName: "Lisa", photoURL: null },
  { userId: "preview-tom", displayName: "Tom", photoURL: null },
  { userId: "preview-sara", displayName: "Sara", photoURL: null },
  { userId: "preview-johann", displayName: "Johann", photoURL: null },
];

export const PREVIEW_MEME_LEADERBOARD_RECAP_ITEM: DailyRecapItem = {
  dateKey: "2026-04-30",
  runId: "preview-run",
  questionId: "preview-meme-leaderboard",
  questionText: "Wie würdest du dieses Meme betiteln?",
  category: "pure_fun",
  result: {
    questionType: "meme_caption",
    imagePath: "/memes/Astronaut_Always_Has_Been.png",
    entries: [
      {
        text: "Wenn du Montag morgens merkst, dass es Dienstag ist",
        author: previewMembers[0],
        thumbsUpCount: 8,
        iVoted: false,
      },
      {
        text: "Wenn der Kaffee schon leer ist",
        author: previewMembers[1],
        thumbsUpCount: 5,
        iVoted: true,
      },
      {
        text: "POV: Du bist auf dem Weg zur Arbeit",
        author: previewMembers[2],
        thumbsUpCount: 4,
        iVoted: false,
      },
      {
        text: "Always has been",
        author: previewMembers[3],
        thumbsUpCount: 2,
        iVoted: false,
      },
      {
        text: "Mein Mood die ganze Woche",
        author: previewMembers[4],
        thumbsUpCount: 1,
        iVoted: false,
      },
      {
        text: "Plot twist incoming",
        author: previewMembers[5],
        thumbsUpCount: 0,
        iVoted: false,
      },
    ],
  },
};
