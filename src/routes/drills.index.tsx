import { createFileRoute, Link } from "@tanstack/react-router";
import { DRILLS, dailyDrillId } from "@/content/drills";
import { ShareButton } from "@/components/share-button";
import { useClientNow } from "@/lib/dates";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/drills/")({
  head: () => ({ meta: [{ title: "Drills · Dry Run Cyber" }] }),
  component: DrillsPage,
});

function DrillsPage() {
  const now = useClientNow();
  const drills = useProgress((state) => state.drills);
  const dailyId = now ? dailyDrillId(now) : null;

  return (
    <div className="enter mx-auto w-full max-w-3xl">
      <p className="text-sm text-faint">Drills</p>
      <h1 className="mt-2 font-display text-4xl text-balance md:text-5xl">Scored work, not a lecture.</h1>
      <p className="mt-4 text-pretty text-muted">
        Each drill is a link you can send. The person who opens it starts clean. Your best score stays on this
        device until you share a field card from the record.
      </p>
      <div className="mt-5">
        <ShareButton
          label="Share the drill hall"
          title="Dry Run Cyber drills"
          text="Scored cybersecurity drills: inbox triage, links, calls, passwords, data, incidents, and a wire."
          path="/drills"
        />
      </div>
      <ol className="mt-8">
        {DRILLS.map((drill) => {
          const best = drills[drill.id]?.best;
          return (
            <li key={drill.id} className="border-t border-line">
              <Link to="/drills/$drillId" params={{ drillId: drill.id }} className="block py-5">
                <span className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-3xl text-fg">{drill.title}</span>
                  <span className="shrink-0 text-sm tabular-nums text-faint">
                    {best != null ? `best ${best}` : `${drill.minutes} min`}
                  </span>
                </span>
                <span className="mt-2 block text-pretty text-muted">{drill.summary}</span>
                {dailyId === drill.id ? (
                  <span className="mt-2 block text-sm text-faint">On today's rotation</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
