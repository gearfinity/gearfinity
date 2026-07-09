import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
    default: "Gearfinity — Module Configurator",
    template: "%s · Gearfinity",
  },
  description:
    "Configure, watch, and print Gearfinity's fully 3D-printed modular gear machines — real assemblies, exact gear kinematics, no supports needed.",
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
      <body className="flex min-h-full flex-col">
        <header className="flex h-13 items-center gap-4 border-b border-zinc-800 bg-zinc-950 px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight">
            ⚙ Gearfinity
          </Link>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[0.65rem] text-zinc-400">
            beta
          </span>
          <nav className="ml-auto flex gap-4 text-sm text-zinc-400">
            <a
              href="https://gearfinity.xyz"
              className="hover:text-zinc-200"
              target="_blank"
              rel="noreferrer"
            >
              gearfinity.xyz
            </a>
            <a
              href="https://github.com/gearfinity/gearfinity"
              className="hover:text-zinc-200"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
