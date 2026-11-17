import { useEffect, useState } from "react";
import { checkLearner } from "@/game/telemetry";

type Row = { rank?: number; name: string; score: number; complete: boolean; you: boolean };

/** Compact org leaderboard for the end-of-shift report. Renders nothing for anonymous play. */
export function OrgBoard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    let stop = false;
    let timer = 0;
    const load = async () => {
      if (!(await checkLearner())) return;
      try {
        const res = await fetch("/api/leaderboard", { credentials: "same-origin" });
        const data = res.ok ? ((await res.json()) as { enabled: boolean; rows: Row[] }) : null;
        if (!stop) setRows(data?.enabled ? data.rows : null);
      } catch {
        /* offline: keep the last board */
      }
      if (!stop) timer = window.setTimeout(load, 15_000);
    };
    // Give the shift-complete event a moment to land before the first read.
    timer = window.setTimeout(load, 1200);
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, []);
  if (!rows || rows.length === 0) return null;
  const top = rows.slice(0, 5);
  const me = rows.find((r) => r.you);
  if (me && !top.includes(me)) top.push(me);
  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <p className="text-[10px] tracking-[0.24em] text-[#c4a574]">YOUR TEAM</p>
      <ol className="mt-2 space-y-1 text-sm">
        {top.map((r) => (
          <li key={`${r.rank}-${r.name}`} className={`flex justify-between gap-3 ${r.you ? "text-[#f4f0e6]" : "text-[#d9d4c8]"}`}>
            <span className="truncate">
              <span className="mr-2 inline-block w-5 tabular-nums text-[#a8a59c]">{r.rank}</span>
              {r.name}
              {r.you ? <span className="ml-2 text-[10px] tracking-[0.18em] text-[#c4a574]">YOU</span> : null}
            </span>
            <span className="tabular-nums">{r.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
