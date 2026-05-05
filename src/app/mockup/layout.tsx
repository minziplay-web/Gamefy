import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";

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
      className={`${geist.variable} ${geistMono.variable} min-h-dvh bg-black text-white`}
      style={{ fontFamily: "var(--mockup-body)" }}
    >
      {children}
    </div>
  );
}
