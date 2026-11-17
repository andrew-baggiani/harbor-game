import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Arrow, Pill, btn } from "@/portal/ui";
import { ChatWidget } from "@/site/ChatWidget";
import { SiteFooter, SiteNav, SkipLink } from "@/site/SiteChrome";
import { Callout, Chapter, Checklist, Cite, H3, No, Path, SourceList, SourcesProvider, Step, Steps, Table, Tabs, Yes, useChecks } from "@/site/guide/ui";
import { SOURCES } from "@/site/guide/sources";

const TITLE = "Securing AI for your clients: the MSP field guide";
const DESC =
  "An in-depth, vendor-neutral guide for IT providers: AI usage policy, admin controls in Copilot, ChatGPT, Claude, Gemini and Grok, DLP and shadow-AI tooling, agents, and training. Free policy builder included.";

export const Route = createFileRoute("/ai-security/")({
  head: () => ({
    meta: [
      { title: `${TITLE} · Dry Run Cyber` },
      { name: "description", content: DESC },
      { name: "theme-color", content: "#101319" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://dryruncyber.com/ai-security" },
      { property: "og:image", content: "https://dryruncyber.com/og-ai-security.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "canonical", href: "https://dryruncyber.com/ai-security" },
    ],
  }),
  component: Guide,
});

const CHAPTERS = [
  ["why-now", "Why this is your problem now"],
  ["model", "The six layers"],
  ["your-house", "Start with your own house"],
  ["policy", "Write the AI usage policy"],
  ["access", "Get admin access the right way"],
  ["platforms", "Platform playbooks"],
  ["data", "Data controls: DLP and oversharing"],
  ["shadow-ai", "Shadow AI and the browser"],
  ["agents", "Agents, connectors and MCP"],
  ["people", "Train the people"],
  ["rollout", "A 30/60/90 plan for each client"],
] as const;

function Guide() {
  const active = useActiveChapter();
  const { checks } = useChecks();
  const done = Object.values(checks).filter(Boolean).length;
  return (
    <div className="site min-h-dvh overflow-x-clip">
      <SkipLink />
      <SiteNav />
      <SourcesProvider sources={SOURCES}>
        <header className="hero-glow relative">
          <div className="relative mx-auto max-w-[1240px] px-6 pb-14 pt-10 md:px-10 lg:pb-20 lg:pt-16">
            <div className="flex flex-wrap gap-2">
              <Pill tone="mint">Free guide</Pill>
              <Pill tone="dim">Updated November 17, 2026</Pill>
              <Pill tone="dim">About 35 minutes</Pill>
            </div>
            <h1 className="display mt-6 max-w-[17ch] text-[clamp(2.6rem,6vw,4.8rem)]">{TITLE}</h1>
            <p className="mt-6 max-w-[44rem] text-xl leading-relaxed text-site-mist">
              How an IT provider secures AI for small and mid-size clients, start to finish: your own house first, then the policy, the admin consoles
              in Copilot, ChatGPT, Claude, Gemini and Grok, the data controls, shadow AI, agents and the people. Click paths included. Vendor-neutral.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/ai-security/policy-builder" className={`${btn.primary} !px-6 !py-3.5 text-base`}>
                Build your AI policy free <Arrow size={17} />
              </a>
              <a href="#why-now" className={`${btn.ghost} !px-6 !py-3.5 text-base`}>
                Start reading
              </a>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1240px] gap-12 px-6 pb-28 md:px-10 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="Chapters" className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-sm font-semibold text-site-dim">In this guide</p>
              <ol className="mt-3 space-y-0.5 border-l border-white/[0.08]">
                {CHAPTERS.map(([id, label], i) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      aria-current={active === id ? "true" : undefined}
                      className="toc-link relative -ml-px flex gap-2.5 border-l border-transparent py-1.5 pl-4 text-[14.5px] text-site-mist transition before:absolute before:-left-px before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded hover:text-site-paper"
                    >
                      <span className="num w-4 text-site-dim">{i + 1}</span>
                      {label}
                    </a>
                  </li>
                ))}
              </ol>
              <div className="panel mt-8 !p-4">
                <p className="text-sm font-semibold">Your checklist</p>
                <p className="mt-1 text-sm text-site-dim">{done ? `${done} items done in this browser.` : "Tick items as you go. They stay in this browser."}</p>
                <a href="/ai-security/policy-builder" className={`${btn.primary} mt-4 w-full !py-2 text-sm`}>
                  Policy builder
                </a>
              </div>
            </div>
          </nav>

          <main id="main" className="min-w-0 max-w-[760px] space-y-16">
            <WhyNow />
            <Model />
            <YourHouse />
            <PolicyChapter />
            <Access />
            <Platforms />
            <DataControls />
            <ShadowAi />
            <Agents />
            <People />
            <Rollout />
            <section aria-labelledby="sources-h" className="border-t border-white/[0.06] pt-14">
              <h2 id="sources-h" className="text-2xl font-bold">
                Sources
              </h2>
              <p className="mt-3 text-site-mist">
                Checked November 17, 2026. Admin consoles change monthly; when a click path has moved, the source page is the tiebreaker. We aren't affiliated
                with any vendor named here.
              </p>
              <div className="mt-6">
                <SourceList />
              </div>
            </section>
          </main>
        </div>
      </SourcesProvider>
      <SiteFooter />
      <ChatWidget />
    </div>
  );
}

function useActiveChapter() {
  const [active, setActive] = useState<string>(CHAPTERS[0][0]);
  useEffect(() => {
    const els = CHAPTERS.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}

/* =================================================================== 1 */

function WhyNow() {
  return (
    <Chapter
      id="why-now"
      n={1}
      title="Why this is your problem now"
      lede="Your clients already use AI. The question is whether it runs through accounts you manage, or through personal logins that nobody can see, audit or switch off."
    >
      <p>
        Every MSP has had some version of the same ticket: <em>“Can we turn on Copilot?”</em> or <em>“Is it OK if I use ChatGPT for this?”</em> Behind it
        is a messier reality. Staff paste client emails, contracts, spreadsheets and patient notes into whichever assistant is open in the next tab, often
        on a free personal account tied to a work email address. That data leaves the tenant you're paid to protect, and you have no log of it.
      </p>
      <p>Three things have changed in 2026 that make this an MSP problem rather than a client preference:</p>
      <ul>
        <li>
          <strong>The AI is inside the tools you already manage.</strong> Copilot reads whatever a user can reach in Microsoft 365, and Gemini does the same
          in Workspace. Years of loose SharePoint and Drive sharing used to be invisible; now an assistant can surface it in one prompt.
        </li>
        <li>
          <strong>Agents act, not just answer.</strong> Assistants now connect to mailboxes, drives, CRMs and third-party tools, and can take actions. Each
          connector is a new path for data and a new set of credentials.
        </li>
        <li>
          <strong>Regulators and insurers have started asking.</strong> In the EU, the AI Act's staff AI-literacy duty has applied since February 2025, and
          supervision and enforcement started on August 2, 2026.
          <Cite ids="eu-art4" /> There's no standalone fine, but missing training is treated as an aggravating factor when something else goes wrong.
          <Cite ids="eu-fine" /> US healthcare clients face a simpler test: if patient data goes into an AI tool without a business associate agreement,
          that's a HIPAA problem regardless of how careful the user was.
        </li>
      </ul>
      <Callout tone="note" title="The opportunity">
        <p>
          Most of your clients will never configure this themselves. An MSP that shows up with a policy, a configured tenant and a training plan is
          solving the problem they're worried about but can't name. That's a project, a recurring service and a reason to talk to the owner this quarter.
        </p>
      </Callout>
    </Chapter>
  );
}

/* =================================================================== 2 */

const LAYERS = [
  ["Policy", "What's allowed, with which data, in which tools, and who decides.", "Chapter 4"],
  ["Identity and accounts", "Work AI runs on managed work accounts with SSO, never on personal logins.", "Chapters 5–6"],
  ["App admin controls", "Each platform's own console: retention, connectors, web access, sharing, audit.", "Chapter 6"],
  ["Data controls", "Fix oversharing before the assistant finds it; DLP on prompts and uploads.", "Chapter 7"],
  ["Visibility and enforcement", "See and steer AI use in the browser and on the endpoint, including tools you didn't approve.", "Chapters 8–9"],
  ["People", "Training that changes what someone does when the prompt box is open.", "Chapter 10"],
];

function Model() {
  return (
    <Chapter
      id="model"
      n={2}
      title="The six layers"
      lede="No single product secures AI use. You stack six layers, and most SMB tenants today have one or two of them."
    >
      <ol className="my-8 space-y-2.5">
        {LAYERS.map(([name, what, where], i) => (
          <li key={name} className="panel flex items-start gap-4 !p-4 sm:!p-5" style={{ marginLeft: `${Math.min(i, 5) * 10}px` }}>
            <span className="num grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-site-violet/15 text-[15px] font-bold text-site-violet-hi">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-bold">{name}</span>
              <span className="mt-0.5 block text-[15.5px] leading-relaxed text-site-mist">{what}</span>
            </span>
            <span className="hidden shrink-0 text-sm text-site-dim sm:block">{where}</span>
          </li>
        ))}
      </ol>
      <p>
        The order matters. A DLP rule doesn't help if staff use a personal account the rule never sees. Admin controls don't help if nobody agreed what
        the business allows. Training doesn't stick if the approved tool is worse than the free one. Work top to bottom, and expect to go round more than
        once: the platforms change their consoles every month.
      </p>
    </Chapter>
  );
}

/* =================================================================== 3 */

function YourHouse() {
  return (
    <Chapter
      id="your-house"
      n={3}
      title="Start with your own house"
      lede="Before you advise a client, make sure your own technicians aren't the leak. An MSP holds the keys to dozens of tenants; that makes your AI use the highest-risk use in the room."
    >
      <p>Think about what your team pastes into an assistant on a normal day:</p>
      <ul>
        <li>Error logs and scripts containing tenant IDs, hostnames, internal IPs or API keys.</li>
        <li>Ticket text with client staff names, email threads and screenshots.</li>
        <li>Firewall configs, backup reports and audit exports “just to summarize”.</li>
        <li>Proposals and QBR decks with client pricing and contract terms.</li>
      </ul>
      <p>
        If that happens on personal accounts, every one of your clients has an exposure they never agreed to. Fix it at home first, then use the same
        playbook with clients. It also makes the sales conversation honest: “here's exactly what we did for ourselves.”
      </p>
      <H3>Least privilege for AI administration</H3>
      <p>
        Don't manage AI settings from a Global Administrator account. In Microsoft Entra there is an <strong>AI Administrator</strong> role for managing
        Copilot settings and approving agents, and Microsoft's own guidance is that AI Administrator, Agent ID Administrator and Security Administrator
        together cover AI management without Global Administrator.
        <Cite ids="ms-ai-role" /> Oversharing work that changes what Copilot can ground on needs SharePoint Administrator.
        <Cite ids="ms-ai-role" />
      </p>
      <Checklist
        title="Your own house"
        items={[
          { id: "h-policy", text: "Adopt an AI usage policy for your own staff (use the builder; pick “for my MSP”)." },
          { id: "h-accounts", text: "Move technicians onto one managed AI workspace with SSO; ban personal accounts for client work." },
          { id: "h-redact", text: "Write a redaction rule for tickets and logs: no tenant IDs, keys, client names or IPs in prompts." },
          { id: "h-tools", text: "List the AI features inside your own PSA, RMM and documentation tools, and what data each sends out." },
          { id: "h-roles", text: "Use AI Administrator (not Global Administrator) through GDAP for client AI work." },
        ]}
      />
    </Chapter>
  );
}

/* =================================================================== 4 */

function PolicyChapter() {
  return (
    <Chapter
      id="policy"
      n={4}
      title="Write the AI usage policy"
      lede="The policy is the contract between the business and its staff. Short, specific and enforceable beats long and aspirational."
    >
      <p>A good SMB AI policy fits on three pages and answers seven questions:</p>
      <Table
        head={["Question", "What a good answer looks like"]}
        rows={[
          ["Which tools are approved?", "Named products and plans (for example “ChatGPT Business, company workspace only”), with an owner who approves new ones."],
          ["Which accounts?", "Company-managed accounts signed in with work SSO. Personal accounts are never used for company data."],
          ["Which data can go in?", "A short data-class table: public, internal, confidential, regulated, and which tool tier each may enter."],
          ["What's never allowed?", "Regulated data in unapproved tools, credentials and secrets, other people's personal data without a reason, and decisions made by AI alone about people."],
          ["Agents and connectors?", "Nobody connects an assistant to mail, files or business systems without IT approval and a named owner."],
          ["Human review?", "AI output is checked by a person before it reaches a customer, a regulator or a contract."],
          ["What if something goes wrong?", "Who to tell, how fast, and that reporting a mistake is never punished."],
        ]}
      />
      <Callout tone="do" title="Free tool">
        <p>
          The <a href="/ai-security/policy-builder">AI usage policy builder</a> walks you through these choices for a client (or for your MSP), adds
          HIPAA, CMMC and financial-data clauses when you pick the industry, and downloads a Word document you can brand and send. No sign-up.
        </p>
      </Callout>
      <H3>Make it real</H3>
      <ul>
        <li>
          <strong>Approve before you ban.</strong> Banning AI without giving people a sanctioned tool sends them to their phones. Pick one approved
          assistant per client and make it good.
        </li>
        <li>
          <strong>Tie it to the data, not the brand.</strong> “Patient data only in tools with a signed BAA” survives the next product launch; “don't use
          ChatGPT” doesn't.
        </li>
        <li>
          <strong>Get an acknowledgment.</strong> Each employee signs it, the date is recorded, and it's re-signed yearly. That record is your evidence.
        </li>
        <li>
          <strong>Review quarterly.</strong> The platforms change faster than any other policy you maintain.
        </li>
      </ul>
    </Chapter>
  );
}

/* =================================================================== 5 */

function Access() {
  return (
    <Chapter
      id="access"
      n={5}
      title="Get admin access the right way"
      lede="The client should own the AI workspace and the billing relationship. You get a named, least-privilege admin seat, written into your agreement."
    >
      <p>
        AI platforms other than Microsoft have no partner-delegation model like GDAP. That changes how you ask for access. The principle is the same
        everywhere:
      </p>
      <ul>
        <li>
          <strong>The client is the owner.</strong> The primary owner or billing owner is a client executive, on a client email domain. If you leave, the
          workspace stays with them.
        </li>
        <li>
          <strong>You get a named admin account,</strong> on the client's domain or invited by email, never a shared login. MFA is enforced through the
          client's identity provider when the plan supports SSO.
        </li>
        <li>
          <strong>It's in writing.</strong> Your MSA or SOW says which AI platforms you administer, what you're allowed to change, and that you'll hand
          back access on exit.
        </li>
      </ul>
      <Table
        head={["Platform", "How you get in", "Ask for"]}
        rows={[
          [
            "Microsoft 365",
            <>
              GDAP relationship from Partner Center; the client approves it. Relationships run from 1 to 730 days.
              <Cite ids="gdap-basics" />
            </>,
            <>
              AI Administrator for Copilot settings and agents; SharePoint Administrator for oversharing; Purview roles for DLP. Use Microsoft's
              least-privileged-role-by-task list.
              <Cite ids="ms-ai-role,ms-gdap-tasks" />
            </>,
          ],
          [
            "Google Workspace",
            "The client's super admin creates an admin account for you, or grants a custom admin role.",
            <>
              A custom role with the Gemini Settings administrator privilege, which is what the Gemini settings in the Admin console require.
              <Cite ids="gem-studio" />
            </>,
          ],
          [
            "ChatGPT Business / Enterprise",
            "The workspace owner invites your account and assigns a role.",
            <>
              Admin (not Owner). Enterprise adds a global admin console and SCIM.
              <Cite ids="oai-tiers" />
            </>,
          ],
          [
            "Claude Team / Enterprise",
            <>
              The owner adds you in the admin console at <code>claude.ai/admin-settings</code>.<Cite ids="claude-rollout" />
            </>,
            <>
              Admin, or a custom role scoped to Identity &amp; Access on Enterprise.<Cite ids="claude-admin" />
            </>,
          ],
          [
            "Grok Business / Enterprise",
            <>
              The organization admin invites you in the xAI console at <code>console.x.ai</code>.<Cite ids="grok-harden" />
            </>,
            "Team admin. Enterprise controls (SSO, SCIM, retention) go through xAI sales.",
          ],
        ]}
      />
      <Callout tone="gotcha">
        <p>
          On ChatGPT, verifying the client's domain doesn't automatically pull staff out of their personal accounts. Users with a matching email who
          aren't provisioned in the workspace can keep using personal ChatGPT.
          <Cite ids="oai-identity" /> Inviting them is what triggers the migration of an existing personal account, so check who already has one before
          you invite.
          <Cite ids="oai-onboard" />
        </p>
      </Callout>
    </Chapter>
  );
}

/* =================================================================== 6 */

function Platforms() {
  return (
    <Chapter
      id="platforms"
      n={6}
      title="Platform playbooks"
      lede="What each plan actually gives an admin, what to switch on first, and where it hides. Pick the platform your client uses."
    >
      <p>
        One rule applies to every vendor: <strong>the consumer and entry tiers aren't the business product.</strong> Data-handling terms, admin
        controls, audit logs and BAAs live on the business and enterprise plans. Your first job is getting the client onto the right tier.
      </p>
      <Table
        head={["", "SSO", "SCIM", "Audit / compliance API", "Custom retention", "BAA available"]}
        caption="Business-tier rows are the cheapest plan with real admin controls. Check current pricing and terms with each vendor."
        rows={[
          ["Microsoft 365 Copilot", <>Entra ID</>, <>Entra ID</>, <>Purview audit</>, <>Purview retention</>, <>Yes, under Microsoft's DPA<Cite ids="baa-roundup" /></>],
          ["ChatGPT Business", <Yes key="a" />, <No key="b" />, <No key="c" />, <No key="d" />, <>No<Cite ids="baa-roundup" /></>],
          ["ChatGPT Enterprise", <Yes key="a" />, <Yes key="b" />, <>Compliance API</>, <>Yes (90-day minimum)<Cite ids="oai-tiers" /></>, <>Sales-managed only<Cite ids="baa-roundup" /></>],
          ["Claude Team", <Yes key="a" />, <No key="b" />, <No key="c" />, <No key="d" />, <No key="e" />],
          ["Claude Enterprise", <Yes key="a" />, <Yes key="b" />, <>Audit logs + Compliance API</>, <>Yes</>, <>Yes, once enabled<Cite ids="claude-baa" /></>],
          ["Gemini in Workspace", <>Workspace sign-in</>, <>Workspace directory</>, <>Workspace audit</>, <>3, 18 or 36 months, or off<Cite ids="gem-app" /></>, <>Yes, after the BAA is accepted<Cite ids="gem-baa" /></>],
          ["Grok Business", <>Enterprise only</>, <>Enterprise only</>, <>Enterprise</>, <>Enterprise, via sales<Cite ids="grok-harden" /></>, <>Not stated for chat</>],
        ]}
      />
      <Tabs
        tabs={[
          { id: "copilot", label: "Microsoft Copilot", body: <CopilotPlaybook /> },
          { id: "chatgpt", label: "ChatGPT", body: <ChatGptPlaybook /> },
          { id: "claude", label: "Claude", body: <ClaudePlaybook /> },
          { id: "gemini", label: "Gemini", body: <GeminiPlaybook /> },
          { id: "grok", label: "Grok", body: <GrokPlaybook /> },
        ]}
      />
    </Chapter>
  );
}

function CopilotPlaybook() {
  return (
    <div className="prose-guide">
      <p>
        <strong>Naming first, because it confuses users.</strong> In August 2026 Microsoft renamed the Microsoft 365 Copilot app to the Microsoft Copilot
        app.
        <Cite ids="ms-rename" /> The license your clients buy is still Microsoft 365 Copilot (or Copilot Business for smaller tenants). What matters is
        the account people sign in with: an Entra work account gets the enterprise experience; a personal Microsoft account gets the consumer one.
      </p>
      <p>
        Copilot answers using the data each user already has permission to see.
        <Cite ids="ms-security-copilot" /> So the biggest Copilot risk isn't Copilot; it's ten years of “Everyone except external users” on SharePoint
        sites. Fix that before you assign licenses.
      </p>
      <H3>Switch these on first</H3>
      <Steps>
        <Step>
          <strong>Run the oversharing assessment.</strong> SharePoint Advanced Management comes with Microsoft 365 Copilot; one assigned Copilot license
          turns it on for admins.
          <Cite ids="sam-license" /> Start at <Path>SharePoint admin center &gt; Advanced management</Path> with the Content Management Assessment, then
          read the data access governance reports.
          <Cite ids="sam-license" />
        </Step>
        <Step>
          <strong>Lock down what it finds.</strong> Use site access reviews so site owners confirm who should have access, and restrict or exclude
          high-risk sites before Copilot indexes them.
          <Cite ids="ms-security-copilot" />
        </Step>
        <Step>
          <strong>Decide on web search.</strong> The <em>Allow web search in Copilot</em> policy lives in the Cloud Policy service for Microsoft 365 and
          also appears on the Copilot Control System settings page in the admin center. It covers both Copilot and Copilot Chat.
          <Cite ids="ms-websearch" /> If you don't configure it, web search is on by default.
          <Cite ids="ms-websearch" />
        </Step>
        <Step>
          <strong>Add Purview DLP for Copilot.</strong> DLP can stop Copilot from processing sensitive items and prompts, and can now stop sensitive
          content in a prompt from being sent to external web search while still answering from internal data.
          <Cite ids="ms-dlp-web" />
        </Step>
        <Step>
          <strong>Turn on DSPM for AI</strong> in Purview to see AI interactions that touched sensitive data, including Copilot, Copilot Studio agents and
          third-party AI sites.
          <Cite ids="ms-purview-ai" />
        </Step>
        <Step>
          <strong>Govern agents</strong> in the Agent 365 registry in the Microsoft 365 admin center. Chapter 9 covers it.
        </Step>
      </Steps>
      <Callout tone="gotcha">
        <p>
          With web search on, the short search queries Copilot sends to Bing sit outside Microsoft's DPA and BAA.
          <Cite ids="baa-roundup" /> For healthcare and legal clients, either turn web search off or pair it with the DLP-for-web-search rule.
        </p>
      </Callout>
      <Callout tone="note" title="Copilot Chat is already there">
        <p>
          Copilot Chat signed in with a work account runs under enterprise data protection even without a paid Copilot license.
          <Cite ids="ms-chat-edp" /> That's usually the best “approved tool” to point unlicensed staff at, instead of a consumer chatbot.
        </p>
      </Callout>
    </div>
  );
}

function ChatGptPlaybook() {
  return (
    <div className="prose-guide">
      <p>
        <strong>Business vs Enterprise decides almost everything.</strong> Both support SAML SSO. Only Enterprise adds SCIM provisioning, the Compliance
        API, custom data retention and cross-workspace visibility.
        <Cite ids="oai-tiers" /> Without SCIM, offboarding depends on an admin remembering to remove the user. A BAA is only available on sales-managed
        Enterprise (and Edu), not Business.
        <Cite ids="baa-roundup" />
      </p>
      <H3>Switch these on first</H3>
      <Steps>
        <Step>
          <strong>Verify the client's domain.</strong> For a standalone Business workspace, the owner does this under <Path>Identity &amp; access</Path>.
          <Cite ids="oai-domain" /> Verification is a DNS TXT record, and it's the prerequisite for SSO.
          <Cite ids="oai-domain" />
        </Step>
        <Step>
          <strong>Connect SSO</strong> to Entra ID or Okta so MFA and conditional access apply, and use SCIM on Enterprise so leavers lose access
          automatically.
          <Cite ids="oai-tiers" />
        </Step>
        <Step>
          <strong>Sort out existing personal accounts before inviting.</strong> Staff with a personal, Plus or Pro account on their work email may need to
          migrate it when they join, so invite a small test group first.
          <Cite ids="oai-onboard" />
        </Step>
        <Step>
          <strong>Review apps and connectors.</strong> Admins control which apps (formerly connectors) are enabled across the workspace. Enable only the
          ones the policy allows, and decide who can build and share custom GPTs.
        </Step>
        <Step>
          <strong>On Enterprise, wire up logging.</strong> The Compliance Logs Platform and the Compliance API feed audit, SIEM, eDiscovery and DLP tools,
          and IP allowlisting can restrict both workspace access and Compliance API access.
          <Cite ids="oai-quickstart" />
        </Step>
      </Steps>
      <Callout tone="gotcha">
        <p>
          Verifying the domain doesn't block personal ChatGPT. A user on the company domain who isn't provisioned in the workspace can still use a
          personal account.
          <Cite ids="oai-identity" /> Blocking personal use takes the browser or network layer (chapter 8).
        </p>
      </Callout>
    </div>
  );
}

function ClaudePlaybook() {
  return (
    <div className="prose-guide">
      <p>
        <strong>Team now covers the basics.</strong> SSO, domain capture, just-in-time provisioning and role-based permissions are on the Team plan. The
        dividing lines for Enterprise are SCIM, audit logs, custom retention, encryption keys and regulated-data readiness.
        <Cite ids="claude-plans" /> Neither plan trains on customer content by default.
        <Cite ids="claude-plans" />
      </p>
      <H3>Switch these on first</H3>
      <Steps>
        <Step>
          <strong>Set up SSO and domain capture</strong> in the admin console under <Path>Organization settings</Path>, so new sign-ups on the client's
          domain land in the company organization.
          <Cite ids="claude-rollout" />
        </Step>
        <Step>
          <strong>Approve connectors deliberately.</strong> Connectors must be enabled by an admin under <Path>Organization settings &gt; Connectors</Path>{" "}
          before users can attach them.
          <Cite ids="claude-rollout" /> On Enterprise, admins approve connectors org-wide and set per-tool permissions, and connectors respect the
          permissions users already have in the underlying systems.
          <Cite ids="claude-ent" />
        </Step>
        <Step>
          <strong>Use custom roles on Enterprise</strong> to gate features, models and connectors per group.
          <Cite ids="claude-admin" />
        </Step>
        <Step>
          <strong>Set retention and export the audit trail.</strong> Enterprise retention can delete chats, projects and artifacts after a set period,
          and audit logs and the Compliance API give you an export for the SIEM.
          <Cite ids="claude-admin" />
        </Step>
        <Step>
          <strong>For healthcare,</strong> the Primary Owner turns on HIPAA compliance under <Path>Data and privacy</Path> and accepts the BAA. Standard
          Enterprise has no BAA coverage until that's done.
          <Cite ids="claude-baa" />
        </Step>
      </Steps>
      <Callout tone="gotcha">
        <p>
          Custom-role permissions add up; one role can't take away what another grants. Members on the built-in User, Admin or Owner roles aren't governed
          by custom roles at all.
          <Cite ids="claude-admin" /> Put people in custom roles if you want the restrictions to apply.
        </p>
      </Callout>
    </div>
  );
}

function GeminiPlaybook() {
  return (
    <div className="prose-guide">
      <p>
        Google no longer sells Gemini as an add-on. It's included in Workspace Business and Enterprise editions, which means many clients already have
        it switched on.
        <Cite ids="gem-app" /> Like Copilot, Gemini only retrieves content the user can already access, so Drive sharing hygiene comes first.
      </p>
      <H3>Switch these on first</H3>
      <Steps>
        <Step>
          <strong>Find the settings.</strong> They live in the Admin console under <Path>Generative AI &gt; Gemini for Workspace</Path>, and you need the
          Gemini Settings administrator privilege.
          <Cite ids="gem-studio" />
        </Step>
        <Step>
          <strong>Decide per service.</strong> You can turn Gemini on or off for individual Workspace services and separately control the Gemini app at
          gemini.google.com.
          <Cite ids="gem-features" /> Even with Gemini off in one app, users can still reach that app's data from Gemini in another.
          <Cite ids="gem-features" />
        </Step>
        <Step>
          <strong>Limit Workspace Intelligence sources.</strong> You can choose which services feed Gemini's background knowledge of the organization.
          Changes can take up to 48 hours.
          <Cite ids="gem-wsi" />
        </Step>
        <Step>
          <strong>Set history retention.</strong> Admins can auto-delete Gemini app activity after 3, 18 or 36 months, or turn history off.
          <Cite ids="gem-app" />
        </Step>
        <Step>
          <strong>Use DLP with IRM</strong> to restrict what Gemini can do with sensitive files.
          <Cite ids="gem-security" />
        </Step>
      </Steps>
      <Callout tone="gotcha">
        <p>
          There's no admin control specific to the Gemini mobile app. Google's answer is to block it through device management.
          <Cite ids="gem-app" /> For healthcare clients, Gemini is covered once a super administrator accepts Google's BAA.
          <Cite ids="gem-baa" />
        </p>
      </Callout>
    </div>
  );
}

function GrokPlaybook() {
  return (
    <div className="prose-guide">
      <p>
        xAI launched Grok Business (self-serve, about $30 a seat a month) and Grok Enterprise in January 2026, and says business usage isn't used for
        model training.
        <Cite ids="grok-launch" /> You manage it in the xAI console: users, access controls and usage.
        <Cite ids="grok-news" /> Enterprise adds custom SSO, SCIM directory sync and an optional Vault with a dedicated data plane and application-level
        encryption.
        <Cite ids="grok-news" />
      </p>
      <H3>Switch these on first</H3>
      <Steps>
        <Step>
          <strong>Put the workspace on a verified company domain</strong> with a client-owned admin, in <code>console.x.ai</code>.
        </Step>
        <Step>
          <strong>On Enterprise, configure SSO</strong> from <Path>console.x.ai/organization &gt; Configure SSO</Path>, and test before you enforce it.
          <Cite ids="grok-harden" />
        </Step>
        <Step>
          <strong>Ask sales to disable personal workspaces and set retention.</strong> On Enterprise, both are requests to xAI rather than self-serve
          toggles.
          <Cite ids="grok-harden" />
        </Step>
      </Steps>
      <Callout tone="gotcha">
        <p>
          Personal Grok accounts and X-linked sign-ins are separate from the business workspace.
          <Cite ids="grok-harden" /> Without SSO on Business, an employee can drift into a personal session without noticing. That's a policy and browser
          question as much as a console one.
        </p>
      </Callout>
    </div>
  );
}

/* =================================================================== 7 */

function DataControls() {
  return (
    <Chapter
      id="data"
      n={7}
      title="Data controls: DLP and oversharing"
      lede="Admin consoles control the tool. Data controls follow the data: what an assistant can read, and what a person can paste into one."
    >
      <H3>Inside Microsoft 365</H3>
      <p>For Microsoft clients, Purview is the data layer, and the AI pieces stack like this:</p>
      <ul>
        <li>
          <strong>Sensitivity labels and oversharing fixes</strong> decide what Copilot can ground on (chapter 6).
        </li>
        <li>
          <strong>DLP for Microsoft 365 Copilot</strong> blocks sensitive prompts and keeps sensitive content out of web search.
          <Cite ids="ms-dlp-web" />
        </li>
        <li>
          <strong>DSPM for AI</strong> gives one view of AI activity that touched sensitive data, across Copilot, enterprise AI apps such as ChatGPT
          Enterprise and Claude Enterprise, and other AI sites seen in the browser.
          <Cite ids="ms-purview-ai" />
        </li>
      </ul>
      <H3>Outside Microsoft 365: other AI sites</H3>
      <p>
        On Windows devices onboarded to Purview, Endpoint DLP can warn or block users who paste sensitive information into third-party AI sites in the
        browser. For example, it can stop someone pasting credit card numbers into ChatGPT, or show a warning they can override.
        <Cite ids="ms-purview-ai" />
      </p>
      <Callout tone="gotcha">
        <ul className="list-none space-y-2">
          <li>
            Endpoint DLP only works on managed, onboarded devices, and Chrome and Firefox need the Purview browser extension. Edge integrates natively.
            <Cite ids="ms-endpoint-dlp,ms-purview-other" />
          </li>
          <li>
            Sensitivity labels don't apply to interactions with third-party AI sites. You get detection, auditing and DLP, not label enforcement.
            <Cite ids="ms-purview-other" />
          </li>
        </ul>
      </Callout>
      <p>
        That leaves real gaps for SMB clients: unmanaged and personal devices, Macs outside Purview, browsers without the extension, and AI tools that
        aren't websites at all. Those gaps are why the next chapter exists.
      </p>
      <Checklist
        title="Data controls"
        items={[
          { id: "d-assess", text: "Run the SharePoint (or Drive) oversharing assessment and fix the top ten sites before AI licenses go out." },
          { id: "d-labels", text: "Publish at least three sensitivity labels (Public, Internal, Confidential) and label the obvious libraries." },
          { id: "d-copilot-dlp", text: "Create a DLP policy for Copilot prompts and web search for regulated data types." },
          { id: "d-dspm", text: "Turn on DSPM for AI and review the first week of AI interactions with the client." },
          { id: "d-endpoint", text: "Onboard Windows devices to Endpoint DLP; deploy the Purview extension to Chrome and Firefox." },
        ]}
      />
    </Chapter>
  );
}

/* =================================================================== 8 */

function ShadowAi() {
  return (
    <Chapter
      id="shadow-ai"
      n={8}
      title="Shadow AI and the browser"
      lede="Whatever you approve, people will try the next tool. Most AI use happens in a browser tab, so that's where you get visibility and control."
    >
      <H3>The Microsoft-native option</H3>
      <p>If the client has Defender for Endpoint and Defender for Cloud Apps, you can find and block generative AI apps without another agent:</p>
      <Steps>
        <Step>
          Go to <Path>Microsoft Defender portal &gt; Cloud apps &gt; Cloud app catalog</Path> and filter <em>Category</em> to <strong>Generative AI</strong>.
          <Cite ids="ms-genai-apps" />
        </Step>
        <Step>
          Tag the apps your policy doesn't allow as <strong>Unsanctioned</strong>. On devices onboarded to Defender for Endpoint they're blocked, or set
          to warn and educate instead.
          <Cite ids="ms-genai-apps" />
        </Step>
        <Step>Create a discovery policy that alerts when a new generative AI app shows up in the logs.</Step>
      </Steps>
      <Callout tone="gotcha">
        <p>
          It's a domain-level block, and it can take up to three hours to reach devices. Session policies (the fine-grained “allow, but no uploads” kind)
          don't apply to generative AI apps like ChatGPT.
          <Cite ids="mdca-limits" /> Blocking also needs Defender for Endpoint's network protection turned on.
        </p>
      </Callout>
      <H3>Purpose-built AI security for MSPs</H3>
      <p>
        Dedicated tools fill the gaps the native stack leaves: in-prompt redaction instead of a blunt block, coverage for non-Microsoft clients, and one
        console across all your tenants. Three worth knowing, for different jobs:
      </p>
      <Table
        head={["", "What it is", "Where it works", "Best fit"]}
        rows={[
          [
            "DefensX",
            <>
              Browser security with AI governance: blocks or restricts unapproved LLMs and filters sensitive data, such as card or social security numbers,
              before it's pasted.
              <Cite ids="dx-interview" /> Added an AI Cloud Connector in July 2026 to isolate browser AI traffic.
              <Cite ids="dx-channel" />
            </>,
            "The browser",
            "MSPs who want a channel-first, multi-client browser layer for SMBs, with a monitor-only start.",
          ],
          [
            "Prompt Security (SentinelOne)",
            <>
              A GenAI security platform that SentinelOne acquired in 2025. A browser extension watches prompts, file uploads and responses, and SentinelOne
              says it governs 15,000+ AI tools.
              <Cite ids="ps-overview,ps-s1" /> It also uses a lightweight endpoint agent.
              <Cite ids="ps-s1" />
            </>,
            "Browser, endpoint, desktop AI apps",
            <>
              MSPs already on SentinelOne; it plugs into SentinelOne's multi-tenant console.
              <Cite ids="ps-mssp" />
            </>,
          ],
          [
            "Zenity",
            <>
              Security and governance for AI agents: inventory, posture management and runtime detection across Microsoft 365 Copilot, Copilot Studio,
              ChatGPT Enterprise and Agentforce.
              <Cite ids="zen-saas" /> Enforces policy inline as agents run in Copilot Studio and Foundry.
              <Cite ids="zen-inline" />
            </>,
            "Inside agent platforms",
            "Clients building their own agents in Copilot Studio or similar. More upmarket than the other two.",
          ],
        ]}
      />
      <Callout tone="do" title="Start in monitor mode">
        <p>
          Whatever you deploy, run a week of discovery before you block anything. DefensX's own playbook starts in monitor-only mode.
          <Cite ids="dx-blog" /> The report of which AI tools people actually use is the best sales document you'll have for the client: it turns a vague
          worry into a list with names on it.
        </p>
      </Callout>
    </Chapter>
  );
}

/* =================================================================== 9 */

function Agents() {
  return (
    <Chapter
      id="agents"
      n={9}
      title="Agents, connectors and MCP"
      lede="An assistant that can read your mail is a data risk. An agent that can send mail, move files and call other tools is an identity with permissions, and you should manage it like one."
    >
      <p>
        The OWASP Top 10 for LLM Applications (2025) is the shared vocabulary here. For an MSP, four entries matter most: <strong>prompt injection</strong>{" "}
        (instructions hidden in a document or webpage take over the assistant), <strong>sensitive information disclosure</strong>,{" "}
        <strong>excessive agency</strong> (the agent can do more than its job needs), and <strong>system prompt leakage</strong>.
        <Cite ids="owasp" />
      </p>
      <p>
        Prompt injection is why connectors are dangerous. If an agent can read an inbound email and also send email, a hostile message can try to make
        it forward data. The fix isn't a smarter model; it's fewer permissions and a human approval step for anything that sends, deletes or pays.
      </p>
      <H3>In Microsoft 365: Agent 365</H3>
      <p>
        Agent 365 reached general availability on May 1, 2026, as the control plane for agents in the Microsoft 365 admin center.
        <Cite ids="agent365" /> The registry inventories agents and lets admins block or delete them.
        <Cite ids="copilot-tools" /> A Tools view lists the MCP servers, plugins and connectors agents rely on, lets you block risky ones, and lets you
        approve or reject new tool requests. Intune policies can block unsanctioned local agents on devices.
        <Cite ids="agent365-tools,agent365" />
      </p>
      <Callout tone="gotcha">
        <p>
          The basic registry comes with the admin center, but risk signals, policy templates and activity monitoring need Agent 365 or Microsoft 365 E7.
          <Cite ids="copilot-tools" /> Check what the client is licensed for before promising monitoring.
        </p>
      </Callout>
      <Checklist
        title="Agents and connectors"
        items={[
          { id: "a-inventory", text: "Inventory every agent, connector, plugin and MCP server per client, with a named business owner." },
          { id: "a-least", text: "Give each agent only the permissions its task needs; nothing that can both read untrusted input and send externally." },
          { id: "a-approve", text: "Require human approval for actions that send, delete, share or pay." },
          { id: "a-block", text: "Block unapproved connectors at the platform level (Agent 365 Tools view, ChatGPT apps, Claude connectors)." },
          { id: "a-review", text: "Review agent inventory monthly; remove ones whose owner has left." },
        ]}
      />
    </Chapter>
  );
}

/* =================================================================== 10 */

function People() {
  return (
    <Chapter
      id="people"
      n={10}
      title="Train the people"
      lede="Every control above fails open if someone pastes the customer list into a personal chatbot on their phone. Training is the layer that travels with the person."
    >
      <p>AI changes security awareness training in two directions at once:</p>
      <ul>
        <li>
          <strong>Using AI safely:</strong> what data goes where, which account to use, why a confident answer can still be wrong, and what to report.
          This is also what the EU's AI-literacy rule asks for, and training must fit the systems each person actually uses.
          <Cite ids="eu-art4" />
        </li>
        <li>
          <strong>Recognizing AI-powered attacks:</strong> phishing with perfect grammar, cloned voices asking for wire transfers, deepfake video calls,
          and lures that ride real events within hours. When Microsoft 365 had an outage on November 12, 2026, phishing emails using it as a lure started
          arriving within hours.
          <Cite ids="outage-lure" />
        </li>
      </ul>
      <p>
        Slide decks and once-a-year videos don't change behavior under pressure, and pressure is exactly what these attacks create. People need to
        practice the decision: the urgent request, the convincing voice, the “just this once” paste, in a setting where getting it wrong costs nothing.
      </p>
      <div className="aurora my-10 px-6 py-8 sm:px-9">
        <p className="text-sm font-semibold text-site-mint">From the people who wrote this guide</p>
        <p className="mt-2 text-2xl font-extrabold leading-snug" style={{ fontStretch: "112%" }}>
          Dry Run Cyber is security awareness training people play.
        </p>
        <p className="mt-3 max-w-[36rem] leading-relaxed text-site-mist">
          One first-person night shift with real-world attacks, built from lures circulating now, with every decision recorded against NIST, CIS, HIPAA and
          CMMC controls. It's built for MSPs to resell, with a partner portal across all your clients.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/#night" className={btn.primary}>
            See a shift <Arrow size={16} />
          </a>
          <a href="/sample-record" className={btn.ghost}>
            See a sample record
          </a>
        </div>
      </div>
    </Chapter>
  );
}

/* =================================================================== 11 */

function Rollout() {
  return (
    <Chapter
      id="rollout"
      n={11}
      title="A 30/60/90 plan for each client"
      lede="Use this as the statement of work. Each phase ends with something the client can see."
    >
      <Checklist
        title="Days 1–30: see it and agree it"
        items={[
          { id: "r1-discover", text: "Run shadow-AI discovery for a week (Defender for Cloud Apps or a browser tool) and share the report." },
          { id: "r1-policy", text: "Build the AI usage policy with the owner; pick one approved assistant and its plan tier." },
          { id: "r1-access", text: "Get named, least-privilege admin access to each AI platform, documented in the SOW." },
          { id: "r1-baa", text: "For regulated clients, confirm the BAA or equivalent terms are signed before any regulated data goes in." },
        ]}
      />
      <Checklist
        title="Days 31–60: configure it"
        items={[
          { id: "r2-sso", text: "Verify domains and connect SSO (and SCIM where available) for the approved platform." },
          { id: "r2-oversharing", text: "Fix oversharing in SharePoint or Drive before turning on Copilot or Gemini broadly." },
          { id: "r2-settings", text: "Set retention, web search, connectors and sharing settings to match the policy." },
          { id: "r2-dlp", text: "Turn on DLP for prompts and uploads, in monitor mode first." },
          { id: "r2-sign", text: "Collect signed policy acknowledgments from every employee." },
        ]}
      />
      <Checklist
        title="Days 61–90: enforce and train"
        items={[
          { id: "r3-block", text: "Move DLP and shadow-AI rules from monitor to warn or block for regulated data and unapproved tools." },
          { id: "r3-agents", text: "Inventory agents and connectors; remove or approve each one with an owner." },
          { id: "r3-train", text: "Run training on safe AI use and AI-driven social engineering, and keep the completion records." },
          { id: "r3-review", text: "Book a quarterly review: new tools, new features, policy changes." },
        ]}
      />
      <Callout tone="do" title="Next step">
        <p>
          Start with the policy. It's the document that makes everything else enforceable, and it's free:{" "}
          <a href="/ai-security/policy-builder">open the AI usage policy builder</a>.
        </p>
      </Callout>
    </Chapter>
  );
}
