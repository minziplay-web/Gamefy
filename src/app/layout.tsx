import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Providers } from "@/app/providers";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Mijija",
  description: "Mijija ist eure private mobile-first Freundesgruppe-App.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
