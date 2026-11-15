import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ShiftBoard } from "@/components/shift-board";
import { Button } from "@/components/ui";
import { ShareButton } from "@/components/share-button";
import { todayKey, useClientNow } from "@/lib/dates";
import { useHydratedProgress, useProgress } from "@/lib/progress";
import { startRun, type Run } from "@/lib/shift-game";
import { cleanCallsign } from "@/lib/utils";

export const Route = createFileRoute("/shift")({
  head: () => ({ meta: [{ title: "Desk drill · Meridian" }] }),
  component: Home,
});

function Home() {
  const now = useClientNow();
  const ready = useHydratedProgress();
  const callsign = useProgress((state) => state.callsign);
  const shiftBest = useProgress((state) => state.shiftBest);
  const recordShift = useProgress((state) => state.recordShift);
  const [run, setRun] = useState<Run | null>(null);
  const filed = useRef(false);

  useEffect(() => {
    if (!run || (run.phase !== "won" && run.phase !== "lost")) return;
    if (filed.current) return;
    filed.current = true;
    recordShift(run.score, run.phase === "won");
  }, [run, recordShift]);

  if (run) {
    return (
      <ShiftBoard
        run={run}
        onChange={setRun}
        onExit={() => setRun(null)}
        callsign={callsign}
      />
    );
  }

  return (
    <Lobby
      ready={ready}
      now={now}
      callsign={callsign}
      shiftBest={shiftBest}
      onDaily={() => {
        filed.current = false;
        setRun(startRun(now ? `daily-${todayKey(now)}` : "daily"));
      }}
      onRandom={() => {
        filed.current = false;
        setRun(startRun(`free-${Math.floor(Math.random() * 1e9).toString(36)}`));
      }}
    />
  );
}

function Lobby({
  ready,
  now,
  callsign,
  shiftBest,
  onDaily,
  onRandom,
}: {
  ready: boolean;
  now: Date | null;
  callsign: string;
  shiftBest: number;
  onDaily: () => void;
  onRandom: () => void;
}) {
  const welcomed = useProgress((state) => state.welcomed);
  const dismissWelcome = useProgress((state) => state.dismissWelcome);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="enter mx-auto w-full max-w-3xl">
      <p className="text-sm text-faint">Meridian · one shift</p>
      <h1 className="mt-3 font-display text-5xl text-balance md:text-6xl">Hold the floor.</h1>
      <p className="mt-4 max-w-prose text-lg text-pretty text-muted">
        You are the person at the desk. Two actions an hour. Threats you ignore get older, then they go off.
        Three watches. Pressure at 100 ends it.
      </p>
      <ol className="mt-6 max-w-prose space-y-2 text-pretty text-fg">
        <li>Inspect if the preview is not enough. That spends an action.</li>
        <li>Clear, verify, contain, or report. A wrong clear is how breaches start.</li>
        <li>Advance the hour when the desk can survive without you.</li>
      </ol>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button onClick={onDaily} disabled={!now}>
          Take today's shift
        </Button>
        <Button variant="secondary" onClick={onRandom}>
          Random shift
        </Button>
      </div>
      <p className="mt-4 text-sm tabular-nums text-faint">
        {callsign}
        {shiftBest > 0 ? ` · best ${shiftBest}` : " · no shift on the record yet"}
      </p>
      <p className="mt-8 max-w-prose text-sm text-pretty text-muted">
        Lessons and drills are the manual, if you want the words before the desk.{" "}
        <Link to="/path" className="text-fg underline-offset-4 hover:underline">
          Open the path
        </Link>
        .
      </p>
      <div className="mt-4">
        <ShareButton
          label="Share the shift"
          title="Meridian"
          text="Meridian is a shift you play: hold Harbor's floor for three watches before the pressure breaks."
          path="/"
        />
      </div>
      {ready && !welcomed ? (
        <form
          className="mt-8 rounded-3xl border border-line p-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) {
              dismissWelcome();
              return;
            }
            const cleaned = cleanCallsign(name);
            if (!cleaned) {
              setError("Use 2–18 letters, numbers, spaces, apostrophes, or hyphens.");
              return;
            }
            dismissWelcome(cleaned);
          }}
        >
          <h2 className="font-display text-2xl">Callsign on the record</h2>
          <p className="mt-2 text-sm text-pretty text-muted">Stays on this device. You can skip it.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={18}
              placeholder="Callsign"
              aria-label="Callsign"
              className="min-h-11 w-full rounded-md border border-line bg-sunken px-3 text-fg sm:max-w-xs"
            />
            <Button type="submit">Save</Button>
            <Button type="button" variant="secondary" onClick={() => dismissWelcome()}>
              Skip
            </Button>
          </div>
          {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
