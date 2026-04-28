"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: HomeIcon },
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
