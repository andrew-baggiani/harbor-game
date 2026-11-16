import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BRAND } from "@/site/brand";
import { WEEK } from "@/game/week";
import phishing from "@/content/scenarios/mon-02-phishing.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${BRAND.product}: security awareness training people rehearse, not watch` },
      {
        name: "description",
        content:
          "Employees work one night shift and meet phishing, fake IT calls, tailgaters and wire fraud as they happen. Every decision is recorded against NIST, CIS, HIPAA and CMMC controls.",
      },
      { name: "theme-color", content: "#101319" },
      { property: "og:title", content: "Dry Run Cyber: rehearse the attack before it's real" },
      { property: "og:description", content: "Security awareness training people play, not watch. One night shift, nine decisions, every one mapped to compliance controls." },
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

const CONTACT = "mailto:hello@dryruncyber.com?subject=Dry%20Run%20Cyber%20access";

function Landing() {
  return (
    <div className="site min-h-dvh overflow-x-clip">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-site-paper focus:px-3 focus:py-2 focus:text-site-ink">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Night />
        <Later />
        <Evidence />
        <ForMsps />
        <Close />
      </main>
      <Footer />
    </div>
  );
}

/* ---------------------------------------------------------------- nav */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className={`sticky top-0 z-30 transition-colors duration-300 ${scrolled ? "border-b border-site-rule bg-site-ink/85 backdrop-blur-md" : "border-b border-transparent"}`}>
    <header className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-6 py-4 md:px-10 md:py-5">
      <a href="/" aria-label="Dry Run Cyber home" className="shrink-0">
        <img src="/brand/logo-horizontal.svg" alt="Dry Run Cyber" className="h-10 w-auto md:h-12" />
      </a>
      <nav aria-label="Primary" className="flex items-center gap-7 text-[15px] text-site-mist">
        <a href="#night" className="hidden hover:text-site-paper lg:inline">How it works</a>
        <a href="#msps" className="hidden hover:text-site-paper md:inline">For MSPs</a>
        <a href="/play" className="hidden hover:text-site-paper sm:inline">Partner login</a>
        <a href={CONTACT} className="rounded-md border border-site-violet px-4 py-2 font-semibold text-site-paper transition-colors hover:bg-site-violet">
          Get access
        </a>
      </nav>
    </header>
    </div>
  );
}

/* ---------------------------------------------------------------- hero: a real one-decision dry run */

type Pick = null | "report" | "click" | "reply";

const OUTCOME: Record<Exclude<Pick, null>, { good: boolean; title: string; body: string }> = {
  report: {
    good: true,
    title: "Good catch.",
    body: "Reporting it lets IT pull the same email out of everyone else's inbox before someone else clicks.",
  },
  click: {
    good: false,
    title: "That's the click they wanted.",
    body: "The sign-in page was a copy, and the password you'd type goes straight to them. Here it cost nothing. That's the point.",
  },
  reply: {
    good: false,
    title: "Your reply went to them, not IT.",
    body: "Now they know the address is live and someone answers. The next email will be better.",
  },
};

const FLAGS = [
  { id: "from", text: "The sender's domain isn't yours: hollisgrant-support.com." },
  { id: "clock", text: "A deadline two hours away, so you don't stop to check." },
  { id: "link", text: "The button goes to the same lookalike domain, not your real sign-in page." },
];

function Hero() {
  const [pick, setPick] = useState<Pick>(null);
  const [peek, setPeek] = useState(false);
  const out = pick ? OUTCOME[pick] : null;
  const flagged = pick !== null;

  return (
    <section aria-labelledby="hero-title" className="mx-auto grid max-w-[1240px] items-center gap-14 px-6 pb-24 pt-10 md:px-10 lg:grid-cols-[1fr_minmax(0,500px)] lg:gap-16 xl:gap-24 lg:pb-36 lg:pt-16">
      <div>
        <h1 id="hero-title" className="display text-[44px] sm:text-[60px] lg:text-[64px] xl:text-[76px]">
          Rehearse the attack before it's real.
        </h1>
        <p className="mt-7 max-w-[34rem] text-lg leading-relaxed text-site-mist">
          Security awareness training your people play, not watch. One night shift, nine decisions: the phishing email, the fake IT call, the
          stranger at the door. Every choice is logged against the controls your clients are audited on.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a href={CONTACT} className="rounded-md bg-site-violet px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-site-violet-hi">
            Get access
          </a>
          <a href="#night" className="rounded-md px-2 py-3.5 text-base font-semibold text-site-paper underline decoration-site-rule decoration-2 underline-offset-[6px] hover:decoration-site-mint">
            See what's in a shift
          </a>
        </div>
        <p className="mt-6 text-sm text-site-dim">Runs in the browser on desktop or phone. Nothing to install.</p>
      </div>

      <div className="relative">
        <p className="mb-6 text-[15px] text-site-mist">
          {pick ? "Here's what was hiding in it." : "Try one. This landed in your inbox at 4:52 PM."}
        </p>
        <div
          className="brackets lock-in"
          style={{ "--arm": "clamp(28px, 6vw, 44px)", "--stroke": "clamp(5px, 1.2vw, 8px)", "--inset": "clamp(-22px, -3vw, -12px)", "--c": out ? (out.good ? "var(--color-site-mint)" : "var(--color-site-alarm)") : "var(--color-site-violet)" } as React.CSSProperties}
        >
          <article aria-label="Practice email" className="rounded-[10px] bg-site-ink-2 text-[15px] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)]">
            <div className="border-b border-site-rule px-5 py-4">
              <p className="font-semibold">Action required: your mailbox locks at 5:00 PM</p>
              <p className="mt-1.5 text-site-mist">
                IT Service Desk{" "}
                <span className="flag brackets inline-block" data-on={flagged}>
                  &lt;servicedesk@hollisgrant-support.com&gt;
                </span>
              </p>
              <p className="mt-0.5 text-site-dim">To: you@hollisgrant.com</p>
            </div>
            <div className="space-y-3 px-5 py-5 leading-relaxed text-site-mist">
              <p>We detected unusual sign-in activity on your account.</p>
              <p>
                To keep access, verify your account{" "}
                <span className="flag brackets inline-block font-semibold text-site-paper" data-on={flagged}>
                  within 2 hours
                </span>
                . Unverified accounts are locked automatically.
              </p>
              <p className="pt-1">
                <span className="flag brackets inline-block" data-on={flagged}>
                  <button
                    type="button"
                    onMouseEnter={() => setPeek(true)}
                    onMouseLeave={() => setPeek(false)}
                    onFocus={() => setPeek(true)}
                    onBlur={() => setPeek(false)}
                    onClick={() => setPick((p) => p ?? "click")}
                    className="inline-block rounded bg-[#2b62d9] px-4 py-2 font-semibold text-white"
                  >
                    Verify account
                  </button>
                </span>
              </p>
              <p className="pt-1 text-site-dim">IT Service Desk</p>
            </div>
            <div className="flex h-9 items-center border-t border-site-rule px-5 text-[13px] text-site-dim">
              {peek || flagged ? (
                <span>
                  Link goes to <span className="text-site-alarm">https://hollisgrant-support.com/verify</span>
                </span>
              ) : (
                <span>Check where a button goes before you click it.</span>
              )}
            </div>
          </article>
        </div>

        <div className="mt-10 min-h-[164px]" aria-live="polite">
          {!out ? (
            <div role="group" aria-label="What do you do?" className="grid gap-2.5 sm:max-w-[22rem]">
              <DemoButton onClick={() => setPick("report")}>Report it as phishing</DemoButton>
              <DemoButton onClick={() => setPick("click")}>Click Verify account</DemoButton>
              <DemoButton onClick={() => setPick("reply")}>Reply and ask if it's real</DemoButton>
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
              <button type="button" onClick={() => setPick(null)} className="mt-5 text-[15px] font-semibold text-site-paper underline decoration-site-rule decoration-2 underline-offset-[6px] hover:decoration-site-mint">
                Run it again
              </button>
            </div>
          )}
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
      className="rounded-md border border-site-rule bg-site-ink-2 px-4 py-3 text-left text-[15px] font-medium text-site-paper transition-colors hover:border-site-violet hover:bg-[#1d2230]"
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
        <ol className="divide-y divide-site-rule border-y border-site-rule">
          {BEATS.map(([t, d], i) => (
            <li key={t} className="grid grid-cols-[3rem_1fr] gap-x-4 py-6 sm:grid-cols-[3.5rem_11rem_1fr] sm:items-baseline">
              <span className="text-[15px] tabular-nums text-site-dim">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-xl font-bold" style={{ fontStretch: "118%" }}>{t}</span>
              <span className="col-start-2 mt-1 leading-relaxed text-site-mist sm:col-start-3 sm:mt-0">{d}</span>
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
    <section aria-labelledby="later-title" className="bg-site-ink-2">
      <div className="mx-auto max-w-[1240px] px-6 py-24 md:px-10 lg:py-32">
        <h2 id="later-title" className="display max-w-[16ch] text-[38px] lg:text-[52px]">Mistakes don't end the scene. They come back.</h2>
        <p className="mt-6 max-w-[36rem] text-lg leading-relaxed text-site-mist">
          Nobody gets a red X and a lecture. The night carries on, and what you did shows up later, the way it would at work.
        </p>
        <div className="mt-14 divide-y divide-site-rule border-y border-site-rule">
          {LATER.map((r) => (
            <div key={r.now} className="grid gap-3 py-8 md:grid-cols-[1fr_11rem_1fr] md:items-baseline md:gap-10">
              <p className="text-lg font-semibold">{r.now}</p>
              <p className="flex items-center gap-3 text-[15px] font-semibold text-site-alarm">
                <span aria-hidden="true" className="hidden h-[2px] w-8 bg-site-alarm md:inline-block" />
                {r.gap}
              </p>
              <p className="text-lg leading-relaxed text-site-mist">{r.later}</p>
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
          <a href="/coverage" className="mt-8 inline-block text-[15px] font-semibold underline decoration-site-rule decoration-2 underline-offset-[6px] hover:decoration-site-mint">
            See the full control coverage
          </a>
        </div>
        <figure>
          <div className="brackets rounded-[10px] bg-site-ink-2 p-6 sm:p-8" style={{ "--arm": "30px", "--stroke": "6px", "--inset": "-14px" } as React.CSSProperties}>
            <dl className="grid grid-cols-[7.5rem_1fr] gap-x-6 gap-y-3 text-[15px]">
              <dt className="text-site-dim">Decision</dt>
              <dd>Reported the password-reset email as phishing</dd>
              <dt className="text-site-dim">Outcome</dt>
              <dd className="flex items-center gap-2 text-site-mint">
                <svg viewBox="0 0 300 260" className="h-3.5 w-4" aria-hidden="true">
                  <path d="M28 190 L66 226 L282 14" fill="none" stroke="currentColor" strokeWidth="40" />
                </svg>
                Correct
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
        <div className="mt-14 grid gap-x-16 gap-y-10 md:grid-cols-2">
          <Point title="Training clients finish">
            A short night shift people want to see the end of, instead of a video they leave running in another tab.
          </Point>
          <Point title="Proof for the audit">
            Records map each decision to NIST, CIS, HIPAA and CMMC controls, so the report answers the question auditors actually ask.
          </Point>
          <Point title="A program, not a module">
            One shift a day, Monday to Friday. A full week of required training, delivered as a story.
          </Point>
          <Point title="Your brand on it">
            Per-client branding and partner reporting are on the roadmap, so it can ship as part of your stack.
          </Point>
        </div>

        <h3 className="mt-24 text-2xl font-bold" style={{ fontStretch: "118%" }}>The week</h3>
        <ol className="mt-6 divide-y divide-site-rule border-y border-site-rule">
          {WEEK.map((s) => (
            <li key={s.day} className="grid gap-1 py-5 md:grid-cols-[9rem_13rem_1fr] md:items-baseline md:gap-6">
              <span className={s.status === "open" ? "font-semibold text-site-mint" : "text-site-dim"}>
                {s.day}
                {s.status === "soon" && <span className="block text-sm font-normal">Coming soon</span>}
                {s.status === "open" && <span className="block text-sm font-normal text-site-mist">Live now</span>}
              </span>
              <span className="text-lg font-bold" style={{ fontStretch: "112%" }}>{s.title}</span>
              <span className="leading-relaxed text-site-mist">{s.topics.replaceAll(" · ", ", ")}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Point({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xl font-bold" style={{ fontStretch: "112%" }}>{title}</p>
      <p className="mt-2 max-w-[30rem] text-lg leading-relaxed text-site-mist">{children}</p>
    </div>
  );
}

/* ---------------------------------------------------------------- close + footer */

function Close() {
  return (
    <section aria-labelledby="close-title" className="mx-auto max-w-[1240px] px-6 pb-28 pt-8 md:px-10 lg:pb-40">
      <div className="brackets mx-auto max-w-[880px] px-6 py-16 text-center sm:px-12" style={{ "--arm": "64px", "--stroke": "10px", "--inset": "0px" } as React.CSSProperties}>
        <h2 id="close-title" className="display mx-auto max-w-[12ch] text-[38px] lg:text-[64px]">Run it before it runs you.</h2>
        <p className="mx-auto mt-6 max-w-[34rem] text-lg leading-relaxed text-site-mist">
          Monday is ready now. Tell us about your clients and we'll set you up with partner access.
        </p>
        <a href={CONTACT} className="mt-10 inline-block rounded-md bg-site-violet px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-site-violet-hi">
          Email hello@dryruncyber.com
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-site-rule">
      <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-4 px-6 py-8 text-sm text-site-dim sm:flex-row sm:flex-wrap sm:items-center sm:justify-between md:px-10">
        <img src="/brand/dry-run-cyber-icon-white.svg" alt="" className="h-6 w-6 opacity-60" />
        <span>© {new Date().getFullYear()} Dry Run Cyber</span>
        <a href="mailto:hello@dryruncyber.com" className="hover:text-site-paper">hello@dryruncyber.com</a>
        <span className="flex gap-6">
          <a href="/coverage" className="hover:text-site-paper">Control coverage</a>
          <a href="/play" className="hover:text-site-paper">Partner login</a>
        </span>
      </div>
    </footer>
  );
}
