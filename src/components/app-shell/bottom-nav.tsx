"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/",
    label: "Home",
    icon: HomeIcon,
    activeClass: "border-brand-primary/45 bg-brand-soft text-brand-primary",
    idleClass: "border-brand-primary/16 bg-white text-sand-600",
  },
  {
    href: "/daily",
    label: "Fragen",
    iconSrc: "/home-icons/daily.svg",
    activeClass: "border-daily-primary/45 bg-daily-soft text-daily-text",
    idleClass: "border-daily-primary/16 bg-white text-sand-600",
  },
  {
    href: "/resolved",
    label: "Recap",
    iconSrc: "/home-icons/resolved.svg",
    activeClass: "border-recap-primary/45 bg-recap-soft text-recap-text",
    idleClass: "border-recap-primary/16 bg-white text-sand-600",
  },
  {
    href: "/past-dailies",
    label: "Archiv",
    iconSrc: "/home-icons/past.svg",
    activeClass: "border-archive-primary/45 bg-archive-soft text-archive-text",
    idleClass: "border-archive-primary/16 bg-white text-sand-600",
  },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="safe-area-bottom fixed inset-x-0 bottom-0 z-30 border-t border-sand-200/80 bg-white/92 shadow-[0_-18px_42px_-32px_rgba(23,32,49,0.38)] backdrop-blur-xl"
      aria-label="Hauptnavigation"
    >
      <ul className="mx-auto grid max-w-screen-sm grid-cols-4 gap-1.5 px-3 py-2">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-[1rem] border px-1 py-1 text-[10px] font-black uppercase tracking-[0.06em] shadow-card-flat transition active:scale-[0.97] ${
                  active ? item.activeClass : item.idleClass
                }`}
              >
                <span
                  className={`relative flex size-6 items-center justify-center rounded-lg ${
                    active ? "bg-white/72" : "bg-sand-50"
                  }`}
                >
                  {"iconSrc" in item ? (
                    <Image
                      src={item.iconSrc}
                      alt=""
                      fill
                      sizes="24px"
                      className="object-contain p-1"
                      aria-hidden
                    />
                  ) : (
                    <item.icon className="size-4.5" active={active} />
                  )}
                </span>
                <span className="leading-none">{item.label}</span>
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
      strokeWidth={active ? 2.5 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3.5 11.4 12 4.5l8.5 6.9" />
      <path d="M6 10.5V19a1 1 0 0 0 1 1h3.2v-5.4h3.6V20H17a1 1 0 0 0 1-1v-8.5" />
    </svg>
  );
}
