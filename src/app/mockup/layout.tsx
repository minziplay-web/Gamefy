import type { ReactNode } from "react";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--mockup-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--mockup-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--mockup-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata = {
  title: "Mijija · IG-Redesign Mockup v1",
  robots: { index: false, follow: false },
};

export default function MockupLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${fraunces.variable} ${geist.variable} ${geistMono.variable} min-h-dvh bg-white text-[#172031]`}
      style={{ fontFamily: "var(--mockup-body)" }}
    >
      {children}
    </div>
  );
}
