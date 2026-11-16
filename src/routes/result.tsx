import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonClass } from "@/components/ui";
import { cleanCallsign } from "@/lib/utils";

function num(value: unknown, max: number): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.min(max, Math.round(parsed)));
}

export const Route = createFileRoute("/result")({
  validateSearch: (search: Record<string, unknown>) => ({
    end: search.end === "held" || search.end === "lost" ? search.end : undefined,
    sc: num(search.sc, 20000),
    pr: num(search.pr, 100),
    n: typeof search.n === "string" ? search.n.slice(0, 40) : "",
  }),
  head: () => ({ meta: [{ title: "Shift result · Dry Run Cyber" }] }),
  component: ResultPage,
});

function ResultPage() {
  const search = Route.useSearch();
  const name = cleanCallsign(search.n) ?? "Recruit";
  const held = search.end === "held";
  const has = search.end != null;

  return (
    <div className="enter mx-auto w-full max-w-3xl">
      <p className="text-sm text-faint">Shared shift</p>
      {has ? (
        <>
          <h1 className="mt-2 font-display text-4xl text-balance md:text-5xl">{name}</h1>
          <p className="mt-3 font-display text-3xl">{held ? "Held the floor" : "Lost the floor"}</p>
          <p className="mt-4 font-display text-6xl tabular-nums">{search.sc ?? 0}</p>
          <p className="text-sm text-muted">score · pressure {search.pr ?? 0}</p>
          <p className="mt-6 max-w-prose text-sm text-pretty text-faint">
            A snapshot of someone else's shift. Anyone can edit a link, so this is not a credential. Your own run
            starts clean.
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-2 font-display text-4xl text-balance">This link has no shift on it.</h1>
          <p className="mt-4 text-pretty text-muted">Take the desk yourself.</p>
        </>
      )}
      <Link to="/play" className={`${buttonClass()} mt-6`}>
        Take a shift
      </Link>
    </div>
  );
}
