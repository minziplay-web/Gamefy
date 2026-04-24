"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/daily", label: "Daily", icon: DailyIcon },
  { href: "/lobby", label: "Lobby", icon: LobbyIcon },
  { href: "/profile", label: "Profil", icon: ProfileIcon },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="safe-area-bottom fixed inset-x-0 bottom-0 z-30 border-t border-sand-100 bg-cream/95 backdrop-blur"
      aria-label="Hauptnavigation"
    >
      <ul className="mx-auto flex max-w-screen-sm items-stretch justify-around gap-1 px-3 py-2">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1 text-[11px] font-semibold transition ${
                  active
                    ? "text-coral-strong"
                    : "text-sand-500 hover:text-sand-800"
                }`}
              >
                <Icon className="size-6" active={active} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon({ className, active }: { className?: string; active: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.4 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9.5a.5.5 0 0 0 .5.5H9.5v-6h5v6h4a.5.5 0 0 0 .5-.5V10" />
    </svg>
  );
}

function DailyIcon({ className, active }: { className?: string; active: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.4 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="M12 14.5v0M12 17.5v0" strokeWidth={active ? 3.2 : 2.6} />
    </svg>
  );
}

function LobbyIcon({ className, active }: { className?: string; active: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.4 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="9" r="3.2" />
      <circle cx="17" cy="9.5" r="2.6" />
      <path d="M3 19c.8-2.8 3.3-4.5 6-4.5s5.2 1.7 6 4.5" />
      <path d="M14.5 19c.6-2 2.2-3.3 4-3.3s3.4 1.3 4 3.3" />
    </svg>
  );
}

function ProfileIcon({ className, active }: { className?: string; active: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.4 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 19.5c1.2-3.3 4.1-5.3 7.5-5.3s6.3 2 7.5 5.3" />
    </svg>
  );
}
