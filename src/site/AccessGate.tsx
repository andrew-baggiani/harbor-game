import { useEffect, useState, type ReactNode } from "react";
import type { Me } from "@/site/portal-api";

/**
 * The game is for teams with a workspace (paid, trial, partner NFR, or a pre-billing pilot). Visitors get a
 * way in instead: a free trial with founding pricing, a demo, or the partner program.
 *
 * Promo moments: add a shift id to FREE_SHIFTS to let anyone play it (e.g. a new OWASP scenario launch).
 * This is a front-door check; the decision log (/api/events) separately requires a signed-in learner.
 */
export const FREE_SHIFTS: string[] = [];

type State = "checking" | "allowed" | "visitor" | "lapsed";

export function AccessGate({ shift, children }: { shift: string; children: ReactNode }) {
  const [state, setState] = useState<State>("checking");
  useEffect(() => {
    const host = window.location.hostname;
    if (FREE_SHIFTS.includes(shift) || host === "localhost" || host === "127.0.0.1") {
      setState("allowed");
      return;
    }
    let live = true;
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? (r.json() as Promise<Me>) : null))
      .then((me) => {
        if (!live) return;
        if (me?.canPlay) setState("allowed");
        else setState(me?.user ? "lapsed" : "visitor");
      })
      .catch(() => live && setState("visitor"));
    return () => {
      live = false;
    };
  }, [shift]);

  if (state === "allowed") return <>{children}</>;
  if (state === "checking") return <div className="h-dvh w-full bg-[#07090e]" aria-busy="true" />;

  const next = typeof window !== "undefined" ? window.location.pathname : "/play";
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[#07090e] p-6 font-ui text-[#f4f0e6]">
      <div className="w-full max-w-lg">
        <p className="font-game text-xs tracking-[0.24em] text-[#c4a574]">DRY RUN CYBER</p>
        {state === "lapsed" ? (
          <>
            <h1 className="mt-3 font-display text-4xl leading-tight">Your workspace isn't active right now.</h1>
            <p className="mt-4 text-[#d8d2c4]">
              The trial may have ended, or you're not on a team yet. Your admin can add you, or you can pick a plan for your company.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/portal" className="rounded-full bg-[#c4a574] px-6 py-3 font-game tracking-[0.12em] text-[#14110c]">
                OPEN THE PORTAL
              </a>
              <a href="/pricing" className="rounded-full border border-white/20 px-5 py-3 text-sm hover:border-white/40">
                See plans
              </a>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-3 font-display text-4xl leading-tight">The night shift opens soon.</h1>
            <p className="mt-4 text-[#d8d2c4]">
              Dry Run Cyber is security awareness training you play, for teams. Start your team on a free 14-day trial, with founding pricing
              when you buy.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/pricing#trial" className="rounded-full bg-[#c4a574] px-6 py-3 font-game tracking-[0.12em] text-[#14110c]">
                START A FREE TRIAL
              </a>
              <a href="/pricing#demo" className="rounded-full border border-white/20 px-5 py-3 text-sm hover:border-white/40">
                Book a demo
              </a>
              <a href="/partners" className="rounded-full border border-white/20 px-5 py-3 text-sm hover:border-white/40">
                MSPs: become a partner
              </a>
            </div>
            <p className="mt-6 text-sm text-[#a8a59c]">
              Already on a team?{" "}
              <a href={`/login?next=${encodeURIComponent(next)}`} className="underline underline-offset-4 hover:text-[#f4f0e6]">
                Sign in
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
