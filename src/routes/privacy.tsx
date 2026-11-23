import { createFileRoute } from "@tanstack/react-router";
import { Block, Grid, LegalPage, mail } from "@/site/Legal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · Dry Run Cyber" },
      { name: "description", content: "What Dry Run Cyber collects about the people who use it, who processes it, who can see it, and how long we keep it." },
      { name: "theme-color", content: "#101319" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico", sizes: "any" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="November 23, 2026"
      lead="We keep the least we need to run training and prove it happened. Only your organization, and the MSP partner that manages it, can see your training record. We don't sell personal information or use it for advertising."
    >
      <p className="mt-6 text-[17px] leading-relaxed text-site-mist">
        This policy covers dryruncyber.com, the game and the portal, run by Dry Run Cyber LLC ("we").
      </p>

      <Block title="What we collect">
        <Grid
          head={["What", "From whom", "Why"]}
          rows={[
            ["Work email and organization", "Learners and admins", "To sign you in and put you in the right organization"],
            ["Display name (optional)", "Learners who choose one", "Shown on the leaderboard if your organization turns it on"],
            [
              "Training decisions: scenario, choice, right or wrong, points, time, mapped controls",
              "Learners",
              "The training record your organization and auditors rely on",
            ],
            ["Sign-in links and sessions, stored as one-way hashes", "Everyone who signs in", "To keep you signed in securely"],
            ["Partner brand name and logo", "MSP partners", "Shown to that partner's clients"],
            [
              "Billing name, address, tax ID and payment details",
              "Admins who buy a plan",
              "To bill you and calculate sales tax. Card details go straight to Stripe; we never see or store them.",
            ],
            ["Name, email, company, role, seat count, message", "Website visitors who ask for a demo or join the waitlist", "To reply and follow up"],
            ["A one-way hash of your IP address", "Website form senders", "To limit spam; we can't turn it back into your IP"],
            ["Questions typed into the site's question box", "Website visitors", "Sent to an AI model to write a reply; not saved"],
          ]}
        />
        <p>
          We don't collect passwords, keystrokes, screen recordings, or anything typed outside the game's choices. The only cookie keeps you signed in; there are
          no advertising or cross-site tracking cookies.
        </p>
        <p>The game never asks for patient, customer or payment data. Please don't enter it.</p>
      </Block>

      <Block title="Who processes it for us">
        <Grid
          head={["Provider", "What it does", "Location"]}
          rows={[
            ["Cloudflare", "Hosting, database, and the AI model behind the question box", "United States"],
            ["Resend", "Sends sign-in, invite and reminder emails", "United States"],
            ["Stripe", "Payments, subscriptions, invoices and sales tax for paying customers", "United States"],
          ]}
        />
        <p>We'll update this list before adding a provider that handles personal information.</p>
      </Block>

      <Block title="Who can see it">
        <ul>
          <li>
            <b>Your organization's admins</b> see names, emails, progress and decisions.
          </li>
          <li>
            <b>Your MSP partner</b>, if one manages your account, sees the same.
          </li>
          <li>
            <b>Teammates</b> see the leaderboard only if your organization turns it on, and only display names or "Teammate N."
          </li>
          <li>
            <b>We</b> look at records only to support you, keep the Service running, or when the law requires.
          </li>
        </ul>
        <p>We may share information if required by law, to protect people's safety, or as part of a merger or sale of the business, under this policy's protections.</p>
      </Block>

      <Block title="How long we keep it">
        <p>
          Training records are kept while your organization uses Dry Run Cyber, because they're the evidence auditors ask for. When an organization leaves, it has
          60 days to export its records, and then we delete them. Website leads are kept for up to 2 years unless you ask us to delete them sooner.
        </p>
      </Block>

      <Block title="Your choices and rights">
        <p>
          You can ask us to see, correct, export or delete your personal information, wherever you live. If your organization manages your account, we may pass
          your request to your organization, since it controls your training record. We won't treat you differently for asking.
        </p>
        <p>Email {mail}. We'll reply within 30 days.</p>
      </Block>

      <Block title="Security">
        <p>
          Data is encrypted in transit and at rest. Sign-in tokens are stored only as hashes. Admin access is limited to the people who need it. No system is
          perfectly secure; if a breach affects your information, we'll tell you and your organization without undue delay.
        </p>
      </Block>

      <Block title="Children">
        <p>Dry Run Cyber is for workplaces. It isn't meant for anyone under 16, and we don't knowingly collect their information.</p>
      </Block>

      <Block title="Changes">
        <p>We'll post updates here with a new date, and email admins before material changes take effect.</p>
      </Block>

      <Block title="Contact">
        <p>Dry Run Cyber LLC, 3464 Pericles Ave, North Port, FL 34286, {mail}.</p>
      </Block>
    </LegalPage>
  );
}
