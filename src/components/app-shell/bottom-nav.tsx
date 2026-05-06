"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AvatarCircle } from "@/components/ui/avatar";
import {
  HomeNavIcon,
  LibraryNavIcon,
  PenNavIcon,
} from "@/components/app-shell/nav-icons";
import { useAuth } from "@/lib/auth/auth-context";

type Tab = {
  href: string;
  label: string;
  color: string;
  match: (pathname: string) => boolean;
  Icon: (props: { active: boolean }) => React.ReactNode;
};

const TABS: Tab[] = [
  {
    href: "/",
    label: "Daily",
    color: "#F39A2B", // sunny orange
    match: (p) => p === "/",
    Icon: ({ active }) => <HomeNavIcon active={active} />,
  },
  {
    href: "/daily",
    label: "Antworten",
    color: "#F0D043", // yellow — User-Decision: kein Pink/Magenta
    match: (p) => p === "/daily" || p.startsWith("/daily/"),
    Icon: ({ active }) => <PenNavIcon active={active} />,
  },
  {
    href: "/past-dailies",
    label: "Archiv",
    color: "#E5594F", // coral
    match: (p) => p.startsWith("/past-dailies"),
    Icon: ({ active }) => <LibraryNavIcon active={active} />,
  },
  // Profil-Tab is rendered separately because the icon = current user's avatar
];

const PROFIL: Omit<Tab, "Icon"> = {
  href: "/profile",
  label: "Profil",
  color: "#4A5699",
  match: (p) => p.startsWith("/profile"),
};

const IDLE = "#A8A8A8"; // muted text on dark bg

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const { authState } = useAuth();
  const profile = authState.status === "authenticated" ? authState.user : null;

  return (
    <nav
      className="safe-area-bottom fixed inset-x-0 bottom-0 z-30"
      style={{
        backgroundColor: "#000000",
        borderTop: "1px solid #1F1F1F",
      }}
      aria-label="Hauptnavigation"
    >
      <ul className="mx-auto grid max-w-screen-sm grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const color = active ? tab.color : IDLE;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="flex w-full flex-col items-center justify-center gap-1.5 py-3"
                style={{ color }}
              >
                <tab.Icon active={active} />
                <span
                  className="text-[10px] uppercase tracking-[0.16em]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color,
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}

        {/* Profil-Tab — Icon = Avatar of current user */}
        <li>
          <Link
            href={PROFIL.href}
            aria-current={PROFIL.match(pathname) ? "page" : undefined}
            className="flex w-full flex-col items-center justify-center gap-1.5 py-3"
          >
            <ProfilTabIcon
              active={PROFIL.match(pathname)}
              activeColor={PROFIL.color}
              displayName={profile?.displayName ?? "Du"}
              userId={profile?.userId ?? "anon"}
              photoURL={profile?.photoURL ?? null}
            />
            <span
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{
                fontFamily: "var(--font-mono)",
                color: PROFIL.match(pathname) ? PROFIL.color : IDLE,
                fontWeight: PROFIL.match(pathname) ? 600 : 500,
              }}
            >
              {PROFIL.label}
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function ProfilTabIcon({
  active,
  activeColor,
  displayName,
  userId,
  photoURL,
}: {
  active: boolean;
  activeColor: string;
  displayName: string;
  userId: string;
  photoURL: string | null;
}) {
  return (
    <span
      className="flex size-6 items-center justify-center rounded-full"
      style={{
        boxShadow: active ? `0 0 0 2px ${activeColor}` : "none",
      }}
    >
      <AvatarCircle
        member={{ userId, displayName, photoURL }}
        size="xs"
        className="size-6 text-[10px]"
      />
    </span>
  );
}

