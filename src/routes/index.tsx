import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChatWidget } from "@/site/ChatWidget";
import { CONTACT, SiteFooter, SiteNav, SkipLink } from "@/site/SiteChrome";
import { WEEK } from "@/game/week";
import phishing from "@/content/scenarios/mon-02-phishing.json";
import { Arrow, Avatar, Check, Gauge, LiveDot, Lock, MiniRing, Pill, btn } from "@/portal/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dry Run Cyber: rehearse the attack before it's real" },
      {
        name: "description",
        content:
          "Employees work one night shift and meet phishing, fake IT calls, tailgaters and wire fraud as they happen. Every decision is recorded against NIST, CIS, HIPAA and CMMC controls.",
      },
      { name: "theme-color", content: "#101319" },
      { property: "og:title", content: "Dry Run Cyber: rehearse the attack before it's real" },
      { property: "og:description", content: "First-person security awareness training for MSPs. One night shift, nine decisions, every one mapped to compliance controls." },
      { property: "og:image", content: "https://dryruncyber.com/og.jpg" },
      { property: "og:url", content: "https://dryruncyber.com/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "apple-touch-icon", href: "/brand/apple-touch-icon.png" },
    ],
  }),
  component: Landing,
});


function Landing() {
  const phone = usePhone();
  return (
    <div className="site min-h-dvh overflow-x-clip">
      <SkipLink />
      <SiteNav />
      <main id="main">
        <Hero phone={phone} />
        <TryOne />
        <section aria-label="The game" className="px-6 pb-16 sm:hidden">
          <HeroFigure active={phone === true} />
        </section>
        <Night />
        <Later />
        <Evidence />
        <ForMsps />
        <Close />
      </main>
      <SiteFooter />
      <ChatWidget />
    </div>
  );
}

/* ---------------------------------------------------------------- hero: the game, first person */

function usePhone() {
  const [phone, setPhone] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return phone;
}

function Hero({ phone }: { phone: boolean | null }) {
  return (
    <section aria-labelledby="hero-title" className="hero-glow relative">
      <div className="relative mx-auto max-w-[1240px] px-6 pb-16 pt-8 sm:pb-24 md:px-10 lg:pb-32 lg:pt-14">
      <div className="grid items-end gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <div>
          <p className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-2 pr-4 text-[14px] font-semibold text-site-paper backdrop-blur">
            <span className="rounded-full bg-site-mint/15 px-2 py-0.5 text-[12px] text-site-mint">New</span>
            First-person security awareness training for MSPs
          </p>
          <h1 id="hero-title" className="display text-[44px] sm:text-[60px] lg:text-[72px] xl:text-[80px]">
            Rehearse the attack before it's real.
          </h1>
        </div>
        <div>
          <p className="max-w-[32rem] text-lg leading-relaxed text-site-mist">
            A game your clients' employees actually play, not a video they mute in another tab. One night shift, nine real-world attacks, and
            every decision recorded against the controls your clients are audited on.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href={CONTACT} className={`${btn.primary} !px-6 !py-3.5 text-base`}>
              Request partner access <Arrow size={17} />
            </a>
            <a href="#night" className={`${btn.ghost} !px-6 !py-3.5 text-base`}>
              See what's in a shift
            </a>
          </div>
          <ul className="mt-7 flex max-w-[34rem] flex-wrap gap-2" aria-label="Mapped frameworks">
            {["NIST 800-53", "NIST 800-171", "CMMC L2", "HIPAA", "CIS v8.1", "NIST CSF 2.0"].map((f) => (
              <li key={f}>
                <Pill tone="dim">{f}</Pill>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="hidden sm:block">
        <HeroFigure active={phone === false} />
      </div>
      </div>
    </section>
  );
}

/** The playable first-person sketch. A still holds the frame until three.js is ready, and only the
 *  copy for the current screen size mounts the scene, so phones never start WebGL above the fold. */
function HeroFigure({ active }: { active: boolean }) {
  const [Scene, setScene] = useState<typeof import("@/site/RehearsalScene").RehearsalScene | null>(null);
  useEffect(() => {
    if (!active) return;
    let live = true;
    void import("@/site/RehearsalScene").then((m) => live && setScene(() => m.RehearsalScene));
    return () => {
      live = false;
    };
  }, [active]);
  return (
    <figure className="mt-14 lg:mt-20">
      <div
        className="brackets lock-in"
        style={{ "--arm": "clamp(28px, 5vw, 56px)", "--stroke": "clamp(5px, 1vw, 9px)", "--inset": "clamp(-24px, -2.5vw, -12px)" } as React.CSSProperties}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-site-ink-2 ring-1 ring-site-violet/40 shadow-[0_40px_120px_-30px_rgba(139,44,245,0.55)] sm:aspect-[16/10] lg:aspect-[21/9]">
          <img src="/brand/hero-still.webp" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
          {Scene ? (
            <div className="absolute inset-0">
              <Scene className="h-full w-full" />
            </div>
          ) : null}
        </div>
      </div>
      <figcaption className="mt-8 min-h-5 text-sm text-site-dim">
        {Scene ? "A playable sketch of the Monday shift. When a prompt appears, press E or Q, or tap it." : "A sketch of the Monday shift, in first person."}
      </figcaption>
    </figure>
  );
}

/* ---------------------------------------------------------------- try one: a real one-decision dry run */

type Pick = null | "report" | "click" | "reply";

const OUTCOME: Record<Exclude<Pick, null>, { good: boolean; title: string; body: string }> = {
  report: {
    good: true,
    title: "Good call.",
    body: "Elena is in the board meeting and never sent it. A call to a number you already trust is the one check an email can't fake.",
  },
  click: {
    good: false,
    title: "That money is gone.",
    body: "The new account belongs to the attacker, and a cleared wire is hard to pull back. Here it cost nothing. That's the point.",
  },
  reply: {
    good: false,
    title: "Your reply went to them.",
    body: "The address is one word off your company's. They'll gladly confirm it's real, and now they know you're ready to pay.",
  },
};

const FLAGS = [
  { id: "from", text: "The sender's domain is hollisgrant-co.com, not hollisgrant.com." },
  { id: "clock", text: "Pay today, and a reason you can't call to check." },
  { id: "acct", text: "New bank details arriving by email. That's the whole fraud." },
];

function TryOne() {
  const [pick, setPick] = useState<Pick>(null);
  const [peek, setPeek] = useState(false);
  const out = pick ? OUTCOME[pick] : null;
  const flagged = pick !== null;

  return (
    <section aria-labelledby="try-title" className="border-t border-white/[0.06]">
      <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-6 py-24 md:px-10 lg:grid-cols-[1fr_minmax(0,500px)] lg:gap-16 lg:py-32 xl:gap-24">
      <div>
        <h2 id="try-title" className="display text-[38px] lg:text-[52px]">Try one decision.</h2>
        <p className="mt-6 max-w-[30rem] text-lg leading-relaxed text-site-mist">
          In the game this lands on your desk while finance is waiting on you and the clock says 4:52. Here it's just the email. What do you do?
        </p>
      </div>
      <div className="relative">
        <p className="mb-6 text-[15px] text-site-mist">
          {pick ? "Here's what was hiding in it." : "Landed in your inbox at 4:52 PM."}
        </p>
        <div
          className="brackets"
          style={{ "--arm": "clamp(28px, 6vw, 44px)", "--stroke": "clamp(5px, 1.2vw, 8px)", "--inset": "clamp(-22px, -3vw, -12px)", "--c": out ? (out.good ? "var(--color-site-mint)" : "var(--color-site-alarm)") : "var(--color-site-violet)" } as React.CSSProperties}
        >
          <article aria-label="Practice email" className="panel !p-0 overflow-hidden text-[15px]">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <p className="font-semibold">Supplier bank change: please pay today</p>
              <p className="mt-1.5 text-site-mist">
                Elena Park, CFO{" "}
                <span className="flag brackets inline-block" data-on={flagged}>
                  <button
                    type="button"
                    onMouseEnter={() => setPeek(true)}
                    onMouseLeave={() => setPeek(false)}
                    onFocus={() => setPeek(true)}
                    onBlur={() => setPeek(false)}
                    className="text-left text-site-mist underline decoration-dotted decoration-white/25 underline-offset-4"
                  >
                    &lt;elena.park@hollisgrant-co.com&gt;
                  </button>
                </span>
              </p>
              <p className="mt-0.5 text-site-dim">To: you@hollisgrant.com</p>
            </div>
            <div className="space-y-3 px-5 py-5 leading-relaxed text-site-mist">
              <p>Quick one before I walk into the board meeting. Northgate Freight moved banks.</p>
              <p>
                Please update their details and release{" "}
                <span className="flag brackets inline-block font-semibold text-site-paper" data-on={flagged}>
                  today's $48,200 payment
                </span>{" "}
                to the account below.{" "}
                <span className="flag brackets inline-block" data-on={flagged}>
                  I'm in meetings all afternoon, so don't call
                </span>
                . Just reply when it's done.
              </p>
              <div className="flag brackets block" data-on={flagged}>
                <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[14px]">
                  <p className="text-site-dim">New account</p>
                  <p className="num mt-0.5 font-semibold text-site-paper">Northgate Freight · account ending 7731</p>
                </div>
              </div>
              <p className="pt-1 text-site-dim">Elena</p>
            </div>
            <div className="flex min-h-9 items-center border-t border-white/[0.06] px-5 py-2 text-[13px] text-site-dim">
              {peek || flagged ? (
                <span>
                  Replies go to <span className="text-site-alarm">hollisgrant-co.com</span>, not your company's domain.
                </span>
              ) : (
                <span>Check who a reply actually goes to before you send one.</span>
              )}
            </div>
          </article>
        </div>

        <div className="mt-10 min-h-[164px]" aria-live="polite">
          {!out ? (
            <div role="group" aria-label="What do you do?" className="grid gap-2.5 sm:max-w-[24rem]">
              <DemoButton onClick={() => setPick("report")}>Call Elena on the number you already have</DemoButton>
              <DemoButton onClick={() => setPick("click")}>Update the details and pay</DemoButton>
              <DemoButton onClick={() => setPick("reply")}>Reply to check it's really her</DemoButton>
            </div>
          ) : (
            <div>
              <div className="flex items-start gap-4">
                {out.good && (
                  <svg viewBox="0 0 300 260" className="mt-1 h-9 w-10 shrink-0" aria-hidden="true">
                    <path className="check-draw" d="M28 190 L66 226 L282 14" fill="none" stroke="var(--color-site-mint)" strokeWidth="34" strokeLinejoin="miter" />
                  </svg>
                )}
                <div>
                  <p className="text-xl font-bold" style={{ fontStretch: "112%" }}>{out.title}</p>
                  <p className="mt-1.5 max-w-[30rem] leading-relaxed text-site-mist">{out.body}</p>
                </div>
              </div>
              <ul className="mt-5 space-y-1.5 text-[15px] text-site-mist">
                {FLAGS.map((f) => (
                  <li key={f.id} className="flex gap-3">
                    <span aria-hidden="true" className="mt-[9px] h-[2px] w-3 shrink-0 bg-site-alarm" />
                    {f.text}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setPick(null)} className={`${btn.ghost} mt-6 !py-2 text-[15px]`}>
                Run it again
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </section>
  );
}

function DemoButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-[15px] font-semibold text-site-paper transition hover:border-site-violet hover:bg-site-violet/10"
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------- the night */

const BEATS = [
  ["The door", "Someone with full hands needs it held. They don't have a badge on."],
  ["The inbox", "A password reset that looks exactly like the real one."],
  ["The call", "IT is on the line and needs the code that just hit your phone."],
  ["The drive", "A USB stick by the elevator, labeled with this quarter's bonuses."],
  ["The wire", "The CFO, in a hurry, with new bank details for a supplier. Today."],
  ["The update", "A pop-up that wants a restart in the middle of a deadline."],
  ["The push", "A sign-in approval you didn't start. Then another. Then another."],
  ["The send", "Autocomplete offers the wrong Mark, and he's outside the company."],
  ["The desk", "End of shift. What's left out, and who walks past it."],
];

function Night() {
  return (
    <section id="night" aria-labelledby="night-title" className="border-t border-site-rule">
      <div className="mx-auto grid max-w-[1240px] gap-14 px-6 py-24 md:px-10 lg:grid-cols-[380px_1fr] lg:gap-20 lg:py-32">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 id="night-title" className="display text-[38px] lg:text-[52px]">One shift. Nine decisions.</h2>
          <p className="mt-6 max-w-[26rem] text-lg leading-relaxed text-site-mist">
            No slides and no quiz at the end. People walk the floor, open the apps, take the calls, and decide. About twenty minutes a night.
          </p>
        </div>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {BEATS.map(([t, d], i) => (
            <li key={t} className="panel lift !p-5">
              <span className="num inline-grid h-8 w-8 place-items-center rounded-lg bg-site-violet/15 text-[13px] font-bold text-site-violet-hi">{i + 1}</span>
              <p className="mt-4 text-xl font-bold" style={{ fontStretch: "118%" }}>{t}</p>
              <p className="mt-1.5 leading-relaxed text-site-mist">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- consequences */

const LATER = [
  { now: "You plug in the drive to see whose it is.", gap: "75 seconds later", later: "The printer by the hot desks wakes up on its own and starts spitting out garbage. Then IT calls about strange traffic from your floor." },
  { now: "You send the manifest to the Mark that autocomplete offered.", gap: "60 seconds later", later: "A stranger calls the desk. He doesn't work for you, and he's holding a file full of your customers' names and addresses." },
  { now: "You hold the door for the courier.", gap: "End of shift", later: "There's a parcel on a desk that wasn't there before." },
];

function Later() {
  return (
    <section aria-labelledby="later-title" className="later-glow relative">
      <div className="mx-auto max-w-[1240px] px-6 py-24 md:px-10 lg:py-32">
        <h2 id="later-title" className="display max-w-[16ch] text-[38px] lg:text-[52px]">Mistakes don't end the scene. They come back.</h2>
        <p className="mt-6 max-w-[36rem] text-lg leading-relaxed text-site-mist">
          Nobody gets a red X and a lecture. The night carries on, and what you did shows up later, the way it would at work.
        </p>
        <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {LATER.map((r) => (
            <div key={r.now} className="panel flex flex-col">
              <p className="text-lg font-semibold leading-snug">{r.now}</p>
              <div className="my-5 flex items-center gap-3">
                <Pill tone="alarm" dot>
                  {r.gap}
                </Pill>
                <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-site-alarm/50 to-transparent" />
              </div>
              <p className="leading-relaxed text-site-mist">{r.later}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- evidence */

const FRAMEWORK: Record<string, string> = {
  "NIST_800-53r5": "NIST SP 800-53 Rev. 5",
  "NIST_800-171r2": "NIST SP 800-171 Rev. 2",
  CMMC_L2: "CMMC Level 2",
  HIPAA: "HIPAA Security Rule",
  "CIS_v8.1": "CIS Controls v8.1",
  "CSF_2.0": "NIST CSF 2.0",
};

function Evidence() {
  const controls = Object.entries((phishing as { controls: Record<string, string[]> }).controls);
  return (
    <section aria-labelledby="evidence-title" className="mx-auto max-w-[1240px] px-6 py-24 md:px-10 lg:py-32">
      <div className="grid gap-14 lg:grid-cols-[1fr_minmax(0,620px)] lg:gap-20">
        <div>
          <h2 id="evidence-title" className="display text-[38px] lg:text-[52px]">Every decision is evidence.</h2>
          <p className="mt-6 max-w-[30rem] text-lg leading-relaxed text-site-mist">
            The record shows what each person actually did, when, and which requirement it covers. It reads like an audit artifact, not a
            completion certificate.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/sample-record" className={btn.primary}>
              See a sample record <Arrow size={16} />
            </a>
            <a href="/coverage" className={btn.ghost}>
              Control coverage
            </a>
          </div>
          <p className="mt-6 max-w-[30rem] text-[15px] leading-relaxed text-site-dim">
            Records hold work email, choices and scores, nothing else, and only the client's admins and their MSP can see them.{" "}
            <a href="/privacy" className="text-site-paper underline decoration-white/25 underline-offset-4">
              Privacy
            </a>
          </p>
        </div>
        <figure>
          <div className="brackets panel !p-6 sm:!p-8" style={{ "--arm": "30px", "--stroke": "6px", "--inset": "-14px" } as React.CSSProperties}>
            <dl className="grid grid-cols-[7.5rem_1fr] gap-x-6 gap-y-3 text-[15px]">
              <dt className="text-site-dim">Decision</dt>
              <dd>Reported the password-reset email as phishing</dd>
              <dt className="text-site-dim">Outcome</dt>
              <dd>
                <Pill tone="mint" dot>
                  Correct
                </Pill>
              </dd>
              <dt className="text-site-dim">Scenario</dt>
              <dd>Monday, the inbox</dd>
            </dl>
            <div className="mt-6 border-t border-site-rule pt-6">
              <p className="text-[15px] text-site-dim">Maps to</p>
              <ul className="mt-3 space-y-2 text-[15px]">
                {controls.map(([fw, ids]) => (
                  <li key={fw} className="grid grid-cols-1 gap-x-6 sm:grid-cols-[13rem_1fr]">
                    <span className="text-site-mist">{FRAMEWORK[fw] ?? fw}</span>
                    <span className="tabular-nums">{ids.join(", ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <figcaption className="mt-8 text-sm text-site-dim">One line from a training record. Control mappings are the ones shipped with the Monday shift.</figcaption>
        </figure>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- MSPs + the week */

function ForMsps() {
  return (
    <section id="msps" aria-labelledby="msps-title" className="border-t border-site-rule">
      <div className="mx-auto max-w-[1240px] px-6 py-24 md:px-10 lg:py-32">
        <h2 id="msps-title" className="display max-w-[18ch] text-[38px] lg:text-[52px]">Built for MSPs to resell.</h2>
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Point title="Monday ships today">
            About twenty minutes, nine decisions, and a record for every person that you can hand an auditor.
          </Point>
          <Point title="Training clients finish">
            A short night shift people want to see the end of, instead of a video they leave running in another tab.
          </Point>
          <Point title="Proof for the audit">
            Each decision maps to NIST, CIS, HIPAA and CMMC controls, so the report answers the question auditors actually ask.
          </Point>
          <Point title="A portal for every client">
            Readiness across all your clients, one-click reminders, and evidence exports in one place.
          </Point>
        </div>

        <PortalPreview />

        <h3 className="mt-24 text-2xl font-bold" style={{ fontStretch: "118%" }}>Where it's going</h3>
        <p className="mt-3 max-w-[40rem] text-lg leading-relaxed text-site-mist">
          Monday is the first night of a full week: one shift a day, each mapped to its own block of required training. Role-based tracks for admins and
          finance, and per-client branding, come after.
        </p>
        <ol className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {WEEK.map((s) => (
            <li key={s.day} className={`panel !p-5 ${s.status === "open" ? "ring-1 ring-site-violet/50" : "opacity-85"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-bold ${s.status === "open" ? "text-site-mint" : "text-site-dim"}`}>{s.day}</span>
                {s.status === "open" ? (
                  <Pill tone="mint" dot>
                    Live
                  </Pill>
                ) : (
                  <Pill tone="dim">
                    <Lock size={12} /> Soon
                  </Pill>
                )}
              </div>
              <p className="mt-3 text-lg font-bold" style={{ fontStretch: "112%" }}>{s.title}</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-site-dim">{s.topics.replaceAll(" · ", ", ")}.</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Point({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel">
      <p className="flex items-center gap-2.5 text-xl font-bold" style={{ fontStretch: "112%" }}>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-site-mint/15 text-site-mint">
          <Check size={15} />
        </span>
        {title}
      </p>
      <p className="mt-3 max-w-[30rem] text-[17px] leading-relaxed text-site-mist">{children}</p>
    </div>
  );
}

/* ---------------------------------------------------------------- close + footer */

function Close() {
  return (
    <section aria-labelledby="close-title" className="mx-auto max-w-[1240px] px-6 pb-28 pt-8 md:px-10 lg:pb-40">
      <div className="aurora mx-auto max-w-[980px] px-6 py-16 text-center sm:px-12 sm:py-20">
        <h2 id="close-title" className="display mx-auto max-w-[12ch] text-[38px] lg:text-[64px]">Run it before it runs you.</h2>
        <p className="mx-auto mt-6 max-w-[34rem] text-lg leading-relaxed text-site-mist">
          Monday is ready now. Tell us about your clients and we'll set you up with partner access.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a href={CONTACT} className={`${btn.primary} !px-7 !py-4 text-base`}>
            Email hello@dryruncyber.com
          </a>
          <a href="/login" className={`${btn.ghost} !px-7 !py-4 text-base`}>
            Partner sign in
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- the partner portal, shown live with sample data */

const SAMPLE = [
  { name: "Pinecrest Credit Union", pct: 69, tone: "amber" as const, label: "Due in 2 days" },
  { name: "Acme Freight", pct: 60, tone: "violet" as const, label: "In progress" },
  { name: "Summit Orthopedics", pct: 25, tone: "alarm" as const, label: "Overdue" },
];
const FEED = [
  ["Quinn F.", "made the right call on the USB drop", "Pinecrest", "1 min ago"],
  ["Jamal D.", "finished Monday", "Summit Ortho", "9 min ago"],
  ["Maria O.", "reported the phishing email", "Acme Freight", "25 min ago"],
];

function PortalPreview() {
  return (
    <figure className="mt-16">
      <div className="aurora p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="panel !bg-[#121620]/80">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="min-w-0">
                <p className="text-sm text-site-mist">Good evening,</p>
                <p className="text-3xl font-extrabold" style={{ fontStretch: "118%" }}>Northbridge IT</p>
                <p className="mt-2 text-site-mist">14 of 28 people across 5 clients have finished Monday.</p>
              </div>
              <Gauge value={50} size={132} sub="finished" />
            </div>
            <ul className="mt-6 space-y-2">
              {SAMPLE.map((c) => (
                <li key={c.name} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <MiniRing value={c.pct} size={36} />
                  <span className="min-w-0 flex-1 truncate font-semibold">{c.name}</span>
                  <Pill tone={c.tone} dot>
                    {c.label}
                  </Pill>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel !bg-[#121620]/80">
            <div className="flex items-center justify-between">
              <p className="font-bold">Live activity</p>
              <LiveDot />
            </div>
            <ul className="mt-4 space-y-3">
              {FEED.map(([who, what, org, when]) => (
                <li key={who} className="flex gap-3 text-[14px] leading-snug">
                  <Avatar name={who} size={30} />
                  <span>
                    <b>{who}</b> <span className="text-site-mist">{what}</span>
                    <span className="mt-0.5 block text-[12.5px] text-site-dim">
                      {org} · {when}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <figcaption className="mt-6 text-sm text-site-dim">The partner portal, with sample data. Every client's readiness, one-click reminders, and evidence on demand.</figcaption>
    </figure>
  );
}
