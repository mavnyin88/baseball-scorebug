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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.baseballscorebug.com"
  ),
  title: {
    default: "Baseball Scorebug — Live MLB scores, scorebug and stats",
    template: "%s · MLB Scorebug",
  },
  description:
    "Live MLB scoreboard and per-game scorebug. Real-time inning, count, and bases.",
  keywords: ["MLB", "baseball", "scorebug", "live scores", "scoreboard", "innings"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Baseball Scorebug — Live MLB scores, scorebug and stats",
    description:
      "Live MLB scoreboard and per-game scorebug. Real-time inning, count, and bases.",
    url: "/",
    siteName: "Baseball Scorebug",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Baseball Scorebug" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Baseball Scorebug — Live MLB scores, scorebug and stats",
    description:
      "Live MLB scoreboard and per-game scorebug. Real-time inning, count, and bases.",
    images: ["/og-image.png"],
  },
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
                src="/baseball-scorebug-nav-logo.png"
                alt="MLB Scorebug logo"
                loading="eager"
                width={256}
                height={72}
                className="w-auto h-[50px] mr-10"
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
