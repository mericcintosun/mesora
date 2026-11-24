import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const NAV = [
  { href: "/join/area", label: "Join the plan" },
  { href: "/result/friday-supper", label: "Friday's table" },
  { href: "/about", label: "Method" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
          <BrandMark />
          Mesora
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm sm:gap-4">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-full border-2 border-transparent px-3 py-1.5 font-semibold text-muted-foreground hover:border-border hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
