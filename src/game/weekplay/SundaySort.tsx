import { useEffect, useMemo, useRef, useState } from "react";
import { SUNDAY_SORT, type SortItem } from "@/content/week/weekend";
import { checkLearner, logShiftComplete, newShiftRun } from "@/game/telemetry";
import { saveWeek } from "@/game/weekplay/progress";

const SECONDS = 90;

/** Sunday: sort sixteen messages into safe or report before the clock runs out. Arrow keys work too. */
export function SundaySort({ onExit }: { onExit: () => void }) {
  const deck = useMemo(() => [...SUNDAY_SORT].sort(() => Math.random() - 0.5), []);
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [at, setAt] = useState(0);
  const [left, setLeft] = useState(SECONDS);
  const [answers, setAnswers] = useState<{ item: SortItem; risky: boolean }[]>([]);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const filed = useRef(false);

  useEffect(() => {
    newShiftRun();
    void checkLearner();
  }, []);

  useEffect(() => {
    if (phase !== "play") return;
    const t = window.setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "play" && (left === 0 || at >= deck.length)) setPhase("done");
  }, [at, deck.length, left, phase]);

  const correct = answers.filter((a) => a.risky === a.item.risky).length;
  const score = Math.round((correct / deck.length) * 100);

  useEffect(() => {
    if (phase !== "done" || filed.current) return;
    filed.current = true;
    const passed = score >= 80;
    saveWeek("sunday", score, passed);
    if (passed) logShiftComplete("sunday");
  }, [phase, score]);

  const sort = (risky: boolean) => {
    if (phase !== "play" || at >= deck.length) return;
    const item = deck[at];
    setAnswers((a) => [...a, { item, risky }]);
    setFlash(item.risky === risky ? "ok" : "bad");
    window.setTimeout(() => setFlash(null), 260);
    setAt((n) => n + 1);
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft") sort(false);
      if (e.code === "ArrowRight") sort(true);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const item = deck[Math.min(at, deck.length - 1)];

  return (
    <div className="flex min-h-dvh flex-col items-center bg-[#07090e] px-4 py-6 text-[#f4f0e6]">
      <header className="flex w-full max-w-xl items-center justify-between">
        <div>
          <p className="font-game text-xs tracking-[0.22em] text-[#c4a574]">SUNDAY</p>
          <p className="font-display text-xl">The sort</p>
        </div>
        <button type="button" onClick={onExit} className="rounded-full border border-white/15 px-3 py-1 text-xs hover:bg-white/10">
          Leave
        </button>
      </header>

      {phase === "intro" && (
        <div className="mt-16 w-full max-w-xl">
          <h1 className="font-display text-4xl">Ninety seconds. Sixteen messages.</h1>
          <p className="mt-4 text-[#d8d2c4]">
            Everything from the week, in one inbox. Sort each into safe or report. Left arrow for safe, right arrow for report, or tap.
          </p>
          <button type="button" onClick={() => setPhase("play")} className="mt-8 rounded-full bg-[#c4a574] px-6 py-3 font-game tracking-[0.12em] text-[#14110c]">
            START THE CLOCK
          </button>
        </div>
      )}

      {phase === "play" && item && (
        <div className="mt-8 w-full max-w-xl">
          <div className="flex items-center justify-between font-game text-sm tracking-[0.14em] text-[#a8a59c]">
            <span>
              {at + 1} / {deck.length}
            </span>
            <span className={left <= 15 ? "text-[#ff9c8a]" : ""}>0:{String(left).padStart(2, "0")}</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-[#c4a574] transition-[width] duration-1000 ease-linear" style={{ width: `${(left / SECONDS) * 100}%` }} />
          </div>
          <article
            key={item.id}
            className={`mt-6 rounded-2xl border p-5 transition-colors ${flash === "ok" ? "border-[#7fd6a8]" : flash === "bad" ? "border-[#ff7a66]" : "border-white/10"} bg-[#10141b]`}
          >
            <p className="truncate text-sm text-[#a8a59c]">{item.from}</p>
            <p className="mt-1 text-lg font-semibold">{item.subject}</p>
            <p className="mt-3 text-[#d8d2c4]">{item.body}</p>
          </article>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => sort(false)} className="rounded-xl border border-[#7fd6a8]/40 bg-[#0d1f18] py-4 font-game text-lg tracking-[0.12em] text-[#8fe0b4]">
              ← SAFE
            </button>
            <button type="button" onClick={() => sort(true)} className="rounded-xl border border-[#ff7a66]/40 bg-[#2a0f0f] py-4 font-game text-lg tracking-[0.12em] text-[#ff9c8a]">
              REPORT →
            </button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="mt-8 w-full max-w-xl">
          <p className="font-game text-xs tracking-[0.22em] text-[#c4a574]">{score >= 80 ? "SORTED" : "TRY AGAIN"}</p>
          <h2 className="mt-1 font-display text-5xl">
            {correct}/{deck.length}
          </h2>
          <ul className="mt-6 space-y-3">
            {deck.map((d) => {
              const a = answers.find((x) => x.item.id === d.id);
              const ok = a ? a.risky === d.risky : false;
              return (
                <li key={d.id} className="border-l-2 pl-3 text-sm" style={{ borderColor: ok ? "#7fd6a8" : "#ff7a66" }}>
                  <p className="font-semibold">
                    {d.subject} <span className="font-normal text-[#a8a59c]">· {d.risky ? "report" : "safe"}</span>
                  </p>
                  <p className="text-[#d8d2c4]">{a ? d.why : "Ran out of time."}</p>
                </li>
              );
            })}
          </ul>
          <button type="button" onClick={onExit} className="mt-6 rounded-full border border-white/20 px-5 py-2.5 font-game tracking-[0.12em]">
            BACK TO THE WEEK
          </button>
        </div>
      )}
    </div>
  );
}
