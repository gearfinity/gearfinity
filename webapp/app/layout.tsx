import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Gearfinity — Print · Build · Innovate",
    template: "%s · Gearfinity",
  },
  description:
    "Gearfinity is a fully 3D-printed modular engineering kit — even the bearings — printable as-is with no supports. Configure modules in 3D, watch real assemblies run with exact gear kinematics, and print exactly the parts you need.",
  metadataBase: new URL("https://app.gearfinity.xyz"),
  openGraph: {
    title: "Gearfinity — Print · Build · Innovate",
    description:
      "A fully 3D-printed modular engineering kit. Configure modules in 3D and print exactly the parts you need.",
    images: ["/landing/logo.png"],
  },
};

const SOCIALS = [
  ["YouTube", "https://www.youtube.com/@gearfinity3d"],
  ["GitHub", "https://github.com/gearfinity"],
  ["X", "https://x.com/gearfinity3d"],
  ["TikTok", "https://www.tiktok.com/@gearfinity3d"],
  ["Instagram", "https://www.instagram.com/gearfinity3d/"],
  ["Facebook", "https://www.facebook.com/gearfinity"],
] as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-white/10 bg-[#151226]/90 px-4 py-2.5 backdrop-blur">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/landing/logo.png"
              alt="Gearfinity"
              width={150}
              height={42}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <nav className="ml-auto flex items-center gap-4 text-sm text-white/60">
            <Link href="/build/planetary_stage" className="hover:text-white">
              Planetary
            </Link>
            <Link href="/build/crank" className="hover:text-white">
              Crank
            </Link>
            <Link href="/build/fan" className="hover:text-white">
              Fan
            </Link>
            <a
              href="https://github.com/gearfinity/gearfinity"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              GitHub
            </a>
          </nav>
        </header>
        {children}
        <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-white/50">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {SOCIALS.map(([name, href]) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                {name}
              </a>
            ))}
          </div>
          <div className="mt-4 text-xs text-white/35">
            © Gearfinity. All rights reserved. · Free and open source.
          </div>
        </footer>
      </body>
    </html>
  );
}
