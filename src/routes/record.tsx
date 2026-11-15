import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LESSONS, getLesson, orderedLessons } from "@/content/curriculum";
import { DRILLS } from "@/content/drills";
import { BADGES, rankFor } from "@/content/meta";
import { ShareButton } from "@/components/share-button";
import { Button, Meter } from "@/components/ui";
import { cardQuery, lessonAverage, useProgress } from "@/lib/progress";
import { cleanCallsign, cn } from "@/lib/utils";

export const Route = createFileRoute("/record")({
  head: () => ({ meta: [{ title: "Record · Meridian" }] }),
  component: RecordPage,
});

function RecordPage() {
  const state = useProgress();
  const { current, next } = rankFor(state.xp);
  const span = next ? next.min - current.min : 1;
  const into = next ? Math.min(100, Math.round(((state.xp - current.min) / span) * 100)) : 100;
  const average = lessonAverage(state.lessons);
  const [draft, setDraft] = useState(state.callsign);
  const [error, setError] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const rules = orderedLessons().flatMap((lesson) =>
    state.lessons[lesson.id] ? [{ id: lesson.id, title: lesson.title, rule: lesson.fieldRule }] : [],
  );

  useEffect(() => {
    setDraft(state.callsign);
  }, [state.callsign]);

  const query = cardQuery(state);
  const drillBits = DRILLS.flatMap((drill) => {
    const best = state.drills[drill.id]?.best;
    return best == null ? [] : [`${drill.title} ${best}`];
  }).join(", ");

  return (
    <div className="enter mx-auto w-full max-w-3xl">
      <p className="text-sm text-faint">Record</p>
      <h1 className="mt-2 font-display text-4xl text-balance md:text-5xl">{state.callsign}</h1>
      <p className="mt-3 font-display text-3xl text-fg">{current.name}</p>
      <p className="mt-2 max-w-prose text-pretty text-muted">{current.line}</p>
      <div className="mt-5">
        <Meter value={into} label="Progress to the next rank" />
      </div>
      <p className="mt-2 text-sm tabular-nums text-faint">
        {state.xp} XP{next ? ` · ${Math.max(0, next.min - state.xp)} to ${next.name}` : ""}
      </p>

      <section className="mt-8 rounded-3xl border border-line p-5">
        <h2 className="font-display text-2xl">Share a snapshot</h2>
        <p className="mt-2 text-pretty text-sm text-muted">
          The field card is a link anyone can open. It shows rank, scores, and callsign. It is not a login and
          not a credential. The working record stays in this browser.
        </p>
        <div className="mt-4">
          <ShareButton
            label="Share field card"
            title={`Meridian · ${state.callsign}`}
            text={`Meridian field card — ${state.callsign}, ${current.name}, ${state.xp} XP.${drillBits ? ` Drills: ${drillBits}.` : ""} Snapshot, not a credential.`}
            path={`/card?${query}`}
          />
        </div>
      </section>

      <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-6 sm:grid-cols-4">
        <Stat label="Streak" value={String(state.streak)} />
        <Stat label="Lessons" value={`${Object.keys(state.lessons).length}/${LESSONS.length}`} />
        <Stat label="Lesson average" value={average == null ? "—" : String(average)} />
        <Stat label="Shift best" value={state.shiftBest > 0 ? String(state.shiftBest) : "—"} />
        <Stat label="Badges" value={`${state.badges.length}/${BADGES.length}`} />
      </dl>

      <form
        className="mt-8 border-t border-line pt-6"
        onSubmit={(event) => {
          event.preventDefault();
          const cleaned = cleanCallsign(draft);
          if (!cleaned) {
            setError("Use 2–18 letters, numbers, spaces, apostrophes, or hyphens.");
            return;
          }
          setError(null);
          state.setCallsign(cleaned);
        }}
      >
        <label htmlFor="rename" className="text-sm text-faint">
          Callsign
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="rename"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={18}
            className="min-h-11 w-full rounded-md border border-line bg-sunken px-3 text-fg sm:max-w-xs"
          />
          <Button type="submit" variant="secondary">
            Update
          </Button>
        </div>
        {error ? <p className="mt-2 text-sm text-bad">{error}</p> : null}
      </form>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-3xl">Badges</h2>
          {state.missed.length > 0 ? (
            <Link to="/review" className="text-sm text-muted underline-offset-4 hover:underline">
              Review {state.missed.length}
            </Link>
          ) : null}
        </div>
        <ul className="mt-4 grid gap-px bg-line sm:grid-cols-2">
          {BADGES.map((badge) => {
            const earned = state.badges.includes(badge.id);
            return (
              <li key={badge.id} className="bg-bg px-0 py-4 sm:px-4">
                <p className={cn("font-medium", earned ? "text-fg" : "text-muted")}>{badge.name}</p>
                <p className="mt-1 text-sm text-pretty text-faint">{badge.detail}</p>
                <p className="mt-1 text-xs text-faint">{earned ? "On the record" : "Not yet"}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl">Field rules you have earned</h2>
        {rules.length === 0 ? (
          <p className="mt-3 text-pretty text-muted">They appear here as you file lesson checks.</p>
        ) : (
          <ul className="mt-4">
            {rules.map((rule) => (
              <li key={rule.id} className="border-t border-line py-4">
                <p className="text-sm text-faint">{getLesson(rule.id)?.title}</p>
                <p className="mt-1 font-display text-xl text-pretty">{rule.rule}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 border-t border-line pt-6">
        <h2 className="font-display text-2xl">Reset this device</h2>
        <p className="mt-2 max-w-prose text-sm text-pretty text-muted">
          Clears the record in this browser. Shared cards you already sent stay as they were. Nothing is deleted
          from anyone else's device.
        </p>
        <div className="mt-4">
          {armed ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="secondary"
                onClick={() => {
                  state.reset();
                  setArmed(false);
                }}
              >
                Confirm reset
              </Button>
              <Button variant="ghost" onClick={() => setArmed(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setArmed(true)}>
              Reset record
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-faint">{label}</dt>
      <dd className="mt-1 font-display text-3xl tabular-nums text-fg">{value}</dd>
    </div>
  );
}
