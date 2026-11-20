import { AccessGate } from "@/site/AccessGate";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/play")({
  head: () => ({ meta: [{ title: "The Night Shift · Dry Run Cyber" }] }),
  component: CityPage,
});

function CityPage() {
  const callsign = useProgress((state) => state.callsign);
  const recordShift = useProgress((state) => state.recordShift);
  const [Game, setGame] = useState<typeof import("@/game/Harbor").Harbor | null>(null);

  useEffect(() => {
    let live = true;
    void import("@/game/Harbor").then((mod) => {
      if (live) setGame(() => mod.Harbor);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!Game) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center bg-[#07090e] text-[#f4f0e6]">
        <p className="text-xs tracking-[0.28em] text-[#c4a574]">DRY RUN CYBER</p>
        <h1 className="mt-3 font-display text-6xl">Harbor</h1>
      </div>
    );
  }

  return (
    <AccessGate shift="monday">
      <Game callsign={callsign} onDone={(score, clean) => recordShift(score, clean)} />
    </AccessGate>
  );
}
