import { createFileRoute, Link } from "@tanstack/react-router";
import { reportLines, scoreOf, type Flags } from "@/game/story";
import { buttonClass } from "@/components/ui";

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export const Route = createFileRoute("/night")({
  validateSearch: (search: Record<string, unknown>) => ({
    d: pick(search.d, ["held", "shut"] as const),
    m: pick(search.m, ["codes", "report", "ignore"] as const),
    p: pick(search.p, ["code", "hangup"] as const),
    u: pick(search.u, ["plug", "it", "leave"] as const),
    w: pick(search.w, ["send", "call", "refuse"] as const),
    md: pick(search.md, ["send", "check", "hide", "report"] as const),
    s: pick(search.s, ["yes", "ignore", "report"] as const),
    up: pick(search.up, ["ignore", "restart", "report"] as const),
    c: pick(search.c, ["leave", "home", "lock", "shred"] as const),
  }),
  head: () => ({ meta: [{ title: "Monday · Harbor" }] }),
  component: NightPage,
});

function NightPage() {
  const search = Route.useSearch();
  const flags: Flags = {
    door: search.d,
    mail: search.m,
    phone: search.p,
    usb: search.u,
    wire: search.w,
    misdirect: search.md,
    signin: search.s,
    updates: search.up,
    cleandesk: search.c,
  };
  const ready = flags.door && flags.mail && flags.phone && flags.usb && flags.wire && flags.misdirect && flags.signin && flags.updates && flags.cleandesk;
  const scored = scoreOf(flags);
  const lines = reportLines(flags);

  return (
    <div className="mx-auto w-full max-w-xl">
      <p className="text-sm text-faint">Shared Monday</p>
      {ready ? (
        <>
          <h1 className="mt-3 font-display text-5xl text-balance">{scored.title}</h1>
          <p className="mt-3 font-display text-4xl tabular-nums">{scored.score}</p>
          <ul className="mt-6 space-y-3">
            {lines.map((line) => (
              <li key={line.text} className={line.ok ? "text-fg" : "text-bad"}>
                {line.text}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-faint">A snapshot of someone's night. Not a credential.</p>
        </>
      ) : (
        <h1 className="mt-3 font-display text-4xl">This link has no Monday on it.</h1>
      )}
      <Link to="/" className={`${buttonClass()} mt-8`}>
        Walk into Harbor
      </Link>
    </div>
  );
}
