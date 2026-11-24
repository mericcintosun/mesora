import type { Metadata } from "next";
import { Nunito_Sans, Sora } from "next/font/google";
import Link from "next/link";
import { AgentBridge } from "@/components/agent-bridge";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const sora = Sora({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-sora" });
const nunito = Nunito_Sans({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-nunito" });

export const metadata: Metadata = {
  metadataBase: new URL("https://mesora.vercel.app"),
  title: { default: "Mesora", template: "%s | Mesora" },
  description:
    "Send your friends one link. Each person's own agent adds their rough area and limits to it, and Mesora picks the venue and time that keeps the longest trip short. Your location never touches a server.",
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
        <main className="mx-auto max-w-6xl px-5 pb-24">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground">
            <p>Mesora runs in your browser. The group lives in the link, not on our server.</p>
            <div className="flex gap-4">
              <a href="/agent-manifest.json" className="underline decoration-2 underline-offset-4 hover:text-foreground">
                agent-manifest.json
              </a>
              <a href="/mesora.network.json" className="underline decoration-2 underline-offset-4 hover:text-foreground">
                mesora.network.json
              </a>
              <Link href="/about" className="underline decoration-2 underline-offset-4 hover:text-foreground">
                How it works
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
