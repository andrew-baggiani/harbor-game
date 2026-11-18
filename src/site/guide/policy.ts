// AI usage policy: options in, document blocks out. Rendered as a live preview, Markdown, .docx and print/PDF.

export type Industry = "healthcare" | "defense" | "finance" | "legal" | "eu";
export type DataClass = "internal" | "confidential" | "regulated";
export type Group = "assistants" | "specialized" | "builders" | "platforms";

/** BAA: "yes" where the vendor offers one on the named plan, "some" where only some plans or a sales process, "no" where documented as excluded, "ask" where unknown. */
export type Baa = "yes" | "some" | "no" | "ask";
export type CatalogTool = { id: string; name: string; group: Group; plans: string[]; baa: Baa; note?: string };

export const GROUP_LABEL: Record<Group, string> = {
  assistants: "General assistants",
  specialized: "Specialized and creative",
  builders: "Agent and automation builders",
  platforms: "Platforms and APIs",
};

export const CATALOG: CatalogTool[] = [
  { id: "copilot", name: "Microsoft Copilot (Microsoft 365)", group: "assistants", plans: ["Copilot Chat (work account)", "Microsoft 365 Copilot", "Microsoft 365 Copilot Business"], baa: "yes", note: "Covered under Microsoft's BAA; web search queries are not." },
  { id: "chatgpt", name: "ChatGPT", group: "assistants", plans: ["ChatGPT Business", "ChatGPT Enterprise"], baa: "some", note: "BAA only on sales-managed Enterprise, not Business." },
  { id: "claude", name: "Claude", group: "assistants", plans: ["Claude Team", "Claude Enterprise"], baa: "some", note: "BAA on Enterprise after the HIPAA setting is turned on." },
  { id: "gemini", name: "Gemini in Google Workspace", group: "assistants", plans: ["Workspace Business or Enterprise"], baa: "yes", note: "Covered once a super admin accepts Google's BAA." },
  { id: "grok", name: "Grok", group: "assistants", plans: ["Grok Business", "Grok Enterprise"], baa: "ask" },
  { id: "perplexity", name: "Perplexity", group: "assistants", plans: ["Enterprise Pro"], baa: "some", note: "BAA through sales on Enterprise plans." },
  { id: "meta", name: "Meta AI", group: "assistants", plans: ["Business account"], baa: "ask" },
  { id: "github-copilot", name: "GitHub Copilot", group: "specialized", plans: ["Business", "Enterprise"], baa: "no", note: "Outside Microsoft's HIPAA BAA." },
  { id: "cursor", name: "Cursor", group: "specialized", plans: ["Teams", "Enterprise"], baa: "ask" },
  { id: "notebooklm", name: "NotebookLM", group: "specialized", plans: ["Workspace account"], baa: "ask" },
  { id: "firefly", name: "Adobe Firefly", group: "specialized", plans: ["Business / Enterprise"], baa: "ask" },
  { id: "midjourney", name: "Midjourney", group: "specialized", plans: ["Pro / Mega"], baa: "ask" },
  { id: "otter", name: "Otter.ai", group: "specialized", plans: ["Business", "Enterprise"], baa: "ask" },
  { id: "zoom-ai", name: "Zoom AI Companion", group: "specialized", plans: ["Business account"], baa: "ask" },
  { id: "grammarly", name: "Grammarly", group: "specialized", plans: ["Business", "Enterprise"], baa: "ask" },
  { id: "canva", name: "Canva AI", group: "specialized", plans: ["Teams", "Enterprise"], baa: "ask" },
  { id: "copilot-studio", name: "Microsoft Copilot Studio", group: "builders", plans: ["Tenant license"], baa: "ask" },
  { id: "power-automate", name: "Power Automate (AI features)", group: "builders", plans: ["Tenant license"], baa: "ask" },
  { id: "zapier", name: "Zapier Agents", group: "builders", plans: ["Team", "Enterprise"], baa: "ask" },
  { id: "make", name: "Make", group: "builders", plans: ["Teams", "Enterprise"], baa: "ask" },
  { id: "n8n", name: "n8n", group: "builders", plans: ["Self-hosted", "Cloud"], baa: "ask" },
  { id: "azure-openai", name: "Azure OpenAI Service", group: "platforms", plans: ["Company Azure subscription"], baa: "yes" },
  { id: "bedrock", name: "AWS Bedrock", group: "platforms", plans: ["Company AWS account"], baa: "yes" },
  { id: "vertex", name: "Google Vertex AI", group: "platforms", plans: ["Company Google Cloud project"], baa: "yes" },
  { id: "openai-api", name: "OpenAI API", group: "platforms", plans: ["Company organization"], baa: "some", note: "BAA available for approved customers." },
  { id: "anthropic-api", name: "Anthropic API", group: "platforms", plans: ["Company organization"], baa: "some", note: "BAA covers HIPAA-ready API use." },
];
export const toolById = (id: string) => CATALOG.find((t) => t.id === id);

export const INDUSTRY_LABEL: Record<Industry, string> = {
  healthcare: "Healthcare (HIPAA)",
  defense: "Defense contractor (CMMC / CUI)",
  finance: "Financial services or card data (GLBA / PCI)",
  legal: "Legal (privilege and confidentiality)",
  eu: "Staff or customers in the EU (AI Act)",
};

export const CLASS_LABEL: Record<DataClass, string> = { internal: "Internal", confidential: "Confidential", regulated: "Regulated" };

export const HIGH_RISK_SUGGESTIONS = [
  "Content sent to customers or published",
  "Decisions about money: payments, pricing, credit",
  "Decisions about people: hiring, pay, discipline",
  "Security decisions: access, firewall or account changes",
  "Legal, medical or regulatory advice",
];

export type Approved = { on: boolean; plan: string; max: DataClass };
export type PolicyInput = {
  audience: "client" | "msp";
  org: string;
  preparedBy: string;
  logo: string; // PNG data URL, kept out of share links
  effective: string;
  owner: string;
  contact: string;
  escalation: string;
  review: "quarterly" | "twice a year" | "yearly";
  industries: Industry[];
  tools: Record<string, Approved>;
  custom: { name: string; max: DataClass }[];
  never: string[];
  highRisk: { use: string; owner: string }[];
  rules: { extensions: boolean; notetakers: boolean; agents: boolean; code: boolean; disclose: boolean; likeness: boolean };
};

const off = (id: string, max: DataClass = "confidential"): Approved => ({ on: false, plan: toolById(id)?.plans[0] ?? "", max });
export const DEFAULT_POLICY: PolicyInput = {
  audience: "client",
  org: "",
  preparedBy: "",
  logo: "",
  effective: "",
  owner: "",
  contact: "",
  escalation: "",
  review: "quarterly",
  industries: [],
  tools: Object.fromEntries(CATALOG.map((t) => [t.id, off(t.id, t.group === "assistants" || t.group === "platforms" ? "confidential" : "internal")])),
  custom: [],
  never: [],
  highRisk: [],
  rules: { extensions: true, notetakers: true, agents: true, code: true, disclose: true, likeness: true },
};

/** One-click starting points. */
export const PRESETS: { id: string; label: string; apply: (p: PolicyInput) => PolicyInput }[] = [
  {
    id: "clinic",
    label: "Medical or dental clinic",
    apply: (p) => withTools({ ...p, industries: ["healthcare"], highRisk: [{ use: "Anything involving patient care or patient records", owner: "Practice manager" }, { use: "Content sent to patients", owner: "" }] }, { copilot: ["Microsoft 365 Copilot", "regulated"] }),
  },
  {
    id: "defense",
    label: "Defense contractor",
    apply: (p) => withTools({ ...p, industries: ["defense"], highRisk: [{ use: "Anything involving CUI or export-controlled data", owner: "Facility security officer" }] }, { copilot: ["Microsoft 365 Copilot", "confidential"] }),
  },
  {
    id: "accounting",
    label: "Accounting or finance firm",
    apply: (p) => withTools({ ...p, industries: ["finance"], highRisk: [{ use: "Decisions about money: payments, pricing, credit", owner: "Managing partner" }] }, { copilot: ["Microsoft 365 Copilot Business", "confidential"], chatgpt: ["ChatGPT Business", "confidential"] }),
  },
  {
    id: "law",
    label: "Law firm",
    apply: (p) => withTools({ ...p, industries: ["legal"], highRisk: [{ use: "Legal, medical or regulatory advice", owner: "Managing partner" }, { use: "Court filings and anything sent to opposing counsel", owner: "" }] }, { copilot: ["Microsoft 365 Copilot", "confidential"], claude: ["Claude Team", "confidential"] }),
  },
  {
    id: "msp",
    label: "My MSP",
    apply: (p) => withTools({ ...p, audience: "msp", industries: [], highRisk: [{ use: "Security decisions: access, firewall or account changes", owner: "Service manager" }, { use: "Scripts that run on client systems", owner: "Lead engineer" }] }, { copilot: ["Microsoft 365 Copilot", "confidential"], chatgpt: ["ChatGPT Business", "confidential"], "github-copilot": ["Business", "internal"] }),
  },
];
function withTools(p: PolicyInput, on: Record<string, [string, DataClass]>): PolicyInput {
  const tools = Object.fromEntries(CATALOG.map((t) => [t.id, on[t.id] ? { on: true, plan: on[t.id][0], max: on[t.id][1] } : { ...p.tools[t.id], on: false }]));
  return { ...p, tools };
}

/* ------------------------------------------------------------------ checks */

export type Finding = { level: "good" | "warn" | "risk"; text: string };
export function review(i: PolicyInput): { score: number; findings: Finding[] } {
  const f: Finding[] = [];
  const approved = CATALOG.filter((t) => i.tools[t.id]?.on);
  const n = approved.length + i.custom.filter((c) => c.name.trim()).length;
  const has = (x: Industry) => i.industries.includes(x);
  let pts = 0;
  let max = 0;
  const check = (ok: boolean, good: string, bad: string, level: "warn" | "risk" = "warn") => {
    max++;
    if (ok) {
      pts++;
      f.push({ level: "good", text: good });
    } else f.push({ level, text: bad });
  };
  check(n > 0, `${n} approved tool${n === 1 ? "" : "s"}. Staff have a sanctioned place to work.`, "No approved tools. Banning AI without an alternative sends people to personal accounts.", "risk");
  check(!!i.owner.trim(), "A named policy owner.", "Name a policy owner, or nobody keeps it current.");
  check(!!i.contact.trim(), "A reporting contact.", "Add a reporting contact so mistakes get reported fast.");
  check(i.review !== "yearly", `Reviewed ${i.review}.`, "Review at least twice a year; the AI platforms change monthly.");
  check(i.never.length > 0, `${i.never.length} specific “never share” item${i.never.length === 1 ? "" : "s"}.`, "Add a few “never share” items in the client's own words (their systems, their customers).");
  check(i.highRisk.length > 0, `${i.highRisk.length} high-risk use${i.highRisk.length === 1 ? "" : "s"} with a human in the lead.`, "List the high-risk uses that always need a person to decide.");
  const builders = approved.some((t) => t.group === "builders");
  if (builders) check(i.rules.agents, "Agent builders are approved with an approval rule for agents.", "You approved an agent builder but turned off the agents rule.", "risk");
  if (has("healthcare")) {
    const gaps = approved.filter((t) => i.tools[t.id].max === "regulated" && t.baa !== "yes" && !(t.baa === "some" && /Enterprise|API|organization/i.test(i.tools[t.id].plan)));
    check(!gaps.length, "Patient data is only allowed in tools that offer a BAA on the chosen plan.", `Patient data is allowed in ${gaps.map((g) => g.name).join(", ")}, which ${gaps.length === 1 ? "has" : "have"} no confirmed BAA on that plan.`, "risk");
  }
  if (has("defense")) {
    const reg = approved.filter((t) => i.tools[t.id].max === "regulated");
    check(!reg.length, "No tool is cleared for CUI by default.", `${reg.map((g) => g.name).join(", ")} allow regulated data. Confirm each is authorized for CUI before allowing it.`, "risk");
  }
  return { score: max ? Math.round((pts / max) * 100) : 0, findings: f };
}

/* ------------------------------------------------------------------ the policy */

export type Block =
  | { t: "title"; text: string; sub?: string }
  | { t: "meta"; rows: [string, string][] }
  | { t: "h"; text: string }
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "sign" };

const ORDER: DataClass[] = ["internal", "confidential", "regulated"];

function addMonths(iso: string, months: number) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
const fmt = (iso: string) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "");
export const firstReview = (i: PolicyInput) => (i.effective ? fmt(addMonths(i.effective, i.review === "quarterly" ? 3 : i.review === "twice a year" ? 6 : 12)) : "");

function names(i: PolicyInput) {
  return {
    org: i.org.trim() || (i.audience === "msp" ? "[Your company]" : "[Company]"),
    owner: i.owner.trim() || "[Policy owner, e.g. Operations Manager]",
    contact: i.contact.trim() || "[it@company.com]",
    escalation: i.escalation.trim(),
  };
}
function approvedList(i: PolicyInput) {
  const rows = CATALOG.filter((t) => i.tools[t.id]?.on).map((t) => ({ name: t.name, plan: i.tools[t.id].plan, max: i.tools[t.id].max }));
  for (const c of i.custom) if (c.name.trim()) rows.push({ name: c.name.trim(), plan: "Company account", max: c.max });
  return rows;
}

export function buildPolicy(i: PolicyInput): Block[] {
  const { org, owner, contact, escalation } = names(i);
  const msp = i.audience === "msp";
  const has = (x: Industry) => i.industries.includes(x);
  const tools = approvedList(i);
  const top = tools.reduce((m, t) => Math.max(m, ORDER.indexOf(t.max)), -1);
  const regulatedNote = has("healthcare")
    ? "Only in approved tools rated Regulated, with a signed business associate agreement (BAA)."
    : has("defense")
      ? "Never, unless IT confirms the tool is authorized for CUI."
      : "Only in approved tools rated Regulated, where IT has confirmed the contract covers this data.";

  const meta: [string, string][] = [];
  if (i.preparedBy.trim()) meta.push(["Prepared by", i.preparedBy.trim()]);
  meta.push(["Effective", fmt(i.effective) || "[Date]"], ["Owner", owner], ["Report to", contact]);
  if (escalation) meta.push(["Escalation", escalation]);
  meta.push(["Review", `${i.review === "yearly" ? "Yearly" : i.review[0].toUpperCase() + i.review.slice(1)}${firstReview(i) ? `, first by ${firstReview(i)}` : ""}`]);

  const b: Block[] = [
    { t: "title", text: "AI Acceptable Use Policy", sub: org },
    { t: "meta", rows: meta },
    { t: "h", text: "1. Purpose and scope" },
    {
      t: "p",
      text: `${org} uses artificial intelligence (AI) tools to work faster and better. This policy says which tools are approved, what information may be used with them, which decisions always stay with a person, and what is never allowed. It applies to all employees, contractors and anyone using ${org} systems or data${msp ? ", and to all work performed for clients" : ""}.`,
    },
    { t: "h", text: "2. Definitions" },
    {
      t: "ul",
      items: [
        "AI tool: any service that generates text, images, audio, video or code, or that summarizes, searches or acts on information, including assistants built into other software.",
        "Approved tool: an AI tool listed in section 3, used through the company account and plan listed there.",
        "Agent or connector: a feature that lets an AI tool read from or act in another system, such as email, files, calendars or business applications.",
      ],
    },
    { t: "h", text: "3. Approved tools" },
  ];
  if (tools.length) {
    b.push(
      { t: "p", text: "Only these AI tools are approved for company work, through the company account and plan listed, and only up to the information level shown (see section 5):" },
      { t: "table", head: ["Tool", "Account and plan", "Highest information allowed"], rows: tools.map((t) => [t.name, t.plan, CLASS_LABEL[t.max]]) },
    );
  } else b.push({ t: "p", text: "No AI tools are approved yet. Until one is, do not use AI tools with company information." });
  b.push({ t: "p", text: `To request a new AI tool or feature, contact ${contact}. ${owner} decides with IT, after checking the vendor's data handling, security and contract terms. Requests are answered within one week.` });

  b.push(
    { t: "h", text: "4. Accounts and access" },
    {
      t: "ul",
      items: [
        "Use approved tools only through your company account, signed in with your work credentials and multi-factor authentication.",
        "Never use a personal AI account, free or paid, for company work or company information, even if it uses your work email address.",
        "Do not share AI accounts or let others use your session.",
        "When you leave, your access ends and your conversations stay with the company account.",
      ],
    },
    { t: "h", text: "5. Information levels" },
    {
      t: "table",
      head: ["Level", "Examples", "Where it may go"],
      rows: [
        ["Public", "Published website content, press releases, public documentation", "Any approved tool"],
        ["Internal", "Processes, drafts, meeting notes without sensitive details", top >= 0 ? "Approved tools rated Internal or higher" : "Nowhere yet"],
        ["Confidential", `Customer${msp ? " and client" : ""} information, contracts, pricing, financials, employee information`, top >= 1 ? "Approved tools rated Confidential or higher. Share only what the task needs" : "Not in any AI tool"],
        [
          "Regulated",
          [has("healthcare") ? "Patient health information" : "", has("defense") ? "Controlled unclassified information" : "", has("finance") ? "Card and account numbers" : "", "government IDs"].filter(Boolean).join(", "),
          top >= 2 ? regulatedNote : "Not in any AI tool",
        ],
      ],
    },
    { t: "h", text: "6. Never share" },
  );
  const never = ["Passwords, API keys, access tokens and other credentials.", ...i.never.filter((x) => x.trim()).map((x) => (/[.!?]$/.test(x.trim()) ? x.trim() : `${x.trim()}.`))];
  b.push({ t: "p", text: "These never go into any AI tool, approved or not, whatever the account:" }, { t: "ul", items: never });
  if (has("healthcare") || has("finance") || has("defense"))
    b.push({ t: "p", text: "Laws that already apply to this information, such as HIPAA, GLBA, PCI DSS and DFARS, still apply when AI is involved." });

  b.push(
    { t: "h", text: "7. Acceptable use" },
    {
      t: "ul",
      items: [
        "Drafting, summarizing, brainstorming, research and analysis within your role.",
        "Share only the minimum information the task needs; remove names and identifiers when they aren't necessary.",
        "Treat AI output as a first draft from a confident assistant that can be wrong.",
      ],
    },
    { t: "h", text: "8. Prohibited use" },
  );
  const prohibited = [
    "Putting information into a tool that isn't approved, or above the level that tool is approved for.",
    "Creating content that is unlawful, harassing, discriminatory or deceptive.",
    "Presenting AI output as verified fact, legal advice or a final decision without the review in section 10.",
  ];
  if (i.rules.likeness) prohibited.push("Creating or sharing images, audio or video that imitate a real person's face or voice without their written consent.");
  b.push({ t: "ul", items: prohibited });

  b.push({ t: "h", text: "9. High-risk uses: a person decides" });
  b.push({ t: "p", text: "AI may help prepare these, but a named person reviews and makes the final decision:" });
  const hr = i.highRisk.filter((h) => h.use.trim());
  b.push(
    hr.length
      ? { t: "table", head: ["Use", "Responsible person"], rows: hr.map((h) => [h.use.trim(), h.owner.trim() || owner]) }
      : { t: "ul", items: ["Decisions about people, such as hiring, pay or discipline.", "Decisions about money, such as payments or credit.", "Anything sent to customers, regulators or the public."] },
  );

  b.push({ t: "h", text: "10. Human review and accuracy" });
  const rev = [
    "A person checks AI output for accuracy, tone and confidentiality before it goes to a customer, partner, regulator or the public, or into a contract.",
    "You are responsible for anything you send or publish, whether or not AI helped write it.",
  ];
  if (i.rules.code) rev.push("AI-generated code and scripts are reviewed and tested before they run in production or on client systems.");
  if (i.rules.disclose) rev.push("When content customers rely on is substantially AI-generated, say so where that's expected.");
  b.push({ t: "ul", items: rev });

  b.push({ t: "h", text: "11. Agents, connectors and extensions" });
  const ag: string[] = [];
  if (i.rules.agents)
    ag.push(
      "Do not connect an AI tool to email, files, calendars, chat or business systems, or build an AI agent, without written IT approval and a named owner.",
      "Agents may not send, delete, share or pay without a person approving the action.",
    );
  if (i.rules.extensions) ag.push("Do not install AI browser extensions, plug-ins or desktop AI apps without IT approval.");
  if (i.rules.notetakers) ag.push("AI meeting recorders and note-takers are used only when every attendee has been told, and not in meetings about regulated information unless the tool is approved for it.");
  if (!ag.length) ag.push("Agents, connectors and extensions follow the same approval process as new tools in section 3.");
  b.push({ t: "ul", items: ag });

  let n = 12;
  if (msp)
    b.push(
      { t: "h", text: `${n++}. Client data` },
      {
        t: "ul",
        items: [
          "Client information is used only in the approved company AI workspace, and only for work for that client.",
          "Remove tenant IDs, hostnames, IP addresses, keys and client names from logs, scripts and tickets before using them with AI, unless the tool and the client contract allow it.",
          "Follow each client's own AI policy when it is stricter than this one.",
          "Keep a list of AI features in our own business tools (PSA, RMM, documentation, backup) and what client data each sends to its vendor.",
        ],
      },
    );
  const ind: string[] = [];
  if (has("healthcare")) ind.push("Protected health information (PHI) is used only in tools covered by a signed BAA and configured as the BAA requires. Web search features that send queries outside that coverage are turned off for PHI work.");
  if (has("defense")) ind.push("Controlled unclassified information (CUI) and export-controlled data are not used with any AI tool unless IT confirms the tool is authorized for that data.");
  if (has("finance")) ind.push("Full card numbers, bank account numbers and authentication data never go into AI tools. Customer financial records follow the Confidential rules.");
  if (has("legal")) ind.push("Privileged and confidential client matter information is used only in approved tools whose terms protect confidentiality, and never in a way that could waive privilege.");
  if (has("eu")) ind.push("For staff in the EU, the company takes measures to support AI literacy under Article 4 of the EU AI Act: training suited to each person's role and the AI tools they use, with completion recorded.");
  if (ind.length) b.push({ t: "h", text: `${n++}. Industry requirements` }, { t: "ul", items: ind });

  b.push(
    { t: "h", text: `${n++}. Reporting mistakes and incidents` },
    {
      t: "p",
      text: `If information went into the wrong AI tool, an AI output caused harm, or an AI tool behaved unexpectedly, tell ${contact} right away, ideally within one hour.${escalation ? ` If you can't reach them, contact ${escalation}.` : ""} Reporting your own mistake in good faith will not be held against you.`,
    },
    { t: "h", text: `${n++}. Responsible use` },
    { t: "p", text: "We use AI to support people, not replace their judgment. We are open about where AI is used, we protect the people whose information we hold, and we check AI output for bias and error before relying on it." },
    { t: "h", text: `${n++}. Training` },
    { t: "p", text: "Everyone completes security awareness training that covers safe AI use and AI-enabled attacks, such as convincing phishing, cloned voices and deepfake video, when they join and at least once a year. Completion is recorded." },
    { t: "h", text: `${n++}. Ownership and review` },
    {
      t: "p",
      text: `${owner} owns this policy and reviews it ${i.review === "yearly" ? "at least once a year" : i.review}${firstReview(i) ? `, first by ${firstReview(i)}` : ""}, and whenever a major AI tool or feature changes. Breaking this policy may lead to disciplinary action.`,
    },
    { t: "h", text: "Acknowledgment" },
    { t: "p", text: `I have read and will follow the ${org} AI Acceptable Use Policy.` },
    { t: "sign" },
  );
  return b;
}

/** A one-page summary for staff: the rules people actually need at the keyboard. */
export function buildQuickCard(i: PolicyInput): Block[] {
  const { org, contact } = names(i);
  const tools = approvedList(i);
  return [
    { t: "title", text: "Using AI at work: the short version", sub: org },
    { t: "h", text: "Use these, signed in with your work account" },
    tools.length ? { t: "table", head: ["Tool", "Highest information allowed"], rows: tools.map((t) => [`${t.name}: ${t.plan}`, CLASS_LABEL[t.max]]) } : { t: "p", text: "No AI tools are approved yet. Ask before using one." },
    { t: "h", text: "Never" },
    {
      t: "ul",
      items: [
        "Use a personal AI account for work, even with your work email.",
        "Paste passwords, keys or codes into any AI tool.",
        ...i.never.filter((x) => x.trim()).slice(0, 5),
        "Connect AI to email, files or business apps without IT's OK.",
      ],
    },
    { t: "h", text: "Always" },
    { t: "ul", items: ["Share only what the task needs.", "Check AI output before it reaches a customer.", "Let a person make decisions about people, money and security."] },
    { t: "h", text: "Made a mistake? Tell us fast" },
    { t: "p", text: `Contact ${contact}, ideally within an hour. Reporting a mistake in good faith is never punished.` },
  ];
}

/* ------------------------------------------------------------------ export */

const FOOT = "Template from the free AI policy builder at dryruncyber.com/ai-security. Not legal advice; have it reviewed for your situation.";

export function toMarkdown(blocks: Block[]): string {
  const out: string[] = [];
  for (const b of blocks) {
    if (b.t === "title") out.push(`# ${b.sub ? `${b.sub}: ` : ""}${b.text}`);
    if (b.t === "meta") out.push(b.rows.map(([k, v]) => `**${k}:** ${v}`).join("  \n"));
    if (b.t === "h") out.push(`## ${b.text}`);
    if (b.t === "p") out.push(b.text);
    if (b.t === "ul") out.push(b.items.map((x) => `- ${x}`).join("\n"));
    if (b.t === "table") out.push([`| ${b.head.join(" | ")} |`, `|${b.head.map(() => " --- ").join("|")}|`, ...b.rows.map((r) => `| ${r.join(" | ")} |`)].join("\n"));
    if (b.t === "sign") out.push("Name: ______________________  \nSignature: ______________________  \nDate: ______________________");
  }
  out.push(`---\n*${FOOT}*`);
  return out.join("\n\n");
}

function dataUrlBytes(url: string) {
  const bin = atob(url.split(",")[1] ?? "");
  const bytes = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
  return bytes;
}

export async function toDocx(blocks: Block[], logo?: { url: string; w: number; h: number }): Promise<Blob> {
  const d = await import("docx");
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun, ShadingType } = d;
  const kids: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [];
  if (logo?.url) {
    const h = 48;
    kids.push(new Paragraph({ spacing: { after: 200 }, children: [new ImageRun({ type: "png", data: dataUrlBytes(logo.url), transformation: { width: Math.round((logo.w / logo.h) * h), height: h } })] }));
  }
  const line = { style: BorderStyle.SINGLE, size: 4, color: "C9C9C9" };
  const cell = (text: string, head = false) =>
    new TableCell({
      shading: head ? { type: ShadingType.CLEAR, color: "auto", fill: "F1F1F4" } : undefined,
      children: [new Paragraph({ children: [new TextRun({ text, bold: head })] })],
      margins: { top: 80, bottom: 80, left: 110, right: 110 },
    });
  for (const b of blocks) {
    if (b.t === "title") {
      if (b.sub) kids.push(new Paragraph({ children: [new TextRun({ text: b.sub, size: 26, color: "6B4FBB", bold: true })] }));
      kids.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: b.text })] }));
    }
    if (b.t === "meta") for (const [k, v] of b.rows) kids.push(new Paragraph({ children: [new TextRun({ text: `${k}: `, bold: true }), new TextRun({ text: v })] }));
    if (b.t === "h") kids.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280 }, children: [new TextRun({ text: b.text })] }));
    if (b.t === "p") kids.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: b.text })] }));
    if (b.t === "ul") for (const x of b.items) kids.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: x })] }));
    if (b.t === "table")
      kids.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line },
          rows: [new TableRow({ tableHeader: true, children: b.head.map((h) => cell(h, true)) }), ...b.rows.map((r) => new TableRow({ children: r.map((c) => cell(c)) }))],
        }),
      );
    if (b.t === "sign") for (const l of ["Name", "Signature", "Date"]) kids.push(new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: `${l}: ________________________________` })] }));
  }
  kids.push(new Paragraph({ spacing: { before: 480 }, children: [new TextRun({ text: FOOT, italics: true, size: 16, color: "777777" })] }));
  const doc = new Document({ styles: { default: { document: { run: { font: "Calibri", size: 22 } } } }, sections: [{ children: kids }] });
  return Packer.toBlob(doc);
}

/* ------------------------------------------------------------------ share links (no logo, no names beyond what's typed) */

export function encodeConfig(p: PolicyInput): string {
  const { logo: _logo, ...rest } = p;
  const json = JSON.stringify(rest);
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodeConfig(s: string): Partial<PolicyInput> | null {
  try {
    const json = decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
export function mergeConfig(saved: Partial<PolicyInput>): PolicyInput {
  return {
    ...DEFAULT_POLICY,
    ...saved,
    tools: Object.fromEntries(
      CATALOG.map((t) => {
        const d = DEFAULT_POLICY.tools[t.id];
        const v = (saved.tools ?? {})[t.id] as Partial<Approved> | undefined;
        return [t.id, { on: !!v?.on, plan: v?.plan && t.plans.includes(v.plan) ? v.plan : d.plan, max: v?.max ?? d.max }];
      }),
    ),
    rules: { ...DEFAULT_POLICY.rules, ...(saved.rules ?? {}) },
    custom: saved.custom ?? [],
    never: saved.never ?? [],
    highRisk: saved.highRisk ?? [],
    industries: saved.industries ?? [],
  };
}
