import { createFileRoute, Link } from "@tanstack/react-router";
import { LESSONS } from "@/content/curriculum";
import { DRILLS } from "@/content/drills";
import { BADGES, rankFor } from "@/content/meta";
import { ShareButton } from "@/components/share-button";
import { buttonClass } from "@/components/ui";
import { cleanCallsign } from "@/lib/utils";

function num(value: unknown, max: number): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.min(max, Math.round(parsed)));
}

export const Route = createFileRoute("/card")({
  validateSearch: (search: Record<string, unknown>) => ({
    n: typeof search.n === "string" ? search.n.slice(0, 40) : "",
    x: num(search.x, 50000),
    k: num(search.k, 9999),
    c: num(search.c, LESSONS.length),
    a: num(search.a, 100),
    b: num(search.b, BADGES.length),
    q: typeof search.q === "string" ? search.q.slice(0, 400) : "",
  }),
  head: () => ({ meta: [{ title: "Field card · Dry Run Cyber" }] }),
  component: CardPage,
});

function CardPage() {
  const search = Route.useSearch();
  const callsign = cleanCallsign(search.n) ?? (search.n.trim() ? "Recruit" : "");
  const xp = search.x ?? 0;
  const streak = search.k ?? 0;
  const lessons = search.c ?? 0;
  const hasCard = Boolean(search.n || search.x || search.k || search.c || search.q);
  const { current } = rankFor(xp);
  const drills = search.q
    .split(",")
    .map((part) => {
      const [id, raw] = part.split(".");
      const drill = DRILLS.find((item) => item.id === id);
      const score = num(raw, 100);
      if (!drill || score == null) return null;
      return { id: drill.id, title: drill.title, score };
    })
    .filter((item): item is { id: string; title: string; score: number } => item != null);

  const path = `/card?${new URLSearchParams(
    Object.entries({
      n: search.n,
      x: search.x == null ? "" : String(search.x),
      k: search.k == null ? "" : String(search.k),
      c: search.c == null ? "" : String(search.c),
      a: search.a == null ? "" : String(search.a),
      b: search.b == null ? "" : String(search.b),
      q: search.q,
    }).filter(([, value]) => value !== ""),
  ).toString()}`;

  return (
    <div className="enter mx-auto w-full max-w-3xl">
      <p className="text-sm text-faint">Field card</p>
      {!hasCard ? (
        <>
          <h1 className="mt-2 font-display text-4xl text-balance">This link has no snapshot on it.</h1>
          <p className="mt-4 max-w-prose text-pretty text-muted">
            A field card is a score you chose to share. Start Dry Run Cyber, then share one from your record.
          </p>
          <Link to="/play" className={`${buttonClass()} mt-6`}>
            Enter the field school
          </Link>
        </>
      ) : (
        <>
          <h1 className="mt-2 font-display text-4xl text-balance md:text-5xl">{callsign || "Unnamed"}</h1>
          <p className="mt-3 font-display text-3xl">{current.name}</p>
          <p className="mt-2 max-w-prose text-pretty text-muted">{current.line}</p>
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <CardStat label="XP" value={String(xp)} />
            <CardStat label="Streak" value={String(streak)} />
            <CardStat label="Lessons" value={`${lessons}/${LESSONS.length}`} />
            <CardStat label="Lesson average" value={search.a == null ? "—" : String(search.a)} />
          </dl>
          {drills.length > 0 ? (
            <section className="mt-8">
              <h2 className="font-display text-2xl">Drills on this snapshot</h2>
              <ul className="mt-3">
                {drills.map((drill) => (
                  <li key={drill.id} className="flex items-baseline justify-between gap-4 border-t border-line py-3">
                    <span>{drill.title}</span>
                    <span className="tabular-nums text-muted">{drill.score}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <p className="mt-8 max-w-prose text-sm text-pretty text-faint">
            Snapshot only. Anyone can edit a link, so this is not a verified credential and not a certification.
            {search.b != null ? ` Badges claimed on the card: ${search.b}.` : ""} The sender's working record never
            left their browser.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ShareButton
              label="Share this card"
              title={`Dry Run Cyber · ${callsign || "Field card"}`}
              text={`Dry Run Cyber field card — ${callsign || "Unnamed"}, ${current.name}, ${xp} XP. Snapshot, not a credential.`}
              path={path}
            />
            <Link to="/play" className={buttonClass({ variant: "secondary" })}>
              Start your own record
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function CardStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-faint">{label}</dt>
      <dd className="mt-1 font-display text-3xl tabular-nums">{value}</dd>
    </div>
  );
}
