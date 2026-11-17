import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { reminderFor, reminderScenarios } from "@/content/week/reminders";
import { checkLearner, logDecision, newShiftRun } from "@/game/telemetry";

export const Route = createFileRoute("/reminder")({
  validateSearch: (s: Record<string, unknown>) => ({ m: typeof s.m === "number" && s.m >= 1 && s.m <= 12 ? s.m : undefined }),
  head: () => ({ meta: [{ title: "Monthly reminder · Dry Run Cyber" }] }),
  component: ReminderPage,
});

function ReminderPage() {
  const { m } = Route.useSearch();
  const [month, setMonth] = useState<number | null>(m ?? null);
  useEffect(() => {
    if (!m) setMonth(new Date().getMonth() + 1);
  }, [m]);
  if (!month) return <div className="min-h-dvh bg-[#07090e]" />;
  return <Card month={month} />;
}

function Card({ month }: { month: number }) {
  const r = reminderFor(month);
  const scenario = reminderScenarios[month - 1];
  const options = useMemo(() => [...scenario.choices].sort(() => Math.random() - 0.5), [scenario]);
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => {
    newShiftRun();
    void checkLearner();
  }, []);
  const choice = options.find((o) => o.id === picked);
  const name = new Date(2026, month - 1, 1).toLocaleString("en-US", { month: "long" });

  return (
    <div className="min-h-dvh bg-[#07090e] px-5 py-12 text-[#f4f0e6]">
      <div className="mx-auto max-w-xl">
        <Link to="/week" className="font-game text-xs tracking-[0.28em] text-[#c4a574]">
          DRY RUN CYBER · {name.toUpperCase()} REMINDER
        </Link>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">{r.title}</h1>
        <ul className="mt-6 space-y-3 text-lg text-[#d8d2c4]">
          {r.lines.map((line) => (
            <li key={line} className="border-l-2 border-[#c4a574]/50 pl-3">
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-10 text-lg">{r.question}</p>
        <div className="mt-4 grid gap-2">
          {options.map((o) => {
            const state = picked ? (o.ok ? "right" : o.id === picked ? "wrong" : "") : "";
            return (
              <button
                key={o.id}
                type="button"
                disabled={!!picked}
                onClick={() => {
                  setPicked(o.id);
                  logDecision(o.id);
                }}
                className={`rounded-xl border px-4 py-3 text-left ${
                  state === "right" ? "border-[#7fd6a8] bg-[#0d1f18]" : state === "wrong" ? "border-[#ff7a66] bg-[#2a0f0f]" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        {choice && (
          <p className="mt-5 text-[#d8d2c4]">
            <span className={choice.ok ? "text-[#8fe0b4]" : "text-[#ff9c8a]"}>{choice.ok ? "Right. " : "Not quite. "}</span>
            {r.why}
          </p>
        )}
        <Link to="/week" className="mt-10 inline-block text-sm text-[#a8a59c] underline underline-offset-4">
          Back to the week
        </Link>
      </div>
    </div>
  );
}
