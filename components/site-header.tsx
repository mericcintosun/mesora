import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { SiteNav } from "@/components/site-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-full font-[family-name:var(--font-display)] text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <BrandMark />
          Mesora
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
