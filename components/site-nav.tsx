"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/join/area", match: "/join", label: "Join the plan" },
  { href: "/result/friday-supper", match: "/result", label: "Friday's table" },
  { href: "/about", match: "/about", label: "Method" },
];

const PANEL_ID = "site-nav-panel";

function isActive(pathname: string, match: string) {
  return pathname === match || pathname.startsWith(`${match}/`);
}

/**
 * Main nav. Inline pills at md and up; below md a disclosure button opens a panel with
 * the same three links. Marks the route group you are in with aria-current="page".
 */
export function SiteNav() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  // Close the mobile panel whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <nav aria-label="Main" className="min-w-0">
      <ul className="hidden items-center gap-3 whitespace-nowrap text-sm md:flex">
        {NAV.map((n) => {
          const active = isActive(pathname, n.match);
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border-2 px-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {n.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 items-center rounded-full border-2 border-border px-4 text-sm font-semibold text-foreground hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
      >
        {open ? "Close menu" : "Menu"}
      </button>

      <div
        id={PANEL_ID}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-border bg-background px-5 pb-5 pt-3 md:hidden"
      >
        <ul className="space-y-2 rounded-3xl border-2 border-border bg-card p-3">
          {NAV.map((n) => {
            const active = isActive(pathname, n.match);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex min-h-11 w-full items-center rounded-full border-2 px-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "border-primary text-primary" : "border-transparent text-foreground hover:border-border"
                  )}
                >
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
