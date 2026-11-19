import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Back, Check, Copy, Download, MiniRing, Pill, Plus, ToastHost, btn, field, useToast } from "@/portal/ui";
import { SiteFooter, SiteNav, SkipLink } from "@/site/SiteChrome";
import {
  CATALOG,
  CLASS_LABEL,
  DEFAULT_POLICY,
  GROUP_LABEL,
  HIGH_RISK_SUGGESTIONS,
  INDUSTRY_LABEL,
  PRESETS,
  buildPolicy,
  buildQuickCard,
  decodeConfig,
  encodeConfig,
  firstReview,
  mergeConfig,
  review,
  toDocx,
  toMarkdown,
  type Baa,
  type Block,
  type DataClass,
  type Group,
  type Industry,
  type PolicyInput,
} from "@/site/guide/policy";

export const Route = createFileRoute("/ai-security/policy-builder")({
  head: () => ({
    meta: [
      { title: "Free AI usage policy builder for MSPs and SMBs · Dry Run Cyber" },
      {
        name: "description",
        content:
          "Build a branded AI acceptable use policy in minutes: 26-tool catalog with per-tool data limits, HIPAA BAA checks, high-risk uses, HIPAA, CMMC and EU clauses, plus a one-page staff summary. Word, PDF or Markdown. Free, no sign-up.",
      },
      { name: "theme-color", content: "#101319" },
      { property: "og:title", content: "Free AI usage policy builder for MSPs" },
      { property: "og:description", content: "A branded AI acceptable use policy and a staff one-pager, ready as Word or PDF. Free, no sign-up, nothing leaves your browser." },
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

const SAVE = "drc-policy-builder-v2";
type Doc = "policy" | "card";

function Builder() {
  const [p, setP] = useState<PolicyInput>(DEFAULT_POLICY);
  const [doc, setDoc] = useState<Doc>("policy");
  const [done, setDone] = useState(false);
  const toast = useToast();
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1)).get("c");
    const shared = hash ? decodeConfig(hash) : null;
    if (shared) {
      setP(mergeConfig(shared));
      toast("Loaded a shared configuration.");
      return;
    }
    try {
      const saved = window.localStorage.getItem(SAVE) ?? window.localStorage.getItem("drc-policy-builder");
      if (saved) setP(mergeConfig(JSON.parse(saved)));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(SAVE, JSON.stringify(p));
    } catch {
      /* storage full or private mode: the session copy is enough */
    }
  }, [p]);

  const policy = useMemo(() => buildPolicy(p), [p]);
  const card = useMemo(() => buildQuickCard(p), [p]);
  const blocks = doc === "policy" ? policy : card;
  const check = useMemo(() => review(p), [p]);
  const base = `${(p.org.trim() || "company").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${doc === "policy" ? "ai-policy" : "ai-one-pager"}`;
  const set = <K extends keyof PolicyInput>(k: K, v: PolicyInput[K]) => setP((x) => ({ ...x, [k]: v }));

  async function word() {
    const logo = p.logo ? await imageSize(p.logo) : undefined;
    save(await toDocx(blocks, logo), `${base}.docx`);
    toast("Word document downloaded.");
    setDone(true);
  }
  function pdf() {
    document.body.dataset.print = "1";
    const clear = () => {
      delete document.body.dataset.print;
      window.removeEventListener("afterprint", clear);
    };
    window.addEventListener("afterprint", clear);
    window.print();
    setDone(true);
  }
  function md() {
    save(new Blob([toMarkdown(blocks)], { type: "text/markdown" }), `${base}.md`);
    toast("Markdown downloaded.");
  }
  async function share() {
    const url = `${window.location.origin}/ai-security/policy-builder#c=${encodeConfig(p)}`;
    await navigator.clipboard?.writeText(url);
    toast("Link copied. It carries your settings, not your logo.");
  }

  return (
    <div className="site min-h-dvh overflow-x-clip">
      <SkipLink />
      <div className="no-print">
        <SiteNav />
      </div>
      <main id="main" className="mx-auto max-w-[1320px] px-6 pb-28 pt-8 md:px-10 lg:pt-12">
        <div className="no-print">
          <a href="/ai-security" className={`${btn.quiet} -ml-2`}>
            <Back size={16} /> The MSP field guide to securing AI
          </a>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[44rem]">
              <div className="flex flex-wrap gap-2">
                <Pill tone="mint">Free</Pill>
                <Pill tone="dim">No sign-up</Pill>
                <Pill tone="dim">Nothing leaves your browser</Pill>
              </div>
              <h1 className="display mt-4 text-[clamp(2.2rem,4.8vw,3.6rem)]">AI usage policy builder</h1>
              <p className="mt-4 text-lg leading-relaxed text-site-mist">
                A branded AI acceptable use policy and a one-page summary for staff, for a client or for your own MSP. It checks your choices as you go,
                including whether patient data is only allowed in tools that offer a BAA.
              </p>
            </div>
            <label className="block w-full max-w-[300px]">
              <span className="mb-1.5 block text-sm font-semibold">Start from a template</span>
              <select
                className={field}
                value=""
                onChange={(e) => {
                  const pr = PRESETS.find((x) => x.id === e.target.value);
                  if (pr) {
                    setP((x) => pr.apply(x));
                    toast(`Applied “${pr.label}”. Adjust anything below.`);
                  }
                }}
              >
                <option value="">Choose a template…</option>
                {PRESETS.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
          <form className="no-print space-y-5" onSubmit={(e) => e.preventDefault()}>
            <Basics p={p} set={set} />
            <Tools p={p} set={set} />
            <Never p={p} set={set} />
            <HighRisk p={p} set={set} />
            <Section n={5} title="Industry" hint="Adds the clauses each regime needs, and the BAA check for healthcare.">
              <div className="grid gap-1">
                {(Object.keys(INDUSTRY_LABEL) as Industry[]).map((k) => (
                  <Tick
                    key={k}
                    checked={p.industries.includes(k)}
                    onChange={(v) => set("industries", v ? [...p.industries, k] : p.industries.filter((x) => x !== k))}
                    label={INDUSTRY_LABEL[k]}
                  />
                ))}
              </div>
            </Section>
            <Section n={6} title="Rules">
              {(
                [
                  ["agents", "Agents and connectors need IT approval, and a person approves actions"],
                  ["extensions", "AI browser extensions and desktop apps need IT approval"],
                  ["notetakers", "AI meeting note-takers only when everyone's been told"],
                  ["code", "AI-written code is reviewed and tested before it runs"],
                  ["disclose", "Disclose AI-generated content customers rely on"],
                  ["likeness", "No imitating a real person's face or voice"],
                ] as [keyof PolicyInput["rules"], string][]
              ).map(([k, label]) => (
                <Tick key={k} checked={p.rules[k]} onChange={(v) => set("rules", { ...p.rules, [k]: v })} label={label} />
              ))}
            </Section>
            <p className="px-1 text-sm leading-relaxed text-site-dim">
              A starting template, not legal advice. Have it reviewed for the client's industry and location. BAA notes reflect vendor documentation as of
              November 2026; confirm before relying on them.
            </p>
          </form>

          <div className="space-y-5 lg:sticky lg:top-24">
            <Strength score={check.score} findings={check.findings} />
            <div className="no-print flex flex-wrap items-center justify-between gap-3">
              <div role="tablist" aria-label="Document" className="flex rounded-xl border border-white/10 bg-white/[0.02] p-1">
                {(
                  [
                    ["policy", "Full policy"],
                    ["card", "Staff one-pager"],
                  ] as [Doc, string][]
                ).map(([k, l]) => (
                  <button key={k} role="tab" type="button" aria-selected={doc === k} onClick={() => setDoc(k)} className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${doc === k ? "bg-white/10 text-site-paper" : "text-site-mist hover:text-site-paper"}`}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={`${btn.primary} !py-2`} onClick={word}>
                  <Download size={16} /> Word
                </button>
                <button type="button" className={`${btn.ghost} !py-2`} onClick={pdf}>
                  PDF
                </button>
                <button type="button" className={`${btn.ghost} !py-2`} onClick={md}>
                  Markdown
                </button>
                <button type="button" className={`${btn.ghost} !py-2`} onClick={share} title="Copy a link that reopens these settings">
                  <Copy size={15} /> Share link
                </button>
              </div>
            </div>
            {done ? <NextSteps /> : null}
            <Preview blocks={blocks} logo={p.logo} />
            <div className="no-print flex justify-end">
              <button
                type="button"
                className={btn.quiet}
                onClick={() => {
                  setP(DEFAULT_POLICY);
                  setDone(false);
                  history.replaceState(null, "", window.location.pathname);
                }}
              >
                Start over
              </button>
            </div>
          </div>
        </div>
      </main>
      <div className="no-print">
        <SiteFooter />
      </div>
    </div>
  );
}

type Setter = <K extends keyof PolicyInput>(k: K, v: PolicyInput[K]) => void;

/* ------------------------------------------------------------------ 1. basics */

function Basics({ p, set }: { p: PolicyInput; set: Setter }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  return (
    <Section n={1} title="The basics">
      <div role="radiogroup" aria-label="Who is it for" className="grid grid-cols-2 gap-2">
        {(
          [
            ["client", "A client", "Their staff and their data"],
            ["msp", "My MSP", "Our techs and client data"],
          ] as const
        ).map(([k, label, hint]) => (
          <button key={k} type="button" role="radio" aria-checked={p.audience === k} onClick={() => set("audience", k)} className={`rounded-2xl border p-3.5 text-left transition ${p.audience === k ? "border-site-violet bg-site-violet/10" : "border-white/10 hover:border-white/20"}`}>
            <span className="block font-semibold">{label}</span>
            <span className="mt-0.5 block text-sm text-site-dim">{hint}</span>
          </button>
        ))}
      </div>
      <Field label="Organization name">
        <input className={field} value={p.org} onChange={(e) => set("org", e.target.value)} placeholder={p.audience === "msp" ? "Northbridge IT" : "Acme Freight"} />
      </Field>
      {p.audience === "client" ? (
        <Field label="Prepared by" hint="Your MSP's name, shown on the policy.">
          <input className={field} value={p.preparedBy} onChange={(e) => set("preparedBy", e.target.value)} placeholder="Northbridge IT" />
        </Field>
      ) : null}
      <div>
        <span className="mb-1.5 block text-sm font-semibold">Logo</span>
        <div className="flex items-center gap-3">
          {p.logo ? <img src={p.logo} alt="Logo preview" className="h-10 max-w-[140px] rounded-md bg-white object-contain p-1" /> : null}
          <button type="button" className={`${btn.ghost} !py-2 text-sm`} onClick={() => fileRef.current?.click()}>
            {p.logo ? "Replace" : "Upload logo"}
          </button>
          {p.logo ? (
            <button type="button" className={btn.quiet} onClick={() => set("logo", "")}>
              Remove
            </button>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                set("logo", await toPng(f));
              } catch {
                toast("That image couldn't be read. Try a PNG or JPG.", "err");
              }
            }}
          />
        </div>
        <p className="mt-1.5 text-sm text-site-dim">Your logo or the client's. It goes on the Word and PDF versions.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Effective date">
          <input className={`${field} [color-scheme:dark]`} type="date" value={p.effective} onChange={(e) => set("effective", e.target.value)} />
        </Field>
        <Field label="Review" hint={firstReview(p) ? `First review by ${firstReview(p)}` : "Quarterly is recommended."}>
          <select className={field} value={p.review} onChange={(e) => set("review", e.target.value as PolicyInput["review"])}>
            <option value="quarterly">Quarterly</option>
            <option value="twice a year">Twice a year</option>
            <option value="yearly">Yearly</option>
          </select>
        </Field>
      </div>
      <Field label="Policy owner">
        <input className={field} value={p.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Jordan Lee, Operations Manager" />
      </Field>
      <Field label="Report mistakes to">
        <input className={field} value={p.contact} onChange={(e) => set("contact", e.target.value)} placeholder="it@company.com or the help desk line" />
      </Field>
      <Field label="Escalation contact" hint="Optional. Who to call if the first contact can't be reached.">
        <input className={field} value={p.escalation} onChange={(e) => set("escalation", e.target.value)} placeholder="Northbridge IT security line, 555-0100" />
      </Field>
    </Section>
  );
}

/* ------------------------------------------------------------------ 2. tools */

const BAA_LABEL: Record<Baa, [string, "mint" | "violet" | "dim" | "alarm"]> = {
  yes: ["BAA available", "mint"],
  some: ["BAA on some plans", "violet"],
  no: ["No BAA", "alarm"],
  ask: ["BAA: ask vendor", "dim"],
};

function Tools({ p, set }: { p: PolicyInput; set: Setter }) {
  const [open, setOpen] = useState<Group>("assistants");
  const health = p.industries.includes("healthcare");
  const count = (g: Group) => CATALOG.filter((t) => t.group === g && p.tools[t.id]?.on).length;
  const levels: DataClass[] = ["internal", "confidential", "regulated"];
  return (
    <Section n={2} title="Approved tools" hint="Business accounts only. For each one, set the most sensitive information it may hold.">
      {(Object.keys(GROUP_LABEL) as Group[]).map((g) => (
        <div key={g} className="rounded-2xl border border-white/[0.08]">
          <button type="button" aria-expanded={open === g} onClick={() => setOpen(open === g ? ("" as Group) : g)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
            <span className="font-semibold">{GROUP_LABEL[g]}</span>
            <span className="flex items-center gap-2 text-sm text-site-dim">
              {count(g) ? <Pill tone="violet">{count(g)} on</Pill> : null}
              <span aria-hidden="true">{open === g ? "−" : "+"}</span>
            </span>
          </button>
          {open === g ? (
            <ul className="space-y-1.5 border-t border-white/[0.06] p-2">
              {CATALOG.filter((t) => t.group === g).map((t) => {
                const v = p.tools[t.id];
                const [baaText, baaTone] = BAA_LABEL[t.baa];
                return (
                  <li key={t.id} className={`rounded-xl p-2.5 transition ${v.on ? "bg-site-violet/[0.07] ring-1 ring-inset ring-site-violet/30" : ""}`}>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" className="mt-1 h-4 w-4 accent-[#8b2cf5]" checked={v.on} onChange={(e) => set("tools", { ...p.tools, [t.id]: { ...v, on: e.target.checked } })} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{t.name}</span>
                        {health || v.on ? (
                          <span className="mt-1 flex flex-wrap items-center gap-2">
                            <Pill tone={baaTone}>{baaText}</Pill>
                            {t.note && (v.on || health) ? <span className="text-[12.5px] text-site-dim">{t.note}</span> : null}
                          </span>
                        ) : null}
                      </span>
                    </label>
                    {v.on ? (
                      <div className="mt-2.5 grid grid-cols-1 gap-2 pl-7 sm:grid-cols-2">
                        <select aria-label={`${t.name} plan`} className={`${field} !py-2 text-sm`} value={v.plan} onChange={(e) => set("tools", { ...p.tools, [t.id]: { ...v, plan: e.target.value } })}>
                          {t.plans.map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                        </select>
                        <select aria-label={`${t.name} highest information`} className={`${field} !py-2 text-sm`} value={v.max} onChange={(e) => set("tools", { ...p.tools, [t.id]: { ...v, max: e.target.value as DataClass } })}>
                          {levels.map((l) => (
                            <option key={l} value={l}>
                              Up to {CLASS_LABEL[l]}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ))}
      <div className="space-y-2">
        {p.custom.map((c, k) => (
          <div key={k} className="flex gap-2">
            <input aria-label="Other tool name" className={`${field} !py-2`} value={c.name} placeholder="Tool name and plan" onChange={(e) => set("custom", p.custom.map((x, j) => (j === k ? { ...x, name: e.target.value } : x)))} />
            <select aria-label="Highest information" className={`${field} !w-auto !py-2 text-sm`} value={c.max} onChange={(e) => set("custom", p.custom.map((x, j) => (j === k ? { ...x, max: e.target.value as DataClass } : x)))}>
              {levels.map((l) => (
                <option key={l} value={l}>
                  {CLASS_LABEL[l]}
                </option>
              ))}
            </select>
            <RemoveBtn onClick={() => set("custom", p.custom.filter((_, j) => j !== k))} />
          </div>
        ))}
        <button type="button" className={btn.quiet} onClick={() => set("custom", [...p.custom, { name: "", max: "internal" }])}>
          <Plus size={16} /> Add a tool not listed
        </button>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ 3, 4 */

function Never({ p, set }: { p: PolicyInput; set: Setter }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    if (draft.trim()) set("never", [...p.never, draft.trim()]);
    setDraft("");
  };
  return (
    <Section n={3} title="Never share" hint="In the client's own words: their systems, their customers, their secrets. Passwords and keys are always included.">
      <div className="flex gap-2">
        <input
          aria-label="Add a never-share item"
          className={`${field} !py-2`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="e.g. Customer ship manifests and tracking numbers"
        />
        <button type="button" className={`${btn.ghost} !py-2`} onClick={add}>
          Add
        </button>
      </div>
      {p.never.length ? (
        <ul className="space-y-1.5">
          {p.never.map((x, k) => (
            <li key={k} className="flex items-start gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-[15px]">
              <span className="flex-1">{x}</span>
              <RemoveBtn onClick={() => set("never", p.never.filter((_, j) => j !== k))} />
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}

function HighRisk({ p, set }: { p: PolicyInput; set: Setter }) {
  const unused = HIGH_RISK_SUGGESTIONS.filter((s) => !p.highRisk.some((h) => h.use === s));
  return (
    <Section n={4} title="High-risk uses" hint="AI can help, but a named person decides. Pick from the suggestions or write your own.">
      {unused.length ? (
        <div className="flex flex-wrap gap-1.5">
          {unused.map((s) => (
            <button key={s} type="button" onClick={() => set("highRisk", [...p.highRisk, { use: s, owner: "" }])} className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-site-mist ring-1 ring-inset ring-white/12 transition hover:text-site-paper hover:ring-site-violet/50">
              + {s}
            </button>
          ))}
        </div>
      ) : null}
      {p.highRisk.map((h, k) => (
        <div key={k} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl bg-white/[0.03] p-2.5 sm:grid-cols-[1fr_180px_auto]">
          <input aria-label="High-risk use" className={`${field} !py-2 text-sm`} value={h.use} onChange={(e) => set("highRisk", p.highRisk.map((x, j) => (j === k ? { ...x, use: e.target.value } : x)))} />
          <input aria-label="Responsible person" className={`${field} col-start-1 !py-2 text-sm sm:col-start-auto`} value={h.owner} placeholder="Responsible person" onChange={(e) => set("highRisk", p.highRisk.map((x, j) => (j === k ? { ...x, owner: e.target.value } : x)))} />
          <span className="row-start-1 sm:row-start-auto">
            <RemoveBtn onClick={() => set("highRisk", p.highRisk.filter((_, j) => j !== k))} />
          </span>
        </div>
      ))}
      <button type="button" className={btn.quiet} onClick={() => set("highRisk", [...p.highRisk, { use: "", owner: "" }])}>
        <Plus size={16} /> Add your own
      </button>
    </Section>
  );
}

/* ------------------------------------------------------------------ strength, next steps */

function Strength({ score, findings }: { score: number; findings: ReturnType<typeof review>["findings"] }) {
  const [all, setAll] = useState(false);
  const issues = findings.filter((f) => f.level !== "good");
  const shown = all ? findings : issues.slice(0, 3);
  return (
    <section className="no-print panel !p-5" aria-label="Policy check">
      <div className="flex items-center gap-4">
        <MiniRing value={score} size={56} />
        <div className="min-w-0 flex-1">
          <p className="font-bold">Policy strength</p>
          <p className="text-sm text-site-dim">{issues.length ? `${issues.length} thing${issues.length === 1 ? "" : "s"} to tighten` : "Nothing to fix. Ready to review with the client."}</p>
        </div>
        <button type="button" className={btn.quiet} onClick={() => setAll((x) => !x)}>
          {all ? "Show issues" : "Show all"}
        </button>
      </div>
      {shown.length ? (
        <ul className="mt-4 space-y-2">
          {shown.map((f, k) => (
            <li key={k} className="flex gap-2.5 text-[14.5px] leading-snug">
              <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${f.level === "good" ? "bg-site-mint" : f.level === "risk" ? "bg-site-alarm" : "bg-[#ffb547]"}`} />
              <span className={f.level === "good" ? "text-site-mist" : "text-site-paper/90"}>{f.text}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function NextSteps() {
  const steps = [
    "Fill any [bracketed] placeholders and adjust wording to the client's voice.",
    "Confirm each approved tool's plan and BAA with the vendor.",
    "Have legal, HR or compliance review it.",
    "Configure each tool's admin settings to match (see the guide's platform playbooks).",
    "Collect signed acknowledgments, and hand out the staff one-pager.",
    "Train everyone on it: the AI shift puts the policy's rules in front of each person as decisions, and keeps the record.",
  ];
  return (
    <div className="no-print panel !p-5">
      <p className="font-bold">Next steps</p>
      <ol className="mt-3 space-y-2">
        {steps.map((s, k) => (
          <li key={k} className="flex gap-3 text-[14.5px]">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-site-mint/15 text-site-mint">
              <Check size={12} />
            </span>
            {s}
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href="/week/ai" className={`${btn.primary} !py-2 text-sm`}>
          See the AI shift
        </a>
        <a href="/ai-security#platforms" className={`${btn.ghost} !py-2 text-sm`}>
          Open the platform playbooks
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ bits */

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

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-sm text-site-dim">{hint}</span> : null}
    </label>
  );
}

function Tick({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl px-1 py-1.5">
      <input type="checkbox" className="mt-1 h-4 w-4 accent-[#8b2cf5]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Remove" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-site-dim transition hover:bg-white/[0.06] hover:text-site-paper">
      ×
    </button>
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

/** Any image file to a PNG data URL, at most 600px wide, so it fits in Word and in browser storage. */
function toPng(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 600 / img.naturalWidth);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")?.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}
function imageSize(url: string): Promise<{ url: string; w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ url, w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ url, w: 3, h: 1 });
    img.src = url;
  });
}

/** The document as a page of paper. This is also what prints to PDF. */
function Preview({ blocks, logo }: { blocks: Block[]; logo: string }) {
  return (
    <article
      aria-label="Document preview"
      className="print-doc max-h-[72vh] overflow-y-auto rounded-2xl bg-[#fbfaf7] px-7 py-8 text-[14.5px] leading-relaxed text-[#1d1f24] shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)] ring-1 ring-black/5 sm:px-10 sm:py-10"
      style={{ fontFamily: "Calibri, 'Segoe UI', system-ui, sans-serif" }}
    >
      {logo ? <img src={logo} alt="" className="mb-5 h-12 max-w-[220px] object-contain object-left" /> : null}
      {blocks.map((b, i) => {
        if (b.t === "title")
          return (
            <header key={i}>
              {b.sub ? <p className="text-[15px] font-bold text-[#6b4fbb]">{b.sub}</p> : null}
              <h2 className="text-[24px] font-bold leading-tight text-[#111]">{b.text}</h2>
            </header>
          );
        if (b.t === "meta")
          return (
            <dl key={i} className="mt-3 grid grid-cols-[6.5rem_1fr] gap-y-0.5 border-b border-black/10 pb-4 text-[13.5px]">
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
              {b.items.map((x, j) => (
                <li key={j}>{x}</li>
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
                {b.rows.map((r, j) => (
                  <tr key={j} className="align-top">
                    {r.map((c, k) => (
                      <td key={k} className="border border-black/15 px-2 py-1.5">
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
