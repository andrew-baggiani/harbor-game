import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteNav, SkipLink } from "@/site/SiteChrome";
import { FitType } from "@/site/FitType";
import { LeadForm } from "@/site/LeadForm";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "MSP partner program · Dry Run Cyber" },
      {
        name: "description",
        content:
          "Resell security awareness training your clients actually finish. $1.25 per active learner per month, billed monthly, 25 free internal seats, one portal for every client.",
      },
      { name: "theme-color", content: "#101319" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico", sizes: "any" }],
  }),
  component: Partners,
});

const TERMS = [
  ["$1.25", "per active learner, per month", "Billed monthly to you. Ex-employees and unused seats are never billed. Set your own client price."],
  ["25 seats", "free for your own team (NFR)", "Train your staff and demo it live to prospects, for as long as you're a partner."],
  ["1 portal", "for every client you manage", "Invite people, set due dates, send reminders and export records per client, from one place."],
] as const;

const STEPS = [
  "Apply below. We review every MSP by hand, usually within two business days.",
  "Once approved, you get a sign-in link to your partner portal and your 25-seat NFR workspace.",
  "Play it with your team, then add your first client. You're billed only for active learners.",
] as const;

function Partners() {
  return (
    <div className="site min-h-dvh overflow-x-clip">
      <SkipLink />
      <SiteNav />
      <main id="main">
        <section className="mx-auto max-w-[1240px] px-6 pb-12 pt-14 sm:pt-20 md:px-10">
          <div className="max-w-[720px]">
            <FitType
              as="h1"
              id="partners-title"
              label="Training your clients finish. Margin you keep."
              lines={[
                ["Training your", 10.1903],
                ["clients finish.", 10.377],
                ["Margin you", 8.2573],
                ["keep.", 3.697],
              ]}
            />
          </div>
          <p className="mt-6 max-w-[40rem] text-lg leading-relaxed text-site-mist">
            Dry Run Cyber is security awareness training played as a first-person night shift. Your clients make real calls under pressure, wrong answers play
            out in the room, and you get the record insurers and auditors ask for.
          </p>
        </section>

        <section aria-label="Partner terms" className="mx-auto max-w-[1240px] px-6 md:px-10">
          <dl className="grid gap-10 border-t border-site-rule pt-12 lg:grid-cols-3">
            {TERMS.map(([big, small, body]) => (
              <div key={big}>
                <dt>
                  <span className="display block text-[48px] leading-none">{big}</span>
                  <span className="mt-2 block text-[15px] text-site-dim">{small}</span>
                </dt>
                <dd className="mt-4 text-[16px] leading-relaxed text-site-mist">{body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="how-title" className="mx-auto mt-20 max-w-[1240px] px-6 md:px-10">
          <div className="border-t border-site-rule pt-12">
            <h2 id="how-title" className="display section-head text-[34px] sm:text-[44px] lg:text-[52px]">
              How it works.
            </h2>
            <ol className="mt-8 grid gap-8 lg:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s} className="text-[16px] leading-relaxed text-site-mist">
                  <span className="display block text-[28px] text-site-paper">{i + 1}</span>
                  <span className="mt-2 block">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="apply" aria-labelledby="apply-title" className="mx-auto mt-20 max-w-[1240px] scroll-mt-24 px-6 pb-24 md:px-10">
          <div className="grid gap-10 border-t border-site-rule pt-14 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 id="apply-title" className="display section-head text-[34px] sm:text-[44px] lg:text-[52px]">
                Apply to partner.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-site-mist">
                Takes two minutes. No commitment, and nothing to pay until your first client learner is active.
              </p>
            </div>
            <LeadForm kind="partner" roles={["Owner or founder", "Sales or account management", "Technical lead", "Other"]} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
