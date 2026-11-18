import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AI_ENTRY, TRACK_LIST, WEEK } from "@/game/week";
import { readWeek, type WeekRecord } from "@/game/weekplay/progress";

export const Route = createFileRoute("/week/")({
  head: () => ({ meta: [{ title: "The week · Dry Run Cyber" }] }),
  component: WeekHub,
});

const idOf = (href: string) => (href === "/play" ? "monday" : href.split("/").at(-1)!);

function WeekHub() {
  const [done, setDone] = useState<Record<string, WeekRecord>>({});
  useEffect(() => setDone(readWeek()), []);

  return (
    <div className="min-h-dvh bg-[#07090e] px-5 py-10 text-[#f4f0e6] sm:px-10">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="font-game text-xs tracking-[0.28em] text-[#c4a574]">
          DRY RUN CYBER
        </Link>
        <h1 className="mt-3 font-display text-5xl sm:text-6xl">The week</h1>
        <p className="mt-3 max-w-xl text-[#d8d2c4]">
          Five night shifts, two weekend games, an AI shift for everyone, and a short track for whatever your job hands you. Each one maps to its own block of required training.
        </p>

        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WEEK.map((s) => {
            const rec = done[idOf(s.href)];
            return (
              <li key={s.day}>
                <a href={s.href} className="block h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#c4a574]/60 hover:bg-white/[0.06]">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-game text-sm tracking-[0.18em] text-[#c4a574]">{s.day.toUpperCase()}</span>
                    {rec?.passed ? (
                      <span className="font-game text-xs tracking-[0.14em] text-[#8fe0b4]">DONE · {rec.best}%</span>
                    ) : rec ? (
                      <span className="font-game text-xs tracking-[0.14em] text-[#a8a59c]">{rec.best}%</span>
                    ) : null}
                  </div>
                  <p className="mt-2 font-display text-2xl">{s.title}</p>
                  <p className="mt-2 text-sm text-[#a8a59c]">{s.topics.replaceAll(" · ", ", ")}.</p>
                </a>
              </li>
            );
          })}
        </ol>

        <a
          href={AI_ENTRY.href}
          className="mt-14 block rounded-2xl border border-[#c4a574]/40 bg-gradient-to-br from-[#c4a574]/[0.10] to-transparent p-6 transition hover:border-[#c4a574]"
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-game text-sm tracking-[0.18em] text-[#c4a574]">{AI_ENTRY.day.toUpperCase()}</span>
            {done[AI_ENTRY.id]?.passed ? (
              <span className="font-game text-xs tracking-[0.14em] text-[#8fe0b4]">DONE · {done[AI_ENTRY.id].best}%</span>
            ) : (
              <span className="font-game text-xs tracking-[0.14em] text-[#a8a59c]">FOR EVERYONE</span>
            )}
          </div>
          <p className="mt-2 font-display text-3xl">{AI_ENTRY.title}</p>
          <p className="mt-2 max-w-2xl text-[#d8d2c4]">
            The assistant you were given, the answers it invents, the apps that want your mailbox, and the people using AI against you.
          </p>
          <p className="mt-2 text-sm text-[#a8a59c]">{AI_ENTRY.topics.replaceAll(" · ", ", ")}.</p>
        </a>

        <h2 className="mt-14 font-display text-3xl">Role tracks</h2>
        <p className="mt-2 max-w-xl text-[#a8a59c]">For people with a security duty in their job. Your admin assigns these, or take any that fits.</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {TRACK_LIST.map((t) => {
            const rec = done[t.id];
            return (
              <li key={t.id}>
                <a href={t.href} className="block h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#c4a574]/60 hover:bg-white/[0.06]">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-game text-sm tracking-[0.18em] text-[#c4a574]">{t.day.toUpperCase()}</span>
                    {rec?.passed && <span className="font-game text-xs tracking-[0.14em] text-[#8fe0b4]">DONE</span>}
                  </div>
                  <p className="mt-2 font-display text-2xl">{t.title}</p>
                  <p className="mt-2 text-sm text-[#a8a59c]">{t.topics.replaceAll(" · ", ", ")}.</p>
                </a>
              </li>
            );
          })}
        </ul>

        <a href="/reminder" className="mt-10 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-[#c4a574]/60">
          <div>
            <p className="font-game text-sm tracking-[0.18em] text-[#c4a574]">THIS MONTH</p>
            <p className="mt-1 font-display text-2xl">Monthly reminder</p>
            <p className="mt-1 text-sm text-[#a8a59c]">One minute, one question. A new one each month.</p>
          </div>
          <span className="font-game text-lg text-[#c4a574]">Open</span>
        </a>
      </div>
    </div>
  );
}
