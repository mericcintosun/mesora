"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/join/area", match: "/join", label: "Join the plan" },
  { href: "/result/friday-supper", match: "/result", label: "Friday's table" },
  { href: "/about", match: "/about", label: "Method" },
];

/** Main nav. Marks the route group you are in with aria-current="page". */
export function SiteNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav aria-label="Main" className="-mr-2 min-w-0 overflow-x-auto">
      <ul className="flex items-center gap-1 whitespace-nowrap py-1 pr-2 text-sm sm:gap-3">
        {NAV.map((n) => {
          const active = pathname === n.match || pathname.startsWith(`${n.match}/`);
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex rounded-full border-2 px-2.5 py-1.5 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3",
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {n.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
