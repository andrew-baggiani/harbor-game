import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteNav, SkipLink } from "@/site/SiteChrome";
import { LeadForm } from "@/site/LeadForm";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing · Dry Run Cyber" },
      {
        name: "description",
        content:
          "Security awareness training your team plays. $1.99 per learner per month, billed yearly, no 3-year term. Founding pricing for the waitlist, a free 14-day team trial, and an MSP partner program.",
      },
      { name: "theme-color", content: "#101319" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico", sizes: "any" }],
  }),
  component: Pricing,
});

const PLANS = [
  {
    name: "Teams",
    who: "For owners, HR and IT training their own company",
    price: "$1.99",
    unit: "per learner, per month, billed yearly",
    note: "Waitlist founding price: $1.49, locked for 2 years",
    points: [
      "Every shift, plus a new one each month",
      "Training record per person, mapped to NIST, CIS, HIPAA and CMMC",
      "Reminders, due dates and progress for admins",
      "No 3-year term. Minimum 5 learners",
    ],
    cta: { label: "Join the waitlist", href: "#waitlist" },
  },
  {
    name: "MSP partners",
    who: "For MSPs training their clients",
    price: "$1.25",
    unit: "per active learner, per month, billed monthly to you",
    note: "25 free seats for your own team (NFR)",
    points: [
      "One portal for every client, with completion at a glance",
      "Only active learners count, never ex-employees",
      "You set your clients' price",
      "Records ready for insurers and audits",
    ],
    cta: { label: "Apply to partner", href: "/partners" },
  },
  {
    name: "500+ learners",
    who: "For larger companies and anyone paying by invoice",
    price: "Let's talk",
    unit: "volume pricing, invoice or purchase order",
    note: null,
    points: ["Everything in Teams", "Invoice, PO and annual terms that fit your process", "A walkthrough for your security and HR leads"],
    cta: { label: "Book a demo", href: "#demo" },
  },
] as const;

const FAQ = [
  [
    "Why yearly?",
    "Security awareness is a year-round program, and insurers and auditors ask for a full year of training. Shifts release monthly, so there's always something new, and the record covers the whole year.",
  ],
  ["Is there a free trial?", "Yes: 14 days for up to 10 people on your team, with the full admin portal and records. Join the waitlist and ask for one."],
  ["Can I add people mid-year?", "Yes. New learners are prorated to your renewal date."],
  [
    "We work with an MSP. Can we buy through them?",
    "Yes, and that's often easiest. Ask your MSP about Dry Run Cyber, or tell us who they are and we'll reach out.",
  ],
  [
    "Can I buy it just for myself?",
    "Not yet. Dry Run Cyber is built for teams, with records for an employer. Join the waitlist and we'll tell you if that changes.",
  ],
] as const;

function Pricing() {
  return (
    <div className="site min-h-dvh overflow-x-clip">
      <SkipLink />
      <SiteNav />
      <main id="main">
        <section className="mx-auto max-w-[1240px] px-6 pb-10 pt-14 sm:pt-20 md:px-10">
          <h1 className="display max-w-[16ch] text-[44px] leading-[1.02] lg:text-[64px]">Priced to be the easy yes.</h1>
          <p className="mt-6 max-w-[38rem] text-lg leading-relaxed text-site-mist">
            Training your team actually finishes, for less than most of what they skip today. Per learner, billed yearly, with no 3-year lock-in.
          </p>
        </section>

        <section aria-label="Plans" className="mx-auto max-w-[1240px] px-6 md:px-10">
          <div className="grid gap-5 lg:grid-cols-3">
            {PLANS.map((p, i) => (
              <div
                key={p.name}
                className={`flex flex-col rounded-3xl border p-7 ${i === 0 ? "border-site-violet/60 bg-site-violet/[0.06]" : "border-site-rule bg-white/[0.02]"}`}
              >
                <h2 className="text-xl font-semibold">{p.name}</h2>
                <p className="mt-1 text-[15px] text-site-dim">{p.who}</p>
                <p className="mt-6">
                  <span className="display text-[44px] leading-none">{p.price}</span>
                </p>
                <p className="mt-2 text-[15px] text-site-mist">{p.unit}</p>
                {p.note ? <p className="mt-3 text-[15px] font-semibold text-[#c4a574]">{p.note}</p> : null}
                <ul className="mt-6 flex-1 space-y-2.5 text-[15.5px] leading-relaxed text-site-mist">
                  {p.points.map((t) => (
                    <li key={t} className="flex gap-2.5">
                      <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-site-violet" />
                      {t}
                    </li>
                  ))}
                </ul>
                <a
                  href={p.cta.href}
                  className={`mt-8 inline-flex justify-center rounded-xl px-5 py-3 font-semibold transition ${
                    i === 0 ? "bg-site-violet text-site-paper hover:bg-site-violet-hi" : "border border-site-rule hover:border-white/40"
                  }`}
                >
                  {p.cta.label}
                </a>
              </div>
            ))}
          </div>
        </section>

        <section id="waitlist" aria-labelledby="waitlist-title" className="mx-auto mt-20 max-w-[1240px] scroll-mt-24 px-6 md:px-10">
          <div className="grid gap-10 border-t border-site-rule pt-14 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 id="waitlist-title" className="display text-[34px] lg:text-[44px]">
                Join the waitlist.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-site-mist">
                Lock in the founding price of $1.49 per learner for two years, and ask for a free 14-day trial for your team before launch.
              </p>
            </div>
            <LeadForm kind="waitlist" roles={["Business owner", "HR or people ops", "IT or security", "Other"]} />
          </div>
        </section>

        <section id="demo" aria-labelledby="demo-title" className="mx-auto mt-20 max-w-[1240px] scroll-mt-24 px-6 md:px-10">
          <div className="grid gap-10 border-t border-site-rule pt-14 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 id="demo-title" className="display text-[34px] lg:text-[44px]">
                See it first.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-site-mist">
                Twenty minutes: we play a shift together, then walk through the admin portal and a real training record.
              </p>
            </div>
            <LeadForm kind="demo" roles={["Business owner", "HR or people ops", "IT or security", "MSP", "Other"]} />
          </div>
        </section>

        <section aria-labelledby="faq-title" className="mx-auto mt-20 max-w-[1240px] px-6 pb-24 md:px-10">
          <div className="border-t border-site-rule pt-14">
            <h2 id="faq-title" className="display text-[34px] lg:text-[44px]">
              Questions buyers ask.
            </h2>
            <dl className="mt-8 grid gap-x-12 gap-y-8 lg:grid-cols-2">
              {FAQ.map(([q, a]) => (
                <div key={q}>
                  <dt className="text-lg font-semibold">{q}</dt>
                  <dd className="mt-2 max-w-[36rem] text-[16px] leading-relaxed text-site-mist">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
