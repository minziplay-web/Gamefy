"use client";

import { useState } from "react";

// ---- Brand palette (aus den Home-Icons SVGs) ---------------------------------
const C = {
  daily: "#F39A2B",
  antworten: "#C45FA0",
  archiv: "#E5594F",
  profil: "#4A5699",
  yellow: "#F0D043",
  blueLight: "#6277BA",
  ink: "#172031",
  ink70: "#37465A",
  ink50: "#64768D",
  hair: "#DBE4EF",
  hairSoft: "#EEF2F7",
  white: "#FFFFFF",
} as const;

// ---- Mock data ---------------------------------------------------------------
type Friend = { id: string; name: string };

const FRIENDS: Friend[] = [
  { id: "u1", name: "Tom" },
  { id: "u2", name: "Lisa" },
  { id: "u3", name: "Marie" },
  { id: "u4", name: "Ben" },
  { id: "u5", name: "Anna" },
];

// stable hash → palette pick
function pickColor(seed: string): string {
  const palette = [C.daily, C.antworten, C.archiv, C.profil, C.blueLight, C.yellow];
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

// ---- Tiny SVG icons ----------------------------------------------------------
function HomeIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
      <path
        d="M3.5 11.4 12 4.5l8.5 6.9V19a1 1 0 0 1-1 1h-3.6v-5.4h-3.8V20H7.5a1 1 0 0 1-1-1v-7.6"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 1.6 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
      <path
        d="M14.7 4.5 19.5 9.3 8.6 20.2H3.8v-4.8L14.7 4.5Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 1.4 : 1.7}
        strokeLinejoin="round"
      />
      <path d="M13 6.2 17.8 11" stroke="currentColor" strokeWidth={1.7} fill="none" />
    </svg>
  );
}

function ArchiveIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
      <rect
        x="3.5"
        y="6.5"
        width="17"
        height="13"
        rx="1.6"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.7}
      />
      <path d="M3.5 10h17" stroke={filled ? "white" : "currentColor"} strokeWidth={1.4} />
      <path
        d="M9.5 13.5h5"
        stroke={filled ? "white" : "currentColor"}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden>
      <path
        d="M5.5 17.5h13M7.2 17.5V11a4.8 4.8 0 0 1 9.6 0v6.5M10.4 20.5a1.8 1.8 0 0 0 3.2 0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden>
      <path
        d="M5.6 5.6 18.4 18.4M18.4 5.6 5.6 18.4"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden>
      <path
        d="M4 5.5h16v10.5H10l-4 3.5v-3.5H4v-10.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
      <path
        d="m9.5 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth={1.7}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---- Atomic components -------------------------------------------------------
function Avatar({
  name,
  size = 36,
  ring,
}: {
  name: string;
  size?: number;
  ring?: string;
}) {
  const initial = name.slice(0, 1).toUpperCase();
  const bg = pickColor(name);
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-full text-white font-semibold leading-none select-none"
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        fontSize: Math.round(size * 0.42),
        fontFamily: "var(--mockup-body)",
        boxShadow: ring ? `0 0 0 2px ${ring}, 0 0 0 4px ${C.white}` : undefined,
      }}
    >
      {initial}
    </span>
  );
}

function CategoryPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
      style={{ color, fontFamily: "var(--mockup-mono)" }}
    >
      <span
        aria-hidden
        className="block h-1 w-1 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function ProgressBars({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-stretch gap-1">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < current - 1;
        const half = i === current - 1;
        return (
          <span
            key={i}
            className="h-[3px] flex-1 overflow-hidden rounded-full"
            style={{ backgroundColor: filled ? C.daily : "#FFFFFF40" }}
          >
            {half ? (
              <span
                className="block h-full"
                style={{ width: "55%", backgroundColor: C.daily }}
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

function MonoNumber({
  children,
  size = 12,
  color = C.ink50,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
}) {
  return (
    <span
      style={{
        fontFamily: "var(--mockup-mono)",
        fontSize: size,
        letterSpacing: "0.02em",
        color,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {children}
    </span>
  );
}

function SectionLabel({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="px-5 pt-10 pb-5">
      <div
        className="text-[10px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: C.ink50, fontFamily: "var(--mockup-mono)" }}
      >
        {eyebrow}
      </div>
      <h2
        className="mt-1.5 text-[26px] leading-[1.05] tracking-tight"
        style={{ fontFamily: "var(--mockup-display)", fontStyle: "italic", color: C.ink, fontWeight: 500 }}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-2 text-[13px] leading-snug" style={{ color: C.ink70 }}>
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}

// ---- Story slide (Daily reveal) ---------------------------------------------
function StorySlide() {
  const winnerVotes: Record<string, number> = { u1: 3, u2: 2 };
  const winnerName = "Tom";
  const winnerCount = 3;
  const total = 5;

  return (
    <div
      className="relative mx-5 overflow-hidden"
      style={{
        height: 620,
        backgroundColor: C.white,
        borderRadius: 24,
        boxShadow: `0 1px 0 ${C.hair}, 0 24px 48px -32px ${C.ink}26`,
      }}
    >
      {/* progress bars */}
      <div className="absolute inset-x-0 top-0 z-10 px-4 pt-3">
        <ProgressBars total={5} current={3} />
      </div>

      {/* top chrome */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-7">
        <button
          aria-label="Schließen"
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ color: C.ink, backgroundColor: "transparent" }}
        >
          <CloseIcon />
        </button>
        <MonoNumber size={11} color={C.ink50}>
          03 / 05
        </MonoNumber>
      </div>

      {/* category eyebrow */}
      <div className="absolute left-5 right-5 top-[68px]">
        <CategoryPill label="Charakter · Single Choice" color={C.daily} />
      </div>

      {/* hero question */}
      <div className="absolute left-5 right-5 top-[110px]">
        <h3
          className="text-[34px] leading-[1.04] tracking-[-0.01em] text-balance"
          style={{
            fontFamily: "var(--mockup-display)",
            fontStyle: "italic",
            fontWeight: 500,
            color: C.ink,
          }}
        >
          Wer würde am ehesten in einem Marathon mitten in der Strecke umfallen?
        </h3>
      </div>

      {/* divider */}
      <div
        className="absolute left-5 right-5 top-[300px] h-px"
        style={{ backgroundColor: C.hairSoft }}
      />

      {/* reveal block — magazine spread */}
      <div className="absolute left-5 right-5 top-[316px]">
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: C.ink50, fontFamily: "var(--mockup-mono)" }}
        >
          Auflösung
        </div>

        <div className="mt-3 flex items-end gap-3">
          <span
            className="block leading-[0.86] tracking-[-0.02em]"
            style={{
              fontFamily: "var(--mockup-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: 84,
              color: C.ink,
            }}
          >
            {winnerName}
          </span>
          <div className="pb-3">
            <MonoNumber size={28} color={C.daily}>
              {winnerCount}
            </MonoNumber>
            <span
              className="ml-1 text-[12px] uppercase tracking-[0.18em]"
              style={{ color: C.ink50, fontFamily: "var(--mockup-mono)" }}
            >
              von {total}
            </span>
          </div>
        </div>

        {/* who voted for whom */}
        <div className="mt-6 flex flex-col gap-2">
          {[
            { voter: "Lisa", picked: "Tom" },
            { voter: "Marie", picked: "Tom" },
            { voter: "Ben", picked: "Tom" },
            { voter: "Tom", picked: "Lisa" },
            { voter: "Anna", picked: "Lisa" },
          ].map((row) => (
            <div key={row.voter} className="flex items-center gap-3">
              <Avatar name={row.voter} size={26} />
              <span
                className="text-[13px]"
                style={{ color: C.ink, fontWeight: 500 }}
              >
                {row.voter}
              </span>
              <span className="text-[13px]" style={{ color: C.ink50 }}>
                tippt auf
              </span>
              <span
                className="text-[13px]"
                style={{
                  color: winnerVotes[row.picked === "Tom" ? "u1" : "u2"]
                    ? C.ink
                    : C.ink70,
                  fontWeight: row.picked === winnerName ? 600 : 400,
                }}
              >
                {row.picked}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* comment trigger */}
      <button
        className="absolute inset-x-5 bottom-5 flex items-center justify-between border-t pt-4"
        style={{ borderColor: C.hairSoft, color: C.ink }}
      >
        <span className="flex items-center gap-2">
          <CommentIcon />
          <span className="text-[13px] font-medium">5 Kommentare</span>
        </span>
        <MonoNumber size={11} color={C.ink50}>
          ZIEHEN
        </MonoNumber>
      </button>
    </div>
  );
}

// ---- Reddit-dense list -------------------------------------------------------
type ListItem = {
  index: number;
  category: string;
  color: string;
  question: string;
  answeredBy: string[];
  comments: number;
};

const LIST_ITEMS: ListItem[] = [
  {
    index: 1,
    category: "Glück",
    color: C.archiv,
    question: "Wer hatte heute den glücklichsten Zufall?",
    answeredBy: ["Tom", "Lisa", "Marie", "Ben", "Anna"],
    comments: 3,
  },
  {
    index: 2,
    category: "Charakter",
    color: C.daily,
    question: "Wer würde am ehesten den ganzen Sommer nur Pasta essen?",
    answeredBy: ["Tom", "Lisa", "Marie", "Ben"],
    comments: 7,
  },
  {
    index: 3,
    category: "Charakter",
    color: C.daily,
    question: "Wer würde am ehesten in einem Marathon mitten in der Strecke umfallen?",
    answeredBy: ["Tom", "Lisa", "Marie", "Ben", "Anna"],
    comments: 5,
  },
  {
    index: 4,
    category: "Beziehung",
    color: C.antworten,
    question: "Mit wem würde Tom am ehesten ein Roadtrip machen ohne Plan?",
    answeredBy: ["Tom", "Lisa", "Marie"],
    comments: 1,
  },
  {
    index: 5,
    category: "Meme",
    color: C.profil,
    question: "Bestes Caption für dieses Bild von Ben am Strand?",
    answeredBy: ["Tom", "Lisa", "Marie", "Ben", "Anna"],
    comments: 12,
  },
];

function ListRow({ item, last }: { item: ListItem; last?: boolean }) {
  return (
    <article
      className="relative flex items-start gap-4 px-5 py-3.5"
      style={{
        borderBottom: last ? "none" : `1px solid ${C.hairSoft}`,
      }}
    >
      <span
        className="leading-none"
        style={{
          fontFamily: "var(--mockup-mono)",
          fontSize: 22,
          color: C.hair,
          fontWeight: 500,
          width: 28,
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(item.index).padStart(2, "0")}
      </span>

      <div className="min-w-0 flex-1">
        <CategoryPill label={item.category} color={item.color} />
        <h4
          className="mt-1.5 text-[14px] leading-snug line-clamp-2"
          style={{ color: C.ink, fontWeight: 500 }}
        >
          {item.question}
        </h4>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex -space-x-1.5">
            {item.answeredBy.slice(0, 4).map((name) => (
              <Avatar key={name} name={name} size={20} ring={C.white} />
            ))}
          </div>
          {item.answeredBy.length > 4 ? (
            <MonoNumber size={11} color={C.ink50}>
              +{item.answeredBy.length - 4}
            </MonoNumber>
          ) : null}
          <span
            aria-hidden
            className="block h-3 w-px"
            style={{ backgroundColor: C.hair }}
          />
          <span
            className="flex items-center gap-1 text-[11px]"
            style={{ color: C.ink50 }}
          >
            <CommentIcon />
            <MonoNumber size={11} color={C.ink50}>
              {item.comments}
            </MonoNumber>
          </span>
        </div>
      </div>

      <div className="pt-2" style={{ color: C.hair }}>
        <ChevronRight />
      </div>
    </article>
  );
}

// ---- Notification panel ------------------------------------------------------
type ActivityRow = {
  who: string;
  action: string;
  detail?: string;
  ago: string;
};

const ACTIVITY: ActivityRow[] = [
  { who: "Tom", action: "hat Frage 4 beantwortet", ago: "vor 12 min" },
  { who: "Lisa", action: "hat Frage 3 beantwortet", ago: "vor 23 min" },
  {
    who: "Marie",
    action: "hat einen Kommentar geschrieben",
    detail: "„boah jaaa der würde sowas von umfallen“",
    ago: "vor 1 h",
  },
  { who: "Ben", action: "hat Frage 2 beantwortet", ago: "vor 2 h" },
  { who: "Anna", action: "hat Frage 1 beantwortet", ago: "vor 3 h" },
];

function NotificationPanel() {
  const answered = 2;
  const total = 5;
  const open = total - answered;

  return (
    <div
      className="mx-5 overflow-hidden"
      style={{
        backgroundColor: C.white,
        borderRadius: 20,
        border: `1px solid ${C.hair}`,
      }}
    >
      {/* sticky CTA */}
      <button
        className="relative flex w-full items-center gap-4 px-5 py-4 text-left"
        style={{ borderBottom: `1px solid ${C.hairSoft}` }}
      >
        <div className="flex-1">
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: C.daily, fontFamily: "var(--mockup-mono)" }}
          >
            Daily heute
          </div>
          <div
            className="mt-1 text-[20px] leading-tight tracking-tight"
            style={{
              fontFamily: "var(--mockup-display)",
              fontStyle: "italic",
              fontWeight: 500,
              color: C.ink,
            }}
          >
            {open} Fragen noch offen
          </div>
          {/* progress */}
          <div className="mt-3 flex items-center gap-2">
            <div
              className="relative h-1 flex-1 overflow-hidden rounded-full"
              style={{ backgroundColor: C.hairSoft }}
            >
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${(answered / total) * 100}%`,
                  backgroundColor: C.daily,
                }}
              />
            </div>
            <MonoNumber size={11} color={C.ink50}>
              {answered}/{total}
            </MonoNumber>
          </div>
        </div>
        <span style={{ color: C.daily }}>
          <ChevronRight />
        </span>
      </button>

      {/* log header */}
      <div className="flex items-end justify-between px-5 pt-5 pb-2">
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: C.ink50, fontFamily: "var(--mockup-mono)" }}
        >
          Heute · Tageslog
        </div>
        <MonoNumber size={10} color={C.ink50}>
          {ACTIVITY.length} Events
        </MonoNumber>
      </div>

      {/* events */}
      <ul>
        {ACTIVITY.map((row, idx) => (
          <li
            key={idx}
            className="flex items-start gap-3 px-5 py-3"
            style={{
              borderTop: idx === 0 ? "none" : `1px solid ${C.hairSoft}`,
            }}
          >
            <Avatar name={row.who} size={28} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-snug" style={{ color: C.ink }}>
                <span style={{ fontWeight: 600 }}>{row.who}</span>{" "}
                <span style={{ color: C.ink70 }}>{row.action}</span>
              </p>
              {row.detail ? (
                <p
                  className="mt-1 text-[12px] italic leading-snug"
                  style={{
                    color: C.ink50,
                    fontFamily: "var(--mockup-display)",
                    fontWeight: 400,
                  }}
                >
                  {row.detail}
                </p>
              ) : null}
            </div>
            <MonoNumber size={10} color={C.ink50}>
              {row.ago}
            </MonoNumber>
          </li>
        ))}
      </ul>

      <div
        className="px-5 py-3 text-center"
        style={{ borderTop: `1px solid ${C.hairSoft}` }}
      >
        <MonoNumber size={10} color={C.ink50}>
          MITTERNACHT BERLIN · LOG RESET
        </MonoNumber>
      </div>
    </div>
  );
}

// ---- Bottom nav (live, fixed) -----------------------------------------------
type Tab = "daily" | "antworten" | "archiv" | "profil";

const TABS: { id: Tab; label: string; color: string }[] = [
  { id: "daily", label: "Daily", color: C.daily },
  { id: "antworten", label: "Antworten", color: C.antworten },
  { id: "archiv", label: "Archiv", color: C.archiv },
  { id: "profil", label: "Profil", color: C.profil },
];

function BottomNav({
  active,
  onChange,
  fixed = false,
}: {
  active: Tab;
  onChange?: (t: Tab) => void;
  fixed?: boolean;
}) {
  return (
    <nav
      className={
        fixed
          ? "fixed inset-x-0 bottom-0 z-30 mx-auto max-w-screen-sm"
          : "relative mx-5"
      }
      style={{
        backgroundColor: C.white,
        borderTop: `1px solid ${C.hair}`,
        boxShadow: fixed ? `0 -16px 36px -28px ${C.ink}30` : "none",
      }}
      aria-label="Hauptnavigation"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((t) => {
          const isActive = active === t.id;
          const color = isActive ? t.color : C.ink50;
          return (
            <li key={t.id}>
              <button
                onClick={() => onChange?.(t.id)}
                className="flex w-full flex-col items-center justify-center gap-1.5 py-3 transition-colors"
                style={{ color }}
                aria-current={isActive ? "page" : undefined}
              >
                <span style={{ color }}>
                  {t.id === "daily" ? (
                    <HomeIcon filled={isActive} />
                  ) : t.id === "antworten" ? (
                    <PencilIcon filled={isActive} />
                  ) : t.id === "archiv" ? (
                    <ArchiveIcon filled={isActive} />
                  ) : (
                    <ProfilNavIcon filled={isActive} />
                  )}
                </span>
                <span
                  className="text-[10px] uppercase tracking-[0.18em]"
                  style={{
                    fontFamily: "var(--mockup-mono)",
                    color,
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {t.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ProfilNavIcon({ filled = false }: { filled?: boolean }) {
  // Avatar-ähnlich, kreisig — Profil bekommt einen Mini-Avatar als Icon
  return (
    <span
      className="flex items-center justify-center rounded-full"
      style={{
        width: 24,
        height: 24,
        backgroundColor: filled ? C.profil : "transparent",
        border: filled ? "none" : `1.7px solid ${C.ink50}`,
        color: filled ? C.white : C.ink50,
        fontFamily: "var(--mockup-body)",
        fontWeight: 600,
        fontSize: 11,
      }}
    >
      L
    </span>
  );
}

// ---- Top bar -----------------------------------------------------------------
function TopBar({ activeLabel }: { activeLabel: string }) {
  return (
    <header
      className="sticky top-0 z-20 mx-auto flex max-w-screen-sm items-center justify-between bg-white/95 px-5 py-3.5 backdrop-blur"
      style={{ borderBottom: `1px solid ${C.hairSoft}` }}
    >
      <div className="flex items-baseline gap-2">
        <span
          className="text-[18px] tracking-tight"
          style={{
            fontFamily: "var(--mockup-display)",
            fontStyle: "italic",
            fontWeight: 600,
            color: C.ink,
          }}
        >
          mijija
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.22em]"
          style={{ color: C.ink50, fontFamily: "var(--mockup-mono)" }}
        >
          · {activeLabel}
        </span>
      </div>
      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-full"
        style={{ color: C.ink }}
        aria-label="Tageslog"
      >
        <BellIcon />
        <span
          className="absolute right-1.5 top-1.5 block h-2 w-2 rounded-full"
          style={{ backgroundColor: C.archiv, boxShadow: `0 0 0 2px ${C.white}` }}
        />
      </button>
    </header>
  );
}

// ---- Mini-frame to demo a UI state -------------------------------------------
function FrameLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-2 px-1 text-[10px] uppercase tracking-[0.22em]"
      style={{ color: C.ink50, fontFamily: "var(--mockup-mono)" }}
    >
      {children}
    </div>
  );
}

// ---- Page --------------------------------------------------------------------
export default function MockupV1Page() {
  const [activeTab, setActiveTab] = useState<Tab>("daily");

  return (
    <div className="mx-auto min-h-dvh max-w-screen-sm pb-32" style={{ backgroundColor: C.white }}>
      <TopBar activeLabel={TABS.find((t) => t.id === activeTab)?.label ?? "Daily"} />

      {/* Hero */}
      <section className="px-5 pt-8 pb-2">
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: C.ink50, fontFamily: "var(--mockup-mono)" }}
        >
          Mockup · v1 · Look-Check
        </div>
        <h1
          className="mt-3 text-[42px] leading-[0.98] tracking-[-0.02em] text-balance"
          style={{
            fontFamily: "var(--mockup-display)",
            fontStyle: "italic",
            fontWeight: 500,
            color: C.ink,
          }}
        >
          Sieht das nach <span style={{ fontWeight: 700 }}>uns</span> aus?
        </h1>
        <p
          className="mt-4 text-[14px] leading-relaxed"
          style={{ color: C.ink70 }}
        >
          Ein paar Surfaces der Redesign-Idee. Statisch, mit Mock-Freunden Tom, Lisa,
          Marie, Ben, Anna. Wenn der Vibe stimmt, übernehme ich die Komponenten in das
          echte Stage 0. Wenn nicht — sag was zu hart, was zu lasch, was rauskickt.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <span
            aria-hidden
            className="block h-[2px] flex-1"
            style={{ backgroundColor: C.ink }}
          />
          <MonoNumber size={10} color={C.ink50}>
            5 SECTIONS
          </MonoNumber>
        </div>
      </section>

      {/* Section 1 — Story slide */}
      <section>
        <SectionLabel
          eyebrow="01 · Story"
          title="Eine Frage, edge-to-edge"
          subtitle="So fühlt sich Daily/Antworten/Archiv-Detail an. Frage als Headline (Fraunces Italic), Antworten als das „Bild“ darunter. Atmet, kein Card-Drumherum, kein Beige."
        />
        <StorySlide />
      </section>

      {/* Section 2 — list density */}
      <section>
        <SectionLabel
          eyebrow="02 · Liste"
          title="Tagesübersicht im Reddit-Modus"
          subtitle="Listen sind eng, kein Card-pro-Item. Nummern in Mono, Hairline-Trenner, Avatare gestaffelt. Genug Info pro Bildschirm ohne sich aufgeplustert anzufühlen."
        />
        <div
          className="mx-5"
          style={{
            backgroundColor: C.white,
            borderRadius: 20,
            border: `1px solid ${C.hair}`,
          }}
        >
          <div
            className="flex items-end justify-between px-5 pt-4 pb-2"
            style={{ borderBottom: `1px solid ${C.hairSoft}` }}
          >
            <div>
              <MonoNumber size={10} color={C.ink50}>
                MO · 04. MAI 2026
              </MonoNumber>
              <h3
                className="mt-1 text-[20px] tracking-tight"
                style={{
                  fontFamily: "var(--mockup-display)",
                  fontStyle: "italic",
                  fontWeight: 500,
                  color: C.ink,
                }}
              >
                Daily · 5 Fragen
              </h3>
            </div>
            <MonoNumber size={11} color={C.ink50}>
              28 KOMM.
            </MonoNumber>
          </div>
          {LIST_ITEMS.map((item, idx) => (
            <ListRow
              key={item.index}
              item={item}
              last={idx === LIST_ITEMS.length - 1}
            />
          ))}
        </div>
      </section>

      {/* Section 3 — notification panel */}
      <section>
        <SectionLabel
          eyebrow="03 · Tageslog"
          title="Bell oben rechts öffnet das"
          subtitle="Sticky-CTA bringt dich zum Beantworten, darunter chronologisch was heute passiert ist. Reset um Berlin-Mitternacht."
        />
        <NotificationPanel />
      </section>

      {/* Section 4 — bottom nav states */}
      <section>
        <SectionLabel
          eyebrow="04 · Bottom-Nav"
          title="Vier Tabs, Icon-Swap aktiv"
          subtitle="Klick auf einen Tab unten — der wandert in den aktiven Zustand (gefülltes Icon, Tab-Farbe). Profil-Icon ist dein Avatar."
        />
        <div className="space-y-6 px-5">
          <div>
            <FrameLabel>Live · interaktiv</FrameLabel>
            <BottomNav active={activeTab} onChange={setActiveTab} />
          </div>
          <div>
            <FrameLabel>Alle Active-States nebeneinander</FrameLabel>
            <div className="space-y-3">
              {TABS.map((t) => (
                <div key={t.id}>
                  <div
                    className="mb-1 text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: t.color, fontFamily: "var(--mockup-mono)" }}
                  >
                    {t.label} aktiv
                  </div>
                  <BottomNav active={t.id} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 — avatars */}
      <section>
        <SectionLabel
          eyebrow="05 · Avatare"
          title="Initialen, deterministisch gefärbt"
          subtitle="Kein Foto? Keine Sorge. Jeder Name kriegt eine stabile Farbe aus der Markenpalette."
        />
        <div className="px-5">
          <div className="flex flex-wrap gap-4">
            {FRIENDS.map((f) => (
              <div key={f.id} className="flex flex-col items-center gap-2">
                <Avatar name={f.name} size={56} />
                <span className="text-[12px]" style={{ color: C.ink70 }}>
                  {f.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing strip */}
      <section className="px-5 pt-12 pb-6">
        <div
          className="flex items-center gap-3"
          style={{ borderTop: `1px solid ${C.hair}`, paddingTop: 16 }}
        >
          <MonoNumber size={10} color={C.ink50}>
            ENDE · {new Date().getFullYear()}
          </MonoNumber>
          <span
            aria-hidden
            className="block h-px flex-1"
            style={{ backgroundColor: C.hairSoft }}
          />
          <MonoNumber size={10} color={C.ink50}>
            MIJIJA REDESIGN
          </MonoNumber>
        </div>
      </section>

      {/* Fixed bottom nav (real-feel) */}
      <BottomNav active={activeTab} onChange={setActiveTab} fixed />
    </div>
  );
}
