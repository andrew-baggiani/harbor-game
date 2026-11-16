import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getDrill } from "@/content/drills";
import { dailyDrillId } from "@/content/drills";
import { Debrief } from "@/components/debrief";
import { BeatRun, InboxRun, LinkRun, PassphraseRun } from "@/components/runners";
import { ShareButton } from "@/components/share-button";
import { Button, Missing } from "@/components/ui";
import type { DrillResult } from "@/content/types";
import { useClientNow } from "@/lib/dates";
import type { Grant } from "@/lib/progress";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/drills/$drillId")({
  head: ({ params }) => ({
    meta: [{ title: `${getDrill(params.drillId)?.title ?? "Drill"} · Dry Run Cyber` }],
  }),
  component: DrillPage,
});

function DrillPage() {
  const { drillId } = Route.useParams();
  const drill = getDrill(drillId);
  const [phase, setPhase] = useState<"brief" | "play" | "debrief">("brief");
  const [result, setResult] = useState<DrillResult | null>(null);
  const [grant, setGrant] = useState<Grant | null>(null);
  const filed = useRef(false);
  const recordDrill = useProgress((state) => state.recordDrill);
  const best = useProgress((state) => state.drills[drillId]?.best);
  const now = useClientNow();

  useEffect(() => {
    setPhase("brief");
    setResult(null);
    setGrant(null);
    filed.current = false;
  }, [drillId]);

  if (!drill) return <Missing what="drill" />;

  function finish(next: DrillResult) {
    setResult(next);
    setPhase("debrief");
  }

  function file() {
    if (!drill || !result || filed.current) return;
    filed.current = true;
    const isDaily = now ? dailyDrillId(now) === drill.id : false;
    setGrant(recordDrill(drill.id, result.pct, isDaily));
  }

  const shareText = result
    ? `Dry Run Cyber · ${drill.title} · ${result.pct} out of 100. Open the drill and run it yourself.`
    : `${drill.title}. ${drill.summary}`;

  return (
    <div className="enter mx-auto w-full max-w-3xl">
      {phase === "brief" ? (
        <>
          <Link to="/drills" className="text-sm text-muted underline-offset-4 hover:underline">
            Drills
          </Link>
          <p className="mt-4 text-sm text-faint">{drill.minutes} min</p>
          <h1 className="mt-2 font-display text-4xl text-balance md:text-5xl">{drill.title}</h1>
          <p className="mt-4 text-pretty text-lg text-muted">{drill.brief}</p>
          <p className="mt-4 text-pretty text-sm text-faint">{drill.scoring}</p>
          {best != null ? (
            <p className="mt-3 text-sm tabular-nums text-muted">Best on this device: {best}</p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button onClick={() => setPhase("play")}>Start</Button>
            <ShareButton
              label="Share this drill"
              title={`Dry Run Cyber · ${drill.title}`}
              text={shareText}
              path={`/drills/${drill.id}`}
            />
          </div>
        </>
      ) : null}

      {phase === "play" ? (
        <>
          <div className="mb-6 flex items-center justify-between gap-4">
            <button
              type="button"
              className="text-sm text-muted underline-offset-4 hover:underline"
              onClick={() => setPhase("brief")}
            >
              Leave this run
            </button>
            <p className="text-xs text-faint">Leaving discards the run.</p>
          </div>
          {drill.kind === "inbox" ? <InboxRun onComplete={finish} /> : null}
          {drill.kind === "links" ? <LinkRun onComplete={finish} /> : null}
          {drill.kind === "beats" ? <BeatRun drillId={drill.id} onComplete={finish} /> : null}
          {drill.kind === "passphrase" ? <PassphraseRun onComplete={finish} /> : null}
        </>
      ) : null}

      {phase === "debrief" && result ? (
        <Debrief
          title={drill.title}
          result={result}
          grant={grant}
          onFile={file}
          replay={() => {
            filed.current = false;
            setGrant(null);
            setResult(null);
            setPhase("play");
          }}
          sharePath={`/drills/${drill.id}`}
          shareText={shareText}
        />
      ) : null}
    </div>
  );
}
