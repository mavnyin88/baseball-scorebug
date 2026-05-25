import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Baseball Scorebug — Live MLB scores, scorebug and stats",
    template: "%s · MLB Scorebug",
  },
  description:
    "Live MLB scoreboard and per-game scorebug. Real-time inning, count, and bases.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-zinc-100">
        <header className="border-b border-white/10">
          <div className="mx-auto max-w-5xl px-5 py-4">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-white hover:text-blue-300 transition-colors"
            >
              <Image
                src="/Baseball-Scorebug-Logo.png"
                alt="MLB Scorebug logo"
                height={50}
                className="inline-block mr-2 -mt-1"
              />
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/10 mt-12">
          <div className="mx-auto max-w-5xl px-5 py-6 text-xs text-zinc-500">
            Data via MLB Stats API. Not affiliated with MLB.
          </div>
        </footer>
      </body>
    </html>
  );
}
