import { Link, useRouterState } from "@tanstack/react-router";
import { Map, Crosshair, Library, ScrollText } from "lucide-react";
import type { ReactNode } from "react";
import { rankFor } from "@/content/meta";
import { ShareButton } from "@/components/share-button";
import { Meter } from "@/components/ui";
import { useHydratedProgress, useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/play", label: "City", icon: Map, match: (path: string) => path === "/play" || path === "/night" },
  {
    to: "/path",
    label: "Path",
    icon: Library,
    match: (path: string) =>
      path.startsWith("/path") || path.startsWith("/lesson") || path.startsWith("/glossary") || path.startsWith("/coverage"),
  },
  { to: "/drills", label: "Drills", icon: Crosshair, match: (path: string) => path.startsWith("/drills") },
  {
    to: "/record",
    label: "Record",
    icon: ScrollText,
    match: (path: string) => path.startsWith("/record") || path.startsWith("/review"),
  },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const callsign = useProgress((state) => state.callsign);
  const xp = useProgress((state) => state.xp);
  const { current, next } = rankFor(xp);
  const span = next ? next.min - current.min : 1;
  const into = next ? Math.min(100, Math.round(((xp - current.min) / span) * 100)) : 100;
  useHydratedProgress();

  if (pathname === "/") return <>{children}</>;
  if (pathname === "/play") {
    return <div className="h-dvh w-full overflow-hidden bg-[#07090e] text-fg">{children}</div>;
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-bg md:flex">
        <div className="px-5 pt-7">
          <Link to="/" className="font-display text-3xl tracking-tight text-fg">
            Dry Run Cyber
          </Link>
          <p className="mt-1 text-sm text-faint">Harbor</p>
        </div>
        <nav className="mt-8 flex flex-col gap-1 px-3" aria-label="Primary">
          {NAV.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm",
                  active ? "bg-sunken text-fg" : "text-muted hover:bg-sunken hover:text-fg",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-5 pb-6">
          <ShareButton
            label="Share Dry Run Cyber"
            title="Dry Run Cyber"
            text="Dry Run Cyber is a cybersecurity awareness field school. Lessons, drills, and a record you can share as a snapshot."
            path="/"
            variant="ghost"
            className="mb-5"
          />
          <p className="text-xs text-faint">Rank</p>
          <p className="font-display text-2xl text-fg">{current.name}</p>
          <p className="mt-1 text-sm text-muted">{callsign}</p>
          <div className="mt-3">
            <Meter value={into} label="Progress to the next rank" />
          </div>
          <p className="mt-2 text-xs tabular-nums text-faint">
            {xp} XP{next ? ` · ${next.min - xp} to ${next.name}` : ""}
          </p>
        </div>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg px-4 py-3 md:hidden">
          <Link to="/" className="font-display text-2xl text-fg">
            Dry Run Cyber
          </Link>
          <ShareButton
            label="Share"
            title="Dry Run Cyber"
            text="A lesson, a drill, or the whole field school."
            variant="ghost"
          />
        </header>
        <main className="px-4 py-6 pb-28 md:px-10 md:py-10 md:pb-16">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Primary"
      >
        <div className="grid grid-cols-4">
          {NAV.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-xs",
                  active ? "text-fg" : "text-faint",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
