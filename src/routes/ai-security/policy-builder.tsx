import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Back, Copy, Download, Pill, ToastHost, btn, field, useToast } from "@/portal/ui";
import { SiteFooter, SiteNav, SkipLink } from "@/site/SiteChrome";
import {
  DEFAULT_POLICY,
  INDUSTRY_LABEL,
  TOOL_LABEL,
  TOOL_PLANS,
  buildPolicy,
  toDocx,
  toMarkdown,
  type Block,
  type DataClass,
  type Industry,
  type PolicyInput,
  type ToolKey,
} from "@/site/guide/policy";

export const Route = createFileRoute("/ai-security/policy-builder")({
  head: () => ({
    meta: [
      { title: "Free AI usage policy builder for MSPs and SMBs · Dry Run Cyber" },
      {
        name: "description",
        content:
          "Build an AI acceptable use policy in minutes: approved tools, data rules, agents and connectors, HIPAA, CMMC and EU AI Act clauses. Download as Word. Free, no sign-up.",
      },
      { name: "theme-color", content: "#101319" },
      { property: "og:title", content: "Free AI usage policy builder" },
      { property: "og:description", content: "An AI acceptable use policy for your MSP or your clients, ready to download as Word. Free, no sign-up." },
      { property: "og:image", content: "https://dryruncyber.com/og-ai-security.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico", sizes: "any" }],
  }),
  component: () => (
    <ToastHost>
      <Builder />
    </ToastHost>
  ),
});

const SAVE = "drc-policy-builder";

function Builder() {
  const [p, setP] = useState<PolicyInput>(DEFAULT_POLICY);
  const toast = useToast();
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SAVE);
      if (saved) setP({ ...DEFAULT_POLICY, ...JSON.parse(saved) });
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(SAVE, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  }, [p]);
  const blocks = useMemo(() => buildPolicy(p), [p]);
  const fileBase = `${(p.org.trim() || "company").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-ai-policy`;
  const set = <K extends keyof PolicyInput>(k: K, v: PolicyInput[K]) => setP((x) => ({ ...x, [k]: v }));

  async function downloadDocx() {
    const blob = await toDocx(blocks);
    save(blob, `${fileBase}.docx`);
    toast("Word document downloaded.");
  }
  function downloadMd() {
    save(new Blob([toMarkdown(blocks)], { type: "text/markdown" }), `${fileBase}.md`);
    toast("Markdown downloaded.");
  }
  async function copy() {
    await navigator.clipboard?.writeText(toMarkdown(blocks));
    toast("Policy copied as text.");
  }

  return (
    <div className="site min-h-dvh overflow-x-clip">
      <SkipLink />
      <SiteNav />
      <main id="main" className="mx-auto max-w-[1300px] px-6 pb-28 pt-8 md:px-10 lg:pt-12">
        <a href="/ai-security" className={`${btn.quiet} -ml-2`}>
          <Back size={16} /> The MSP field guide to securing AI
        </a>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex flex-wrap gap-2">
              <Pill tone="mint">Free</Pill>
              <Pill tone="dim">No sign-up</Pill>
              <Pill tone="dim">Saved in your browser</Pill>
            </div>
            <h1 className="display mt-4 text-[clamp(2.2rem,4.8vw,3.6rem)]">AI usage policy builder</h1>
            <p className="mt-4 max-w-[40rem] text-lg leading-relaxed text-site-mist">
              Answer a few questions and get a three-page AI acceptable use policy you can brand, sign and enforce. It's for a client or for your own MSP.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn.primary} onClick={downloadDocx}>
              <Download size={17} /> Download Word
            </button>
            <button type="button" className={btn.ghost} onClick={downloadMd}>
              Markdown
            </button>
            <button type="button" className={btn.ghost} onClick={copy}>
              <Copy size={16} /> Copy
            </button>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <Section n={1} title="Who is it for?">
              <div role="radiogroup" aria-label="Audience" className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["client", "A client", "Their staff and their data"],
                    ["msp", "My MSP", "Our techs and client data"],
                  ] as const
                ).map(([k, label, hint]) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={p.audience === k}
                    onClick={() => set("audience", k)}
                    className={`rounded-2xl border p-3.5 text-left transition ${p.audience === k ? "border-site-violet bg-site-violet/10" : "border-white/10 hover:border-white/20"}`}
                  >
                    <span className="block font-semibold">{label}</span>
                    <span className="mt-0.5 block text-sm text-site-dim">{hint}</span>
                  </button>
                ))}
              </div>
              <Field label="Company name">
                <input className={field} value={p.org} onChange={(e) => set("org", e.target.value)} placeholder={p.audience === "msp" ? "Northbridge IT" : "Acme Freight"} />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Effective date">
                  <input className={`${field} [color-scheme:dark]`} type="date" value={p.effective} onChange={(e) => set("effective", e.target.value)} />
                </Field>
                <Field label="Review">
                  <select className={field} value={p.review} onChange={(e) => set("review", e.target.value as PolicyInput["review"])}>
                    <option value="quarterly">Quarterly</option>
                    <option value="twice a year">Twice a year</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </Field>
              </div>
              <Field label="Policy owner">
                <input className={field} value={p.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Operations Manager" />
              </Field>
              <Field label="Questions and incident contact">
                <input className={field} value={p.contact} onChange={(e) => set("contact", e.target.value)} placeholder="it@company.com" />
              </Field>
            </Section>

            <Section n={2} title="Approved AI tools" hint="Pick the ones staff may use, and the plan. Business plans only; consumer accounts don't have the admin controls.">
              {(Object.keys(TOOL_LABEL) as ToolKey[]).map((k) => (
                <div key={k} className={`rounded-2xl border p-3.5 transition ${p.tools[k].on ? "border-site-violet/50 bg-site-violet/[0.06]" : "border-white/10"}`}>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#8b2cf5]"
                      checked={p.tools[k].on}
                      onChange={(e) => set("tools", { ...p.tools, [k]: { ...p.tools[k], on: e.target.checked } })}
                    />
                    <span className="font-semibold">{TOOL_LABEL[k]}</span>
                  </label>
                  {p.tools[k].on && TOOL_PLANS[k].length > 1 ? (
                    <select
                      aria-label={`${TOOL_LABEL[k]} plan`}
                      className={`${field} mt-3 !py-2 text-sm`}
                      value={p.tools[k].plan}
                      onChange={(e) => set("tools", { ...p.tools, [k]: { ...p.tools[k], plan: e.target.value } })}
                    >
                      {TOOL_PLANS[k].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  ) : null}
                </div>
              ))}
              <Field label="Other approved tool (optional)">
                <input className={field} value={p.other} onChange={(e) => set("other", e.target.value)} placeholder="e.g. Perplexity Enterprise Pro" />
              </Field>
            </Section>

            <Section n={3} title="Data rules" hint="The highest class of information staff may put into approved tools.">
              <div role="radiogroup" aria-label="Highest data class" className="grid gap-2">
                {(
                  [
                    ["internal", "Internal", "Drafts and processes; nothing about customers"],
                    ["confidential", "Confidential", "Customer info, contracts, financials. Recommended for business plans"],
                    ["regulated", "Regulated", "Only with a BAA or equivalent contract in place"],
                  ] as [DataClass, string, string][]
                ).map(([k, label, hint]) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={p.maxClass === k}
                    onClick={() => set("maxClass", k)}
                    className={`rounded-2xl border p-3.5 text-left transition ${p.maxClass === k ? "border-site-violet bg-site-violet/10" : "border-white/10 hover:border-white/20"}`}
                  >
                    <span className="block font-semibold">{label}</span>
                    <span className="mt-0.5 block text-sm text-site-dim">{hint}</span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-site-dim">Passwords, keys and tokens are always prohibited.</p>
            </Section>

            <Section n={4} title="Industry" hint="Adds the clauses each regime needs.">
              <div className="grid gap-2">
                {(Object.keys(INDUSTRY_LABEL) as Industry[]).map((k) => (
                  <label key={k} className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-1.5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#8b2cf5]"
                      checked={p.industries.includes(k)}
                      onChange={(e) => set("industries", e.target.checked ? [...p.industries, k] : p.industries.filter((x) => x !== k))}
                    />
                    {INDUSTRY_LABEL[k]}
                  </label>
                ))}
              </div>
            </Section>

            <Section n={5} title="Rules">
              {(
                [
                  ["agents", "Agents and connectors need IT approval, and a person approves actions"],
                  ["extensions", "AI browser extensions and desktop apps need IT approval"],
                  ["notetakers", "AI meeting note-takers only when everyone's been told"],
                  ["code", "AI-written code is reviewed and tested before it runs"],
                  ["disclose", "Disclose AI-generated content customers rely on"],
                  ["peopleDecisions", "No decisions about people made by AI without human review"],
                  ["likeness", "No imitating a real person's face or voice"],
                ] as [keyof PolicyInput["rules"], string][]
              ).map(([k, label]) => (
                <label key={k} className="flex cursor-pointer items-start gap-3 rounded-xl px-1 py-1.5">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[#8b2cf5]"
                    checked={p.rules[k]}
                    onChange={(e) => set("rules", { ...p.rules, [k]: e.target.checked })}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </Section>

            <p className="px-1 text-sm leading-relaxed text-site-dim">
              This is a starting template, not legal advice. Have it reviewed for your client's industry and location. Nothing you type leaves your browser.
            </p>
          </form>

          <div className="lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-3 pb-3">
              <p className="text-sm font-semibold text-site-mist">Live preview</p>
              <button type="button" className={btn.quiet} onClick={() => setP(DEFAULT_POLICY)}>
                Reset
              </button>
            </div>
            <Preview blocks={blocks} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Section({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="panel space-y-4 !p-5 sm:!p-6">
      <legend className="sr-only">{title}</legend>
      <div>
        <p className="flex items-center gap-2.5 text-[17px] font-bold">
          <span className="num grid h-7 w-7 place-items-center rounded-lg bg-site-violet/15 text-[13px] text-site-violet-hi">{n}</span>
          {title}
        </p>
        {hint ? <p className="mt-1.5 text-sm text-site-dim">{hint}</p> : null}
      </div>
      {children}
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

/** The policy as a page of paper, so it reads like the document they'll download. */
function Preview({ blocks }: { blocks: Block[] }) {
  return (
    <article
      aria-label="Policy preview"
      className="max-h-[78vh] overflow-y-auto rounded-2xl bg-[#fbfaf7] px-7 py-8 text-[14.5px] leading-relaxed text-[#1d1f24] shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)] ring-1 ring-black/5 sm:px-10 sm:py-10"
      style={{ fontFamily: "Calibri, 'Segoe UI', system-ui, sans-serif" }}
    >
      {blocks.map((b, i) => {
        if (b.t === "title") return <h2 key={i} className="text-[24px] font-bold leading-tight text-[#111]">{b.text}</h2>;
        if (b.t === "meta")
          return (
            <dl key={i} className="mt-3 grid grid-cols-[6rem_1fr] gap-y-0.5 border-b border-black/10 pb-4 text-[13.5px]">
              {b.rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="font-semibold text-[#555]">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          );
        if (b.t === "h") return <h3 key={i} className="mt-5 text-[16px] font-bold text-[#111]">{b.text}</h3>;
        if (b.t === "p") return <p key={i} className="mt-2">{b.text}</p>;
        if (b.t === "ul")
          return (
            <ul key={i} className="mt-2 list-disc space-y-1 pl-5">
              {b.items.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          );
        if (b.t === "table")
          return (
            <table key={i} className="mt-3 w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {b.head.map((h) => (
                    <th key={h} className="border border-black/15 bg-black/[0.04] px-2 py-1.5 text-left font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r) => (
                  <tr key={r[0]} className="align-top">
                    {r.map((c, j) => (
                      <td key={j} className="border border-black/15 px-2 py-1.5">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        if (b.t === "sign")
          return (
            <div key={i} className="mt-4 space-y-3 text-[#444]">
              {["Name", "Signature", "Date"].map((l) => (
                <p key={l}>
                  {l}: <span className="inline-block w-56 border-b border-black/30" />
                </p>
              ))}
            </div>
          );
        return null;
      })}
      <p className="mt-8 text-[11.5px] italic text-[#888]">Template from the free AI policy builder at dryruncyber.com/ai-security. Not legal advice.</p>
    </article>
  );
}
