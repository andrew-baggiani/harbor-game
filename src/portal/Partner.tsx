// Partner (MSP) workspace: overview, client list, evidence.
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { api, type Activity, type Brand, type PartnerOrg } from "@/site/portal-api";
import type { OrgTab } from "@/portal/Org";
import { BillingCard } from "@/portal/Billing";
import {
  Arrow,
  Avatar,
  Bolt,
  Building,
  Download,
  Gauge,
  LiveDot,
  Mail,
  MiniRing,
  Panel,
  PanelHead,
  Pill,
  Plus,
  Search,
  Sheet,
  Shield,
  ago,
  btn,
  daysUntil,
  field,
  greeting,
  scenarioName,
  shortDate,
  useToast,
  type Tone,
} from "@/portal/ui";

export type PartnerSection = "overview" | "clients" | "evidence";

type Props = {
  partnerId: string;
  name: string;
  section: PartnerSection;
  orgs: PartnerOrg[] | null;
  reload: () => void;
  openOrg: (id: string, tab?: OrgTab) => void;
  goSection: (s: PartnerSection) => void;
};

export function PartnerHome(props: Props) {
  const [adding, setAdding] = useState(false);
  return (
    <>
      {props.section === "overview" ? <Overview {...props} onAdd={() => setAdding(true)} /> : null}
      {props.section === "clients" ? <Clients {...props} onAdd={() => setAdding(true)} /> : null}
      {props.section === "evidence" ? <Evidence {...props} /> : null}
      <AddClient open={adding} onClose={() => setAdding(false)} partnerId={props.partnerId} onCreated={(id) => { props.reload(); props.openOrg(id); }} />
    </>
  );
}

/* ------------------------------------------------------------------ status */

export function clientStatus(o: Pick<PartnerOrg, "learners" | "completion" | "inProgress" | "dueAt">): { tone: Tone; label: string } {
  if (!o.learners) return { tone: "dim", label: "Invite people" };
  if (o.completion >= 100) return { tone: "mint", label: "Complete" };
  const d = daysUntil(o.dueAt);
  if (d !== null && d < 0) return { tone: "alarm", label: "Overdue" };
  if (d !== null && d <= 3) return { tone: "amber", label: d === 0 ? "Due today" : `Due in ${d} day${d === 1 ? "" : "s"}` };
  if (o.inProgress > 0 || o.completion > 0) return { tone: "violet", label: "In progress" };
  return { tone: "dim", label: "Not started" };
}

function totals(orgs: PartnerOrg[]) {
  const t = orgs.reduce(
    (a, o) => ({
      learners: a.learners + o.learners,
      completed: a.completed + o.completed,
      inProgress: a.inProgress + o.inProgress,
      notStarted: a.notStarted + o.notStarted,
      scoreSum: a.scoreSum + (o.avgScore ?? 0) * (o.completed + o.inProgress),
      scored: a.scored + (o.avgScore !== null ? o.completed + o.inProgress : 0),
    }),
    { learners: 0, completed: 0, inProgress: 0, notStarted: 0, scoreSum: 0, scored: 0 },
  );
  return { ...t, completion: t.learners ? Math.round((t.completed / t.learners) * 100) : 0, avgScore: t.scored ? Math.round(t.scoreSum / t.scored) : null };
}

/* ------------------------------------------------------------------ overview */

function Overview({ partnerId, name, orgs, openOrg, goSection, onAdd }: Props & { onAdd: () => void }) {
  const t = useMemo(() => totals(orgs ?? []), [orgs]);
  const nudges = useMemo(() => buildNudges(orgs ?? []), [orgs]);
  const loading = !orgs;

  return (
    <div className="space-y-6">
      <section className="aurora px-6 py-7 sm:px-9 sm:py-9" aria-labelledby="hello">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 max-w-xl">
            <p className="text-site-mist">{greeting()},</p>
            <h1 id="hello" className="display mt-1 text-[clamp(2rem,4.4vw,3.2rem)] font-extrabold leading-[1.02]" style={{ fontStretch: "118%" }}>
              {name}
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-site-mist">
              {loading
                ? "Pulling in your clients…"
                : !orgs.length
                  ? "Add your first client and you'll see their readiness here as people play."
                  : t.learners
                    ? `${t.completed} of ${t.learners} people across ${orgs.length} client${orgs.length === 1 ? "" : "s"} have finished Monday.${t.inProgress ? ` ${t.inProgress} ${t.inProgress === 1 ? "is" : "are"} mid-shift.` : ""}`
                    : `${orgs.length} client${orgs.length === 1 ? "" : "s"} set up. Invite their people to get the week started.`}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className={btn.primary} onClick={onAdd}>
                <Plus /> Add a client
              </button>
              <button type="button" className={btn.ghost} onClick={() => goSection("evidence")}>
                <Shield /> Evidence
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6 self-center md:self-auto">
            <Gauge value={t.completion} size={196} sub="finished Monday" />
          </div>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Clients" value={orgs?.length ?? "–"} />
          <Stat label="People enrolled" value={orgs ? t.learners : "–"} />
          <Stat label="Playing now" value={orgs ? t.inProgress : "–"} live={t.inProgress > 0} />
          <Stat label="Average score" value={t.avgScore ?? "–"} sub={t.avgScore !== null ? "of 950" : undefined} />
        </dl>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          {nudges.length ? (
            <Panel>
              <PanelHead title="Worth a look" hint="Quick wins, sorted by what moves readiness most." />
              <ul className="mt-4 space-y-2">
                {nudges.slice(0, 4).map((n) => (
                  <li key={n.key}>
                    <button type="button" onClick={() => openOrg(n.orgId, n.tab)} className="group flex w-full items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-left transition hover:border-site-violet/40 hover:bg-site-violet/[0.06]">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${n.tone === "alarm" ? "bg-site-alarm/15 text-site-alarm" : n.tone === "amber" ? "bg-[#ffb547]/15 text-[#ffc56b]" : "bg-site-violet/15 text-site-violet-hi"}`}>
                        {n.icon === "mail" ? <Mail /> : <Bolt />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{n.title}</span>
                        <span className="block text-sm text-site-dim">{n.detail}</span>
                      </span>
                      <span className="hidden text-sm font-semibold text-site-violet-hi transition group-hover:translate-x-0.5 sm:flex sm:items-center sm:gap-1">
                        {n.cta} <Arrow size={16} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <section aria-labelledby="clients-h">
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 id="clients-h" className="text-xl font-bold">
                Clients
              </h2>
              {orgs && orgs.length > 6 ? (
                <button type="button" className={btn.quiet} onClick={() => goSection("clients")}>
                  See all {orgs.length} <Arrow size={16} />
                </button>
              ) : null}
            </div>
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[0, 1].map((i) => (
                  <div key={i} className="panel h-[188px] animate-pulse" />
                ))}
              </div>
            ) : !orgs.length ? (
              <EmptyClients onAdd={onAdd} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {orgs.slice(0, 6).map((o) => (
                  <ClientCard key={o.id} o={o} onOpen={() => openOrg(o.id)} />
                ))}
              </div>
            )}
          </section>
        </div>

        <ActivityFeed scope={`partner=${encodeURIComponent(partnerId)}`} showOrg onOpenOrg={(id) => openOrg(id)} />
      </div>
    </div>
  );
}

function Stat({ label, value, sub, live }: { label: string; value: number | string; sub?: string; live?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3.5 backdrop-blur-sm">
      <dt className="flex items-center gap-2 text-[13px] text-site-mist">
        {label}
        {live ? <span className="live-dot !h-1.5 !w-1.5" aria-label="live" /> : null}
      </dt>
      <dd className="num mt-1 text-[28px] font-extrabold leading-none">
        {value}
        {sub ? <span className="ml-1.5 text-sm font-semibold text-site-dim">{sub}</span> : null}
      </dd>
    </div>
  );
}

type Nudge = { key: string; orgId: string; tab: OrgTab; title: string; detail: string; cta: string; tone: Tone; icon: "mail" | "bolt"; weight: number };
function buildNudges(orgs: PartnerOrg[]): Nudge[] {
  const out: Nudge[] = [];
  for (const o of orgs) {
    const d = daysUntil(o.dueAt);
    if (!o.learners) {
      out.push({ key: `inv-${o.id}`, orgId: o.id, tab: "people", title: `Invite ${o.name}'s team`, detail: "Nobody's enrolled yet. Paste their emails and Monday goes out right away.", cta: "Invite", tone: "violet", icon: "mail", weight: 50 });
      continue;
    }
    if (o.notStarted > 0) {
      const urgent = d !== null && d <= 3;
      out.push({
        key: `nudge-${o.id}`,
        orgId: o.id,
        tab: "people",
        title: `${o.notStarted} ${o.notStarted === 1 ? "person hasn't" : "people haven't"} started at ${o.name}`,
        detail: urgent ? (d! < 0 ? "Their due date has passed. A reminder usually does it." : `Due ${shortDate(o.dueAt)}. Send a one-click reminder.`) : "Send a one-click reminder with a fresh link.",
        cta: "Remind",
        tone: urgent ? (d! < 0 ? "alarm" : "amber") : "violet",
        icon: "bolt",
        weight: (urgent ? 100 : 30) + o.notStarted,
      });
    }
  }
  return out.sort((a, b) => b.weight - a.weight);
}

export function ClientCard({ o, onOpen }: { o: PartnerOrg; onOpen: () => void }) {
  const s = clientStatus(o);
  const pct = (n: number) => (o.learners ? (n / o.learners) * 100 : 0);
  return (
    <button type="button" onClick={onOpen} className="panel lift group block w-full min-w-0 text-left">
      <div className="flex items-start gap-4">
        <MiniRing value={o.completion} size={56} />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[17px] font-bold leading-snug">{o.name}</h3>
          <div className="mt-1.5">
            <Pill tone={s.tone} dot>
              {s.label}
            </Pill>
          </div>
          <p className="mt-2 truncate text-sm text-site-dim">{o.domain ?? (o.learners ? `${o.learners} ${o.learners === 1 ? "person" : "people"}` : "No one enrolled yet")}</p>
        </div>
      </div>
      <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
        <span className="bg-site-mint" style={{ width: `${pct(o.completed)}%` }} />
        <span className="bg-site-violet-hi" style={{ width: `${pct(o.inProgress)}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13.5px] text-site-mist">
        <span>
          <b className="num text-site-paper">{o.completed}</b> finished · <b className="num text-site-paper">{o.inProgress}</b> playing · <b className="num text-site-paper">{o.notStarted}</b> to go
        </span>
        <span className="text-site-dim">{o.dueAt ? `Due ${shortDate(o.dueAt)}` : ago(o.lastActive)}</span>
      </div>
    </button>
  );
}

function EmptyClients({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="panel flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-site-violet/15 text-site-violet-hi">
        <Building size={30} />
      </span>
      <h3 className="mt-5 text-xl font-bold">Your first client takes about a minute</h3>
      <p className="mt-2 max-w-sm text-site-mist">Name them, paste their team's emails, and everyone gets a link to Monday's shift. Results show up here live.</p>
      <button type="button" className={`${btn.primary} mt-6`} onClick={onAdd}>
        <Plus /> Add a client
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ live activity */

export function ActivityFeed({ scope, showOrg, onOpenOrg, limit = 8 }: { scope: string; showOrg?: boolean; onOpenOrg?: (id: string) => void; limit?: number }) {
  const [items, setItems] = useState<Activity[] | null>(null);
  const seen = useRef<Set<string>>(new Set());
  const first = useRef(true);
  const load = useCallback(() => {
    api<{ items: Activity[] }>(`/api/activity?${scope}`)
      .then((d) => setItems(d.items))
      .catch(() => setItems((x) => x ?? []));
  }, [scope]);
  useEffect(() => {
    load();
    const t = window.setInterval(load, 12_000);
    return () => window.clearInterval(t);
  }, [load]);
  useEffect(() => {
    if (!items) return;
    const t = window.setTimeout(() => {
      items.forEach((i) => seen.current.add(i.id));
      first.current = false;
    }, 50);
    return () => window.clearTimeout(t);
  }, [items]);

  return (
    <Panel as="aside" className="xl:sticky xl:top-8">
      <PanelHead title="Live activity" action={<LiveDot />} />
      {!items ? (
        <p className="mt-4 text-sm text-site-dim">Loading…</p>
      ) : !items.length ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-site-dim">
          Decisions show up here the moment people make them.
        </div>
      ) : (
        <ol className="mt-4 space-y-1">
          {items.slice(0, limit).map((i) => {
            const fresh = !first.current && !seen.current.has(i.id);
            return (
              <li key={i.id} className={`flex gap-3 rounded-xl px-2 py-2.5 ${fresh ? "feed-in" : ""}`}>
                <Avatar name={i.who} size={32} />
                <div className="min-w-0 flex-1 text-[14px] leading-snug">
                  <p>
                    <b className="font-semibold">{i.who.includes("@") ? i.who.split("@")[0] : i.who}</b>{" "}
                    {i.kind === "shift_complete" ? (
                      <span className="text-site-mint">finished Monday</span>
                    ) : i.good ? (
                      <span className="text-site-mist">
                        made the right call on <span className="text-site-paper">{scenarioName(i.scenarioId)}</span>
                      </span>
                    ) : (
                      <span className="text-site-mist">
                        missed <span className="text-site-paper">{scenarioName(i.scenarioId)}</span>
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-site-dim">
                    {showOrg ? (
                      <>
                        <button type="button" className="hover:text-site-paper hover:underline" onClick={() => onOpenOrg?.(i.orgId)}>
                          {i.orgName}
                        </button>
                        {" · "}
                      </>
                    ) : null}
                    {ago(i.ts)}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${i.kind === "shift_complete" ? "bg-site-mint shadow-[0_0_10px_#19f5a5]" : i.good ? "bg-site-violet-hi" : "bg-site-alarm"}`}
                />
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ clients list */

function Clients({ orgs, openOrg, onAdd }: Props & { onAdd: () => void }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"name" | "completion" | "attention">("attention");
  const list = useMemo(() => {
    const xs = (orgs ?? []).filter((o) => `${o.name} ${o.domain ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()));
    if (sort === "name") return xs.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "completion") return xs.sort((a, b) => b.completion - a.completion);
    const rank = (o: PartnerOrg) => ({ alarm: 0, amber: 1, dim: o.learners ? 3 : 2, violet: 4, mint: 5 })[clientStatus(o).tone];
    return xs.sort((a, b) => rank(a) - rank(b) || a.completion - b.completion);
  }, [orgs, q, sort]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[clamp(1.9rem,3.6vw,2.6rem)] font-extrabold" style={{ fontStretch: "118%" }}>
            Clients
          </h1>
          <p className="mt-1 text-site-mist">Every organization you manage, with where they stand on Monday.</p>
        </div>
        <button type="button" className={btn.primary} onClick={onAdd}>
          <Plus /> Add a client
        </button>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search clients</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-site-dim" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or domain" className={`${field} pl-10`} />
        </label>
        <div role="radiogroup" aria-label="Sort" className="flex rounded-xl border border-white/10 bg-white/[0.02] p-1">
          {(
            [
              ["attention", "Needs attention"],
              ["completion", "Most complete"],
              ["name", "A–Z"],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={sort === k} onClick={() => setSort(k)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${sort === k ? "bg-white/10 text-site-paper" : "text-site-mist hover:text-site-paper"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6">
        {!orgs ? (
          <div className="panel h-40 animate-pulse" />
        ) : !orgs.length ? (
          <EmptyClients onAdd={onAdd} />
        ) : !list.length ? (
          <p className="text-site-dim">No clients match “{q}”.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {list.map((o) => (
              <ClientCard key={o.id} o={o} onOpen={() => openOrg(o.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ evidence */

const FRAMEWORKS = ["NIST SP 800-53", "NIST SP 800-171", "CMMC Level 2", "HIPAA Security Rule", "CIS Controls v8.1", "NIST CSF 2.0"];

function Evidence({ orgs, openOrg, partnerId }: Props) {
  return (
    <div>
      <h1 className="display text-[clamp(1.9rem,3.6vw,2.6rem)] font-extrabold" style={{ fontStretch: "118%" }}>
        Evidence
      </h1>
      <p className="mt-1 max-w-2xl text-site-mist">
        Every decision is logged with the controls it covers. Download a client's log when an auditor or insurer asks for proof of training.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {FRAMEWORKS.map((f) => (
          <Pill key={f} tone="violet">
            {f}
          </Pill>
        ))}
        <a href="/coverage" className="inline-flex items-center gap-1 px-2 text-sm font-semibold text-site-violet-hi hover:underline">
          See the control map <Arrow size={15} />
        </a>
      </div>
      <Panel className="mt-7 !p-0">
        {!orgs ? (
          <p className="p-6 text-site-dim">Loading…</p>
        ) : !orgs.length ? (
          <p className="p-6 text-site-dim">Add a client first. Their evidence builds up as people play.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {orgs.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6">
                <MiniRing value={o.completion} size={40} />
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openOrg(o.id, "plan")}>
                  <span className="block truncate font-semibold hover:underline">{o.name}</span>
                  <span className="block text-sm text-site-dim">
                    {o.completed} of {o.learners} finished · last activity {ago(o.lastActive).toLowerCase()}
                  </span>
                </button>
                <a
                  href={`/evidence?org=${encodeURIComponent(o.id)}`}
                  target="_blank"
                  rel="noopener"
                  className={`${btn.primary} !py-2 text-sm ${o.completed + o.inProgress ? "" : "pointer-events-none opacity-40"}`}
                  aria-disabled={!(o.completed + o.inProgress)}
                >
                  <Shield size={16} /> Evidence pack (PDF)
                </a>
                <a href={`/api/export?org=${encodeURIComponent(o.id)}`} className={`${btn.ghost} !py-2 text-sm ${o.completed + o.inProgress ? "" : "pointer-events-none opacity-40"}`} aria-disabled={!(o.completed + o.inProgress)}>
                  <Download size={16} /> Decision log (CSV)
                </a>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <BrandCard partnerId={partnerId} />
      <BillingCard partnerId={partnerId} />
    </div>
  );
}

/* ------------------------------------------------------------------ the MSP's own brand */

/** Your name and logo on your clients' learner screens, invite emails and evidence packs. */
function BrandCard({ partnerId }: { partnerId: string }) {
  const toast = useToast();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    api<{ brand: Brand | null }>(`/api/brand?partner=${encodeURIComponent(partnerId)}`)
      .then((r) => {
        setBrand(r.brand);
        setName(r.brand?.name ?? "");
        setLogo(r.brand?.logo ?? null);
      })
      .catch(() => {});
  }, [partnerId]);
  const pick = (f: File | undefined) => {
    setErr(null);
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return setErr("Use a PNG, JPEG or WebP.");
    if (f.size > 140_000) return setErr("Keep the logo under 140 KB.");
    const r = new FileReader();
    r.onload = () => setLogo(String(r.result));
    r.readAsDataURL(f);
  };
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ brand: Brand | null }>("/api/brand", { partnerId, name, logo });
      setBrand(r.brand);
      toast(r.brand ? "Saved. Your clients see your brand from now on." : "Brand removed.");
    } catch (error) {
      setErr((error as Error).message);
    }
    setBusy(false);
  }
  return (
    <Panel className="mt-7">
      <PanelHead title="Your brand" hint="Shown to your clients' people on their training page, in invite emails, and on every evidence pack." />
      <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="grid gap-1.5 text-sm">
          <span className="text-site-mist">Company name, as clients know you</span>
          <input className={field} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Northbridge IT" />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-site-mist">Logo (PNG, JPEG or WebP, under 140 KB)</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" className="text-sm text-site-mist file:mr-3 file:rounded-lg file:border-0 file:bg-white/[0.08] file:px-3 file:py-2 file:text-site-paper" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        <div className="flex items-center gap-4 sm:col-span-2">
          {logo ? <img src={logo} alt="Your logo" className="h-11 max-w-[190px] rounded-lg bg-white/95 object-contain px-2 py-1" /> : <span className="text-sm text-site-dim">No logo yet.</span>}
          {logo ? (
            <button type="button" className={btn.quiet} onClick={() => setLogo(null)}>
              Remove logo
            </button>
          ) : null}
          <button type="submit" disabled={busy} className={`${btn.primary} ml-auto`}>
            {busy ? "Saving…" : brand ? "Save changes" : "Save brand"}
          </button>
        </div>
        {err ? <p className="text-sm text-site-alarm sm:col-span-2">{err}</p> : null}
      </form>
    </Panel>
  );
}

/* ------------------------------------------------------------------ add client */

function AddClient({ open, onClose, partnerId, onCreated }: { open: boolean; onClose: () => void; partnerId: string; onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const toast = useToast();
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const o = await api<{ id: string; name: string }>("/api/partner", { action: "createOrg", partnerId, name, domain: domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "") });
      toast(`${o.name} is set up. Invite their people next.`);
      setName("");
      setDomain("");
      onClose();
      onCreated(o.id);
    } catch (error) {
      setErr((error as Error).message);
    }
    setBusy(false);
  }
  return (
    <Sheet open={open} onClose={onClose} title="Add a client" hint="You can invite their people on the next screen.">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="cn" className="block text-sm font-semibold">
            Client name
          </label>
          <input id="cn" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Freight" className={`mt-2 ${field}`} />
        </div>
        <div>
          <label htmlFor="cd" className="block text-sm font-semibold">
            Email domain <span className="font-normal text-site-dim">(optional)</span>
          </label>
          <input id="cd" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="acmefreight.com" className={`mt-2 ${field}`} />
          <p className="mt-2 text-sm text-site-dim">Helps you spot invites that go to the wrong address.</p>
        </div>
        {err ? (
          <p className="text-sm text-site-alarm" role="alert">
            {err}
          </p>
        ) : null}
        <button type="submit" disabled={busy || !name.trim()} className={`${btn.primary} w-full !py-3`}>
          {busy ? "Setting up…" : "Add client"}
        </button>
      </form>
    </Sheet>
  );
}
