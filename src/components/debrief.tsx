import type { DrillResult } from "@/content/types";
import type { Grant } from "@/lib/progress";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui";

export function GrantLine({ grant }: { grant: Grant }) {
  return (
    <p className="text-sm text-pretty text-muted" role="status">
      Filed. +{grant.xpGained} XP.
      {grant.newBadges.length > 0
        ? ` New on the record: ${grant.newBadges.map((badge) => badge.name).join(", ")}.`
        : ""}
      {!grant.improved ? " The record already held a higher score." : ""}
    </p>
  );
}

export function Debrief({
  title,
  result,
  grant,
  onFile,
  replay,
  sharePath,
  shareText,
}: {
  title: string;
  result: DrillResult;
  grant: Grant | null;
  onFile: () => void;
  replay: () => void;
  sharePath: string;
  shareText: string;
}) {
  return (
    <div className="enter mx-auto w-full max-w-3xl">
      <p className="text-sm text-faint">Debrief</p>
      <h1 className="mt-2 font-display text-4xl text-balance md:text-5xl">{title}</h1>
      <p className="mt-4 font-display text-6xl tabular-nums text-fg">{result.pct}</p>
      <p className="text-sm text-muted">out of 100 · {result.earned} of {result.max} points</p>
      <ul className="mt-8">
        {result.rows.map((row) => (
          <li key={row.id} className="border-t border-line py-4">
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-medium text-pretty">{row.label}</p>
              <p
                className={
                  row.tone === "exact" ? "text-sm text-ok" : row.tone === "partial" ? "text-sm text-warn" : "text-sm text-bad"
                }
              >
                {row.tone === "exact" ? "Full credit" : row.tone === "partial" ? "Partial" : "Miss"}
              </p>
            </div>
            <p className="mt-1 text-sm text-muted">
              You chose {row.picked}.
              {row.tone === "exact" ? "" : ` Full credit was ${row.right}.`}
            </p>
            <p className="mt-2 text-sm text-pretty text-fg">{row.why}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {grant ? (
          <GrantLine grant={grant} />
        ) : (
          <Button onClick={onFile}>File this run</Button>
        )}
        <Button variant="secondary" onClick={replay}>
          Run it again
        </Button>
        <ShareButton title={`Dry Run Cyber · ${title}`} text={shareText} path={sharePath} label="Share this result" />
      </div>
      <p className="mt-4 max-w-prose text-sm text-pretty text-faint">
        The link opens this drill for anyone. The score rides in the message, not in an account. A field card of your whole record is on the Record page.
      </p>
    </div>
  );
}
