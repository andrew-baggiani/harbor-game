import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND } from "@/site/brand";
import { WEEK } from "@/game/week";
import { FRAMEWORK_LABEL } from "@/content/controls";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${BRAND.product} · ${BRAND.tagline}` },
      {
        name: "description",
        content:
          "A walkable 3D night shift where employees meet phishing, phone scams, tailgaters and wire fraud in the moment, with every decision mapped to NIST, CIS, HIPAA and CMMC controls.",
      },
      { property: "og:image", content: "/og.jpg" },
    ],
  }),
  component: Landing,
});

const GOLD = "#c4a574";

const BEATS = [
  ["The door", "Someone with full hands needs you to hold it. Do you?"],
  ["The inbox", "A password-reset email that looks just like the real one."],
  ["The call", "“IT” on line one, asking for the code on your phone."],
  ["The push", "An authenticator prompt you didn’t start, again and again."],
  ["The USB", "A drive in the lobby labeled “Q4 bonuses.”"],
  ["The wire", "The CFO, urgent, a new account number, today."],
];

const MSP = [
  ["Mapped evidence", "Every choice is tagged to the controls your clients answer for, so the record reads like an audit artifact, not a quiz score."],
  ["Consequences, not quizzes", "Plug in the USB and the printer starts acting up 75 seconds later. People remember what happened to them."],
  ["Twenty minutes a night", "One shift a day, Monday to Friday. Each one is a full block of required training in a single sitting."],
  ["Built to resell", "Per-client branding and reporting are on the roadmap so it ships as your offer, under your stack."],
];

function Landing() {
  return (
    <div className="min-h-dvh bg-[#07090e] font-ui text-[#f4f0e6]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <p className="font-game text-xl font-bold tracking-[0.18em] uppercase">{BRAND.product}</p>
        <nav className="flex items-center gap-6 text-sm text-[#f4f0e6]/70">
          <a href="#msp" className="hidden hover:text-[#f4f0e6] sm:inline">For MSPs</a>
          <Link to="/coverage" className="hidden hover:text-[#f4f0e6] sm:inline">Control coverage</Link>
          <Link to="/play" className="rounded-md border border-[#c4a574]/60 px-4 py-2 font-game font-semibold tracking-[0.12em] text-[#f4f0e6] uppercase hover:bg-[#c4a574]/15">
            Play Monday
          </Link>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <img src="/og.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07090e]/30 via-[#07090e]/70 to-[#07090e]" />
        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-28 md:pt-36 md:pb-40">
          <p className="font-game text-sm font-semibold tracking-[0.32em]" style={{ color: GOLD }}>
            SECURITY AWARENESS TRAINING · THE NIGHT SHIFT
          </p>
          <h1 className="mt-4 max-w-3xl font-game text-6xl leading-[0.9] font-bold uppercase md:text-8xl">
            Rehearse the attack before it’s real.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[#f4f0e6]/80">
            Your people work one night at a harbor office. The phishing email, the fake IT call, the stranger at the door: they happen in the moment, and every choice lands in a record mapped to the frameworks your clients are audited on.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/play" className="rounded-md px-6 py-3 font-game text-lg font-bold tracking-[0.14em] text-[#07090e] uppercase" style={{ background: GOLD }}>
              Start the shift
            </Link>
            <a href="#msp" className="rounded-md border border-[#f4f0e6]/25 px-6 py-3 font-game text-lg font-semibold tracking-[0.14em] uppercase hover:bg-[#f4f0e6]/10">
              I&rsquo;m an MSP
            </a>
          </div>
          <p className="mt-4 text-sm text-[#f4f0e6]/50">Runs in the browser. Desktop or phone. No install.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-game text-4xl font-bold uppercase">Monday night, in nine decisions</h2>
        <p className="mt-3 max-w-2xl text-[#f4f0e6]/70">No multiple choice. You walk the floor, open the apps, take the calls, and live with what you did.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BEATS.map(([t, d]) => (
            <div key={t} className="rounded-lg border border-[#f4f0e6]/10 bg-[#f4f0e6]/[0.03] p-5">
              <p className="font-game text-xl font-semibold uppercase" style={{ color: GOLD }}>{t}</p>
              <p className="mt-2 text-[#f4f0e6]/75">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[#f4f0e6]/10 bg-[#0b0e15]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-game text-4xl font-bold uppercase">The week</h2>
          <ol className="mt-8 divide-y divide-[#f4f0e6]/10">
            {WEEK.map((s) => (
              <li key={s.day} className="grid gap-2 py-5 md:grid-cols-[10rem_14rem_1fr] md:items-baseline">
                <span className="font-game text-lg font-semibold tracking-[0.14em] uppercase" style={{ color: s.status === "open" ? GOLD : undefined }}>
                  {s.day}
                </span>
                <span className="font-game text-2xl font-bold uppercase">
                  {s.title}
                  {s.status === "soon" && <span className="ml-3 align-middle text-xs tracking-[0.2em] text-[#f4f0e6]/40">SOON</span>}
                </span>
                <span className="text-[#f4f0e6]/65">{s.topics}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="msp" className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-game text-sm font-semibold tracking-[0.32em]" style={{ color: GOLD }}>FOR MSPs</p>
        <h2 className="mt-3 font-game text-4xl font-bold uppercase md:text-5xl">Awareness training your clients finish.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {MSP.map(([t, d]) => (
            <div key={t}>
              <p className="font-game text-2xl font-semibold uppercase">{t}</p>
              <p className="mt-2 text-[#f4f0e6]/70">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-lg border border-[#f4f0e6]/10 p-6">
          <p className="text-sm text-[#f4f0e6]/60">Decisions map to</p>
          <p className="mt-2 font-game text-xl font-semibold">{Object.values(FRAMEWORK_LABEL).join(" · ")}</p>
          <Link to="/coverage" className="mt-4 inline-block text-sm underline underline-offset-4" style={{ color: GOLD }}>
            See the full control coverage
          </Link>
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          <Link to="/play" className="rounded-md px-6 py-3 font-game text-lg font-bold tracking-[0.14em] text-[#07090e] uppercase" style={{ background: GOLD }}>
            Play Monday free
          </Link>
          {BRAND.contact && (
            <a href={BRAND.contact} className="rounded-md border border-[#f4f0e6]/25 px-6 py-3 font-game text-lg font-semibold tracking-[0.14em] uppercase hover:bg-[#f4f0e6]/10">
              Talk to us
            </a>
          )}
        </div>
      </section>

      <footer className="border-t border-[#f4f0e6]/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-[#f4f0e6]/45">
          <span>{BRAND.product} · dryruncyber.com</span>
          <span>Partner portal coming soon</span>
        </div>
      </footer>
    </div>
  );
}
