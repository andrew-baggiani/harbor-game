import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteFooter, SiteNav, SkipLink } from "@/site/SiteChrome";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy · Dry Run Cyber" },
      { name: "description", content: "What Dry Run Cyber stores about the people who play it, where it lives, and who can see it." },
      { name: "theme-color", content: "#101319" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico", sizes: "any" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="site min-h-dvh overflow-x-clip">
      <SkipLink />
      <SiteNav />
      <main id="main" className="mx-auto max-w-[760px] px-6 pb-28 pt-10 md:px-10 lg:pt-16">
        <h1 className="display text-[40px] sm:text-[56px]">Privacy</h1>
        <p className="mt-5 text-lg leading-relaxed text-site-mist">
          The short version: we keep the least we need to run training and prove it happened, and only your organization and the MSP that manages it can see
          it.
        </p>
        <p className="mt-3 text-sm text-site-dim">Last updated November 17, 2026</p>

        <Block title="What we store">
          <ul>
            <li>Each person's work email address, and the organization they belong to.</li>
            <li>An optional display name, if they choose one for the leaderboard.</li>
            <li>
              Each decision made in the game: which scenario, which choice, whether it was right, the points, the time, and the controls it maps to. This is the
              training record.
            </li>
            <li>Sign-in records: one-time links and sessions, kept in hashed form, never the raw token.</li>
          </ul>
        </Block>

        <Block title="What we don't store">
          <ul>
            <li>Passwords. Sign-in is a one-time link sent to your work email.</li>
            <li>Recordings, keystrokes, or anything typed outside the game's choices.</li>
            <li>Advertising or cross-site tracking cookies. The only cookie is the one that keeps you signed in.</li>
            <li>Patient, customer or financial data. The game never asks for it, so please don't enter it anywhere.</li>
          </ul>
        </Block>

        <Block title="Where it lives">
          <p>
            Records are stored in a Cloudflare D1 database in eastern North America, and the site runs on Cloudflare's network. Sign-in emails are sent through
            an email delivery provider. The question box on the home page sends your message to an AI model running on Cloudflare to write a reply; we don't
            save those conversations.
          </p>
        </Block>

        <Block title="Who can see it">
          <ul>
            <li>Admins of your organization, and the MSP partner that manages it, see names, emails, progress and decisions.</li>
            <li>Teammates see the leaderboard only if your organization turns it on, and only display names or "Teammate N".</li>
            <li>We look at records only to support you or keep the service running.</li>
          </ul>
        </Block>

        <Block title="How long we keep it">
          <p>
            Training records are kept while your organization uses Dry Run Cyber, because they're the evidence auditors ask for. Ask us and we'll export or
            delete an organization's records, or one person's.
          </p>
        </Block>

        <Block title="Questions">
          <p>
            Email{" "}
            <a href="mailto:hello@dryruncyber.com" className="text-site-paper underline decoration-white/25 underline-offset-4">
              hello@dryruncyber.com
            </a>
            .
          </p>
        </Block>
      </main>
      <SiteFooter />
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold" style={{ fontStretch: "112%" }}>
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-[17px] leading-relaxed text-site-mist [&_li]:relative [&_li]:pl-5 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.7em] [&_li]:before:h-1.5 [&_li]:before:w-1.5 [&_li]:before:rounded-full [&_li]:before:bg-site-violet-hi [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}
