import Link from "next/link";
import type { ReactNode } from "react";
import { Inbox, LayoutDashboard, Settings2, Users } from "lucide-react";
import { NAVIGATION_ITEMS } from "@showready/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions";

const iconMap = {
  inbox: Inbox,
  "layout-dashboard": LayoutDashboard,
  users: Users,
  "settings-2": Settings2
};

export function AppShell({
  currentPath,
  heading,
  eyebrow,
  children
}: {
  currentPath: string;
  heading: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[color:var(--bg)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>
      <div className="mx-auto grid min-h-dvh max-w-[1440px] lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-[color:var(--border)] bg-white/80 px-8 py-10 backdrop-blur lg:block">
          <div className="mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[color:var(--muted-ink)]">
              ShowReady
            </p>
            <h1 className="mt-3 font-display text-4xl text-[color:var(--ink)]">
              Daily buyer triage, without the guesswork.
            </h1>
          </div>
          <nav className="space-y-2" aria-label="Primary">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap];
              const active = currentPath.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                    active
                      ? "bg-[color:var(--muted)] text-[color:var(--ink)] shadow-sm"
                      : "text-[color:var(--muted-ink)] hover:bg-[color:var(--muted)]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <form action={logoutAction} className="mt-12">
            <Button type="submit" variant="secondary" className="w-full">
              Sign out
            </Button>
          </form>
        </aside>
        <div className="flex min-h-dvh flex-col">
          <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--bg)]/85 px-5 py-4 backdrop-blur lg:px-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                {eyebrow ? (
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--muted-ink)]">
                    {eyebrow}
                  </p>
                ) : null}
                <h2 className="mt-2 font-display text-3xl text-[color:var(--ink)]">
                  {heading}
                </h2>
              </div>
            </div>
          </header>
          <main id="main-content" className="flex-1 px-5 py-6 lg:px-10 lg:py-10">
            {children}
          </main>
          <nav
            className="sticky bottom-0 z-30 grid border-t border-[color:var(--border)] bg-white/90 px-3 py-2 backdrop-blur lg:hidden"
            aria-label="Mobile primary"
            style={{ gridTemplateColumns: `repeat(${NAVIGATION_ITEMS.length}, minmax(0, 1fr))` }}
          >
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap];
              const active = currentPath.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-11 flex-col items-center justify-center rounded-2xl text-xs",
                    active
                      ? "bg-[color:var(--muted)] text-[color:var(--ink)]"
                      : "text-[color:var(--muted-ink)]"
                  )}
                >
                  <Icon className="mb-1 h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
