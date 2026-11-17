// AI usage policy: options in, document blocks out. Rendered as a live preview, Markdown and .docx.

export type Industry = "healthcare" | "defense" | "finance" | "legal" | "eu";
export type ToolKey = "copilot" | "chatgpt" | "claude" | "gemini" | "grok";
export type DataClass = "internal" | "confidential" | "regulated";

export type PolicyInput = {
  audience: "client" | "msp";
  org: string;
  effective: string;
  owner: string;
  contact: string;
  review: "quarterly" | "twice a year" | "yearly";
  industries: Industry[];
  tools: Record<ToolKey, { on: boolean; plan: string }>;
  other: string;
  maxClass: DataClass;
  rules: {
    extensions: boolean;
    notetakers: boolean;
    agents: boolean;
    code: boolean;
    disclose: boolean;
    peopleDecisions: boolean;
    likeness: boolean;
  };
};

export const TOOL_LABEL: Record<ToolKey, string> = {
  copilot: "Microsoft Copilot and Copilot Chat",
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini in Google Workspace",
  grok: "Grok",
};
export const TOOL_PLANS: Record<ToolKey, string[]> = {
  copilot: ["Microsoft 365 Copilot", "Microsoft 365 Copilot Business", "Copilot Chat (work account)"],
  chatgpt: ["ChatGPT Business", "ChatGPT Enterprise"],
  claude: ["Claude Team", "Claude Enterprise"],
  gemini: ["Workspace Business or Enterprise edition"],
  grok: ["Grok Business", "Grok Enterprise"],
};

export const INDUSTRY_LABEL: Record<Industry, string> = {
  healthcare: "Healthcare (HIPAA)",
  defense: "Defense contractor (CMMC / CUI)",
  finance: "Financial services or card data",
  legal: "Legal (privilege and confidentiality)",
  eu: "Staff or customers in the EU",
};

export const DEFAULT_POLICY: PolicyInput = {
  audience: "client",
  org: "",
  effective: "",
  owner: "",
  contact: "",
  review: "quarterly",
  industries: [],
  tools: {
    copilot: { on: true, plan: "Copilot Chat (work account)" },
    chatgpt: { on: false, plan: "ChatGPT Business" },
    claude: { on: false, plan: "Claude Team" },
    gemini: { on: false, plan: "Workspace Business or Enterprise edition" },
    grok: { on: false, plan: "Grok Business" },
  },
  other: "",
  maxClass: "confidential",
  rules: { extensions: true, notetakers: true, agents: true, code: true, disclose: true, peopleDecisions: true, likeness: true },
};

export type Block =
  | { t: "title"; text: string }
  | { t: "meta"; rows: [string, string][] }
  | { t: "h"; text: string }
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "sign" };

const CLASS_ORDER: DataClass[] = ["internal", "confidential", "regulated"];

export function buildPolicy(i: PolicyInput): Block[] {
  const org = i.org.trim() || (i.audience === "msp" ? "[Your company]" : "[Company]");
  const owner = i.owner.trim() || "[Policy owner, e.g. Operations Manager]";
  const contact = i.contact.trim() || "[ai@company.com]";
  const tools = (Object.keys(i.tools) as ToolKey[]).filter((k) => i.tools[k].on);
  const toolLines = tools.map((k) => `${TOOL_LABEL[k]}: ${i.tools[k].plan}, using the company workspace only.`);
  if (i.other.trim()) toolLines.push(`${i.other.trim()}, using the company workspace only.`);
  const msp = i.audience === "msp";
  const has = (x: Industry) => i.industries.includes(x);
  const max = CLASS_ORDER.indexOf(i.maxClass);
  const allowed = (c: DataClass) => CLASS_ORDER.indexOf(c) <= max;
  const regulatedNote = has("healthcare")
    ? "Only in approved tools covered by a signed business associate agreement (BAA)."
    : has("defense")
      ? "Never, unless IT confirms the tool is authorized for CUI."
      : "Only where IT has confirmed the tool's contract covers this data.";

  const blocks: Block[] = [
    { t: "title", text: `${org} AI Acceptable Use Policy` },
    {
      t: "meta",
      rows: [
        ["Effective", i.effective || "[Date]"],
        ["Owner", owner],
        ["Questions", contact],
        ["Review", `At least ${i.review === "yearly" ? "once a year" : i.review}`],
      ],
    },
    { t: "h", text: "1. Purpose and scope" },
    {
      t: "p",
      text: `${org} uses artificial intelligence (AI) tools to work faster and better. This policy explains which tools are approved, what information may be used with them, and what is never allowed. It applies to all employees, contractors and anyone using ${org} systems or data${msp ? ", and to all work performed for clients" : ""}.`,
    },
    { t: "h", text: "2. Definitions" },
    {
      t: "ul",
      items: [
        "AI tool: any service that generates text, images, audio, video or code, or that summarizes, searches or acts on information, including assistants built into other software.",
        "Approved tool: an AI tool listed in section 3, used through the company account described there.",
        "Agent or connector: a feature that lets an AI tool read from or act in another system, such as email, files, calendars or business applications.",
      ],
    },
    { t: "h", text: "3. Approved tools" },
    {
      t: "p",
      text: toolLines.length
        ? "Only the following AI tools are approved for company work:"
        : "No AI tools are approved yet. Until IT approves one, do not use AI tools with company information.",
    },
  ];
  if (toolLines.length) blocks.push({ t: "ul", items: toolLines });
  blocks.push({
    t: "p",
    text: `To request a new AI tool or feature, contact ${contact}. ${owner} decides, with IT, after checking the vendor's data handling, security and contract terms.`,
  });

  blocks.push(
    { t: "h", text: "4. Accounts and access" },
    {
      t: "ul",
      items: [
        "Use approved tools only through your company account, signed in with your work credentials and multi-factor authentication.",
        "Never use a personal AI account (free or paid) for company work or company information, even if it uses your work email address.",
        "Do not share AI accounts or let others use your session.",
        "When you leave the company, your access ends and conversations stay with the company account.",
      ],
    },
    { t: "h", text: "5. Information you may use" },
    {
      t: "table",
      head: ["Information", "Examples", "In approved tools"],
      rows: [
        ["Public", "Published website content, press releases, public documentation", "Allowed"],
        ["Internal", "Internal processes, drafts, meeting notes without sensitive details", allowed("internal") ? "Allowed" : "Not allowed"],
        [
          "Confidential",
          `Customer${msp ? " and client" : ""} information, contracts, pricing, financials, employee information`,
          allowed("confidential") ? "Allowed, with care; share only what the task needs" : "Not allowed",
        ],
        [
          "Regulated or secret",
          `${[has("healthcare") ? "Patient health information" : "", has("defense") ? "Controlled unclassified information" : "", has("finance") ? "Card and account numbers" : "", "government IDs", "passwords, keys and access tokens"].filter(Boolean).join(", ")}`,
          allowed("regulated") ? regulatedNote : "Not allowed",
        ],
      ],
    },
    { t: "p", text: "Passwords, API keys, access tokens and other credentials are never entered into any AI tool." },
    { t: "h", text: "6. Acceptable use" },
    {
      t: "ul",
      items: [
        "Drafting, summarizing, brainstorming, research and analysis within your role.",
        "Share only the minimum information the task needs; remove names and identifiers when they aren't necessary.",
        "Treat AI output as a first draft from a confident assistant that can be wrong.",
      ],
    },
    { t: "h", text: "7. Prohibited use" },
  );
  const prohibited = [
    "Entering information above the level allowed in section 5, or any information into a tool that isn't approved.",
    "Using AI to create content that is unlawful, harassing, discriminatory or deceptive.",
    "Using AI output as if it were verified fact, legal advice or a final decision without the review in section 9.",
  ];
  if (i.rules.likeness) prohibited.push("Creating or sharing images, audio or video that imitate a real person's face or voice without their written consent.");
  if (i.rules.peopleDecisions)
    prohibited.push("Using AI to make or materially decide hiring, firing, pay, discipline, credit or similar decisions about people without human review.");
  blocks.push({ t: "ul", items: prohibited });

  blocks.push({ t: "h", text: "8. Agents, connectors and extensions" });
  const agentRules: string[] = [];
  if (i.rules.agents)
    agentRules.push(
      "Do not connect an AI tool to email, files, calendars, chat or business systems, or create an AI agent, without written IT approval and a named owner.",
      "Agents may not send, delete, share or pay without a person approving the action.",
    );
  if (i.rules.extensions) agentRules.push("Do not install AI browser extensions, plug-ins or desktop AI apps without IT approval.");
  if (i.rules.notetakers)
    agentRules.push("AI meeting recorders and note-takers may be used only in meetings where every attendee has been told, and never in meetings about regulated information unless the tool is approved for it.");
  if (!agentRules.length) agentRules.push("Agents, connectors and extensions follow the same approval process as new tools in section 3.");
  blocks.push({ t: "ul", items: agentRules });

  blocks.push({ t: "h", text: "9. Human review and accuracy" });
  const review = [
    "A person checks AI output for accuracy, tone and confidentiality before it goes to a customer, partner, regulator or the public, or into a contract.",
    "You are responsible for anything you send or publish, whether or not AI helped write it.",
  ];
  if (i.rules.code) review.push("AI-generated code and scripts are reviewed and tested before they run in production or on client systems.");
  if (i.rules.disclose) review.push("When content that customers rely on is substantially generated by AI, say so where that's expected.");
  blocks.push({ t: "ul", items: review });

  if (msp) {
    blocks.push(
      { t: "h", text: "10. Client data" },
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
  }

  const ind: string[] = [];
  if (has("healthcare"))
    ind.push("Protected health information (PHI) may be used only in AI tools covered by a signed BAA, configured as the BAA requires. Web search features that send queries outside that coverage are turned off for PHI work.");
  if (has("defense"))
    ind.push("Controlled unclassified information (CUI) and export-controlled data may not be used with any AI tool unless IT confirms the tool is authorized for that data.");
  if (has("finance")) ind.push("Full card numbers, bank account numbers and authentication data are never entered into AI tools. Customer financial records follow the confidential rules in section 5.");
  if (has("legal")) ind.push("Privileged or confidential client matter information is used only in approved tools whose terms protect confidentiality, and never in a way that could waive privilege.");
  if (has("eu"))
    ind.push("Under Article 4 of the EU AI Act, staff who use AI systems receive AI-literacy training suited to their role and the tools they use, and completion is recorded.");
  let n = msp ? 11 : 10;
  if (ind.length) {
    blocks.push({ t: "h", text: `${n}. Industry requirements` }, { t: "ul", items: ind });
    n++;
  }

  blocks.push(
    { t: "h", text: `${n++}. Reporting mistakes and incidents` },
    {
      t: "p",
      text: `If you think information went into the wrong AI tool, an AI output caused harm, or an AI tool behaved unexpectedly, tell ${contact} right away, ideally within one hour. Fast reporting limits damage. Reporting your own mistake in good faith will not be held against you.`,
    },
    { t: "h", text: `${n++}. Training` },
    {
      t: "p",
      text: "Everyone completes security awareness training that covers safe AI use and AI-enabled attacks such as convincing phishing, cloned voices and deepfake video, when they join and at least once a year. Completion records are kept.",
    },
    { t: "h", text: `${n++}. Roles and review` },
    {
      t: "p",
      text: `${owner} owns this policy and reviews it at least ${i.review === "yearly" ? "once a year" : i.review}, and whenever a major AI tool or feature changes. Breaking this policy may lead to disciplinary action. Questions go to ${contact}.`,
    },
    { t: "h", text: "Acknowledgment" },
    { t: "p", text: `I have read and will follow the ${org} AI Acceptable Use Policy.` },
    { t: "sign" },
  );
  return blocks;
}

export function toMarkdown(blocks: Block[]): string {
  const out: string[] = [];
  for (const b of blocks) {
    if (b.t === "title") out.push(`# ${b.text}`);
    if (b.t === "meta") out.push(b.rows.map(([k, v]) => `**${k}:** ${v}`).join("  \n"));
    if (b.t === "h") out.push(`## ${b.text}`);
    if (b.t === "p") out.push(b.text);
    if (b.t === "ul") out.push(b.items.map((x) => `- ${x}`).join("\n"));
    if (b.t === "table") out.push([`| ${b.head.join(" | ")} |`, `|${b.head.map(() => " --- ").join("|")}|`, ...b.rows.map((r) => `| ${r.join(" | ")} |`)].join("\n"));
    if (b.t === "sign") out.push("Name: ______________________  \nSignature: ______________________  \nDate: ______________________");
  }
  out.push("---\n*Template from the free AI policy builder at dryruncyber.com/ai-security. Not legal advice; have it reviewed for your situation.*");
  return out.join("\n\n");
}

export async function toDocx(blocks: Block[]): Promise<Blob> {
  const d = await import("docx");
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = d;
  const kids: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [];
  const cell = (text: string, bold = false) =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, bold })] })],
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
    });
  for (const b of blocks) {
    if (b.t === "title") kids.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: b.text })] }));
    if (b.t === "meta")
      for (const [k, v] of b.rows) kids.push(new Paragraph({ children: [new TextRun({ text: `${k}: `, bold: true }), new TextRun({ text: v })] }));
    if (b.t === "h") kids.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280 }, children: [new TextRun({ text: b.text })] }));
    if (b.t === "p") kids.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: b.text })] }));
    if (b.t === "ul") for (const x of b.items) kids.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: x })] }));
    if (b.t === "table")
      kids.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "BBBBBB" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "BBBBBB" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "BBBBBB" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "BBBBBB" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" },
            insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" },
          },
          rows: [new TableRow({ tableHeader: true, children: b.head.map((h) => cell(h, true)) }), ...b.rows.map((r) => new TableRow({ children: r.map((c) => cell(c)) }))],
        }),
      );
    if (b.t === "sign")
      for (const l of ["Name", "Signature", "Date"])
        kids.push(new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: `${l}: ________________________________` })] }));
  }
  kids.push(
    new Paragraph({
      spacing: { before: 480 },
      children: [
        new TextRun({ text: "Template from the free AI policy builder at dryruncyber.com/ai-security. Not legal advice; have it reviewed for your situation.", italics: true, size: 16, color: "777777" }),
      ],
    }),
  );
  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ children: kids }],
  });
  return Packer.toBlob(doc);
}
