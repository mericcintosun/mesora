import type { Metadata } from "next";
import { Nunito_Sans, Sora } from "next/font/google";
import Link from "next/link";
import { AgentBridge } from "@/components/agent-bridge";
import { SiteHeader } from "@/components/site-header";
// metadataBase reads NEXT_PUBLIC_SITE_URL there, fallback https://mesora-three.vercel.app.
import { SITE_URL } from "@/lib/config";
import "./globals.css";

const sora = Sora({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-sora" });
const nunito = Nunito_Sans({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-nunito" });

// About 140 characters (limit 160): the problem (one friend rides an hour) and the fix (one link, shortest longest trip).
const DESCRIPTION =
  "Meet-in-the-middle apps send one friend on an hour's ride. Mesora takes one group link and picks the table where the longest trip is shortest.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Mesora", template: "%s | Mesora" },
  description: DESCRIPTION,
  // og:image and twitter:image come from app/opengraph-image.tsx (Next adds them per route).
  openGraph: {
    title: "Mesora: meet where nobody rides an hour",
    description: DESCRIPTION,
    siteName: "Mesora",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mesora: meet where nobody rides an hour",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${nunito.variable}`}>
      <head>
        <link rel="agent-manifest" href="/agent-manifest.json" />
      </head>
      <body className="min-h-screen antialiased">
        <AgentBridge />
        <SiteHeader />
        <main className="mx-auto max-w-6xl overflow-x-clip px-5 pb-24">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground">
            <p className="max-w-[60ch]">The group lives in the link after the #, which never reaches our server.</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-3">
              <li>
                <Link href="/about" className="underline decoration-2 underline-offset-4 hover:text-foreground">
                  Method
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/mericcintosun/mesora"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 underline-offset-4 hover:text-foreground"
                >
                  Source repo
                </a>
              </li>
              <li>
                <a
                  href="https://cognizant-agenticweb.devpost.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-2 underline-offset-4 hover:text-foreground"
                >
                  Open Agentic Web Challenge
                </a>
              </li>
              <li>
                <a href="/agent-manifest.json" className="underline decoration-2 underline-offset-4 hover:text-foreground">
                  agent-manifest.json
                </a>
              </li>
              <li>
                <a href="/mesora.network.json" className="underline decoration-2 underline-offset-4 hover:text-foreground">
                  mesora.network.json
                </a>
              </li>
            </ul>
          </div>
        </footer>
      </body>
    </html>
  );
}
