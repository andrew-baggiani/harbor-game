import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { SiteFooter, SiteNav, SkipLink } from "@/site/SiteChrome";
import { api, type Board, type Me, type Membership, type OrgDetail, type PartnerOrg } from "@/site/portal-api";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Portal · Dry Run Cyber" },
      { name: "theme-color", content: "#101319" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico", sizes: "any" }],
  }),
  component: PortalPage,
});

type View = { kind: "partner"; id: string } | { kind: "org"; id: string; via?: string } | { kind: "learner"; id: string } | { kind: "setup" };

function viewsFor(ms: Membership[]): { label: string; view: View }[] {
  const out: { label: string; view: View }[] = [];
  for (const m of ms) {
    if (m.role === "partner_admin" && m.partnerId) out.push({ label: m.partnerName ?? "Partner", view: { kind: "partner", id: m.partnerId } });
    if (m.role === "org_admin" && m.orgId) out.push({ label: m.orgName ?? "Organization", view: { kind: "org", id: m.orgId } });
  }
  for (const m of ms) {
    if (m.role === "learner" && m.orgId && !out.some((o) => o.view.kind === "org" && o.view.id === m.orgId))
      out.push({ label: m.orgName ?? "My team", view: { kind: "learner", id: m.orgId } });
  }
  return out;
}

function PortalPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (pick?: View) => {
    try {
      const m = await api<Me>("/api/me");
      setMe(m);
      if (!m.user) return;
      const vs = viewsFor(m.memberships ?? []);
      setView(pick ?? vs[0]?.view ?? { kind: "setup" });
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (me && !me.user) window.location.replace("/login?next=/portal");
  }, [me]);

  const views = me?.memberships ? viewsFor(me.memberships) : [];

  return (
    <div className="site flex min-h-dvh flex-col overflow-x-clip">
      <SkipLink />
      <SiteNav />
      <main id="main" className="mx-auto w-full max-w-[1240px] flex-1 px-6 pb-24 pt-8 md:px-10 lg:pt-12">
        {error ? <p className="text-site-alarm">{error}</p> : null}
        {!me?.user || !view ? (
          <p className="text-site-mist" role="status">
            Loading…
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-site-rule pb-5">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold tracking-[0.18em] text-site-mint uppercase">Portal</p>
                <p className="mt-1 truncate text-sm text-site-dim">{me.user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {views.length > 1
                  ? views.map((v) => (
                      <button
                        key={`${v.view.kind}-${"id" in v.view ? v.view.id : ""}`}
                        type="button"
                        onClick={() => setView(v.view)}
                        className={`rounded-md border px-3 py-2 text-sm ${
                          view.kind === v.view.kind && "id" in view && "id" in v.view && view.id === v.view.id
                            ? "border-site-violet text-site-paper"
                            : "border-site-rule text-site-mist hover:text-site-paper"
                        }`}
                      >
                        {v.label}
                      </button>
                    ))
                  : null}
                <button
                  type="button"
                  className="rounded-md px-3 py-2 text-sm text-site-mist underline hover:text-site-paper"
                  onClick={async () => {
                    await api("/api/auth/signout", {});
                    window.location.href = "/login";
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
            {view.kind === "setup" ? <Setup onDone={(v) => load(v)} /> : null}
            {view.kind === "partner" ? (
              <PartnerView partnerId={view.id} name={views.find((v) => v.view.kind === "partner" && "id" in v.view && v.view.id === view.id)?.label ?? "Partner"} onOpen={(id) => setView({ kind: "org", id, via: view.id })} />
            ) : null}
            {view.kind === "org" ? <OrgView orgId={view.id} onBack={view.via ? () => setView({ kind: "partner", id: view.via as string }) : undefined} /> : null}
            {view.kind === "learner" ? <LearnerView orgId={view.id} membership={me.memberships?.find((m) => m.role === "learner" && m.orgId === view.id)} /> : null}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

/* ------------------------------------------------------------------ shared bits */

function H1({ children }: { children: ReactNode }) {
  return (
    <h1 className="display text-3xl font-extrabold leading-tight sm:text-4xl" style={{ fontStretch: "118%" }}>
      {children}
    </h1>
  );
}

function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-site-rule bg-site-ink-2 p-5 md:p-6 ${className}`}>
      <h2 className="text-sm font-semibold tracking-[0.12em] text-site-mist uppercase">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const input = "w-full rounded-md border border-site-rule bg-site-ink px-3 py-2.5 text-site-paper placeholder:text-site-dim focus:border-site-violet";
const primary = "rounded-md bg-site-violet px-4 py-2.5 font-semibold text-site-paper transition-colors hover:bg-site-violet-hi disabled:opacity-60";
const ghost = "rounded-md border border-site-rule px-4 py-2.5 text-site-mist hover:text-site-paper";

function Note({ text, tone = "ok" }: { text: string | null; tone?: "ok" | "err" }) {
  if (!text) return null;
  return (
    <p className={`mt-3 text-sm ${tone === "err" ? "text-site-alarm" : "text-site-mint"}`} role={tone === "err" ? "alert" : "status"}>
      {text}
    </p>
  );
}

function useBoard(orgId: string) {
  const [board, setBoard] = useState<Board | null>(null);
  useEffect(() => {
    let stop = false;
    let timer = 0;
    const tick = async () => {
      try {
        const b = await api<Board>(`/api/leaderboard?org=${encodeURIComponent(orgId)}`);
        if (!stop) setBoard(b);
      } catch {
        /* keep last */
      }
      if (!stop) timer = window.setTimeout(tick, 15_000);
    };
    void tick();
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, [orgId]);
  return board;
}

function BoardList({ board }: { board: Board | null }) {
  if (!board) return <p className="text-sm text-site-dim">Loading…</p>;
  if (!board.enabled) return <p className="text-sm text-site-dim">The leaderboard is turned off for this organization.</p>;
  if (!board.rows.length) return <p className="text-sm text-site-dim">No scores yet. Scores appear here as people finish decisions.</p>;
  return (
    <ol className="divide-y divide-site-rule">
      {board.rows.slice(0, 20).map((r) => (
        <li key={`${r.rank}-${r.name}`} className={`flex items-center justify-between gap-3 py-2.5 ${r.you ? "text-site-paper" : "text-site-mist"}`}>
          <span className="flex min-w-0 items-center gap-3">
            <span className="w-6 shrink-0 text-right font-semibold tabular-nums text-site-dim">{r.rank}</span>
            <span className="truncate">{r.name}</span>
            {r.you ? <span className="rounded bg-site-violet/20 px-1.5 py-0.5 text-[11px] font-semibold text-site-violet-hi">You</span> : null}
          </span>
          <span className="font-semibold tabular-nums">{r.score}</span>
        </li>
      ))}
    </ol>
  );
}

const fmtDate = (ms: number | null) => (ms ? new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—");

/* ------------------------------------------------------------------ first run */

function Setup({ onDone }: { onDone: (v: View) => void }) {
  const [kind, setKind] = useState<"org" | "partner">("org");
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (kind === "org") {
        const o = await api<{ id: string }>("/api/org", { action: "create", name, domain });
        onDone({ kind: "org", id: o.id });
      } else {
        const p = await api<{ id: string }>("/api/partner", { action: "create", name });
        onDone({ kind: "partner", id: p.id });
      }
    } catch (error) {
      setErr((error as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="mt-8 max-w-xl">
      <H1>Set up your workspace</H1>
      <p className="mt-3 leading-relaxed text-site-mist">You aren't part of an organization yet. If your admin invited you, open the link in their email instead.</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-semibold">I'm setting this up for</legend>
          {(
            [
              ["org", "My company", "Train your own team."],
              ["partner", "My MSP's clients", "Manage several client organizations."],
            ] as const
          ).map(([k, label, hint]) => (
            <label key={k} className={`cursor-pointer rounded-md border p-3 ${kind === k ? "border-site-violet" : "border-site-rule"}`}>
              <input type="radio" name="kind" className="sr-only" checked={kind === k} onChange={() => setKind(k)} />
              <span className="block font-semibold">{label}</span>
              <span className="block text-sm text-site-dim">{hint}</span>
            </label>
          ))}
        </fieldset>
        <div>
          <label htmlFor="name" className="block text-sm font-semibold">
            {kind === "org" ? "Organization name" : "MSP name"}
          </label>
          <input id="name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={`mt-2 ${input}`} />
        </div>
        {kind === "org" ? (
          <div>
            <label htmlFor="domain" className="block text-sm font-semibold">
              Email domain <span className="font-normal text-site-dim">(optional)</span>
            </label>
            <input id="domain" placeholder="company.com" value={domain} onChange={(e) => setDomain(e.target.value)} className={`mt-2 ${input}`} />
          </div>
        ) : null}
        <button type="submit" disabled={busy} className={primary}>
          {busy ? "Creating…" : "Create"}
        </button>
        <Note text={err} tone="err" />
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ partner admin */

function PartnerView({ partnerId, name, onOpen }: { partnerId: string; name: string; onOpen: (orgId: string) => void }) {
  const [orgs, setOrgs] = useState<PartnerOrg[] | null>(null);
  const [newName, setNewName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => {
    api<{ orgs: PartnerOrg[] }>(`/api/partner?partner=${encodeURIComponent(partnerId)}`)
      .then((d) => setOrgs(d.orgs))
      .catch((e) => setErr((e as Error).message));
  }, [partnerId]);
  useEffect(load, [load]);
  async function add(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api("/api/partner", { action: "createOrg", partnerId, name: newName });
      setNewName("");
      load();
    } catch (error) {
      setErr((error as Error).message);
    }
  }
  return (
    <div className="mt-8">
      <H1>{name}</H1>
      <p className="mt-2 text-site-mist">Your client organizations and how far along they are on Monday.</p>
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_minmax(0,360px)]">
        <Card title="Client organizations">
          {!orgs ? (
            <p className="text-sm text-site-dim">Loading…</p>
          ) : orgs.length === 0 ? (
            <p className="text-sm text-site-dim">No clients yet. Add your first one.</p>
          ) : (
            <ul className="divide-y divide-site-rule">
              {orgs.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => onOpen(o.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-4 py-3 text-left hover:text-site-paper">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{o.name}</span>
                      <span className="block text-sm text-site-dim">
                        {o.completed} of {o.learners} learners finished Monday
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-site-rule sm:block">
                        <span className="block h-full bg-site-mint" style={{ width: `${o.completion}%` }} />
                      </span>
                      <span className="w-12 text-right font-semibold tabular-nums">{o.completion}%</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Add a client">
          <form onSubmit={add} className="space-y-3">
            <label htmlFor="client" className="sr-only">
              Client name
            </label>
            <input id="client" required placeholder="Client name" value={newName} onChange={(e) => setNewName(e.target.value)} className={input} />
            <button type="submit" className={primary}>
              Add client
            </button>
            <Note text={err} tone="err" />
          </form>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ org admin */

function OrgView({ orgId, onBack }: { orgId: string; onBack?: () => void }) {
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const board = useBoard(orgId);
  const load = useCallback(() => {
    api<OrgDetail>(`/api/org?org=${encodeURIComponent(orgId)}`)
      .then(setDetail)
      .catch((e) => setErr((e as Error).message));
  }, [orgId]);
  useEffect(() => {
    load();
    const id = window.setInterval(load, 15_000);
    return () => window.clearInterval(id);
  }, [load]);

  if (err && !detail) return <p className="mt-8 text-site-alarm">{err}</p>;
  if (!detail) return <p className="mt-8 text-site-mist">Loading…</p>;
  const learners = detail.learners.filter((l) => l.role === "learner");
  const done = learners.filter((l) => l.monday === "Complete").length;

  return (
    <div className="mt-8">
      {onBack ? (
        <button type="button" onClick={onBack} className="mb-4 text-sm text-site-mist underline hover:text-site-paper">
          ← All clients
        </button>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <H1>{detail.org.name}</H1>
          <p className="mt-2 text-site-mist">
            {learners.length} learner{learners.length === 1 ? "" : "s"} · {done} finished Monday
            {detail.campaign?.dueAt ? ` · due ${fmtDate(detail.campaign.dueAt)}` : ""}
          </p>
        </div>
        <a href={`/api/export?org=${encodeURIComponent(orgId)}`} className={ghost}>
          Export decisions (CSV)
        </a>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_minmax(0,360px)]">
        <div className="min-w-0 space-y-6">
          <Card title="Learners">
            {learners.length === 0 ? (
              <p className="text-sm text-site-dim">No learners yet. Invite your team on the right.</p>
            ) : (
              <div className="-mx-5 overflow-x-auto md:-mx-6">
                <table className="w-full min-w-0 text-left text-sm">
                  <thead className="text-site-dim">
                    <tr className="border-b border-site-rule">
                      <th scope="col" className="px-5 py-2 font-normal md:px-6">Learner</th>
                      <th scope="col" className="py-2 font-normal">Monday</th>
                      <th scope="col" className="py-2 pr-5 text-right font-normal sm:pr-0">Score</th>
                      <th scope="col" className="hidden px-5 py-2 text-right font-normal sm:table-cell md:px-6">Last active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-site-rule">
                    {learners.map((l) => (
                      <tr key={l.userId}>
                        <td className="max-w-[9rem] px-5 py-3 sm:max-w-[16rem] md:px-6">
                          <span className="block truncate text-site-paper">{l.email}</span>
                          {l.displayName ? <span className="block truncate text-site-dim">{l.displayName}</span> : null}
                        </td>
                        <td className="py-3">
                          <Status value={l.monday} />
                        </td>
                        <td className="py-3 pr-5 text-right font-semibold tabular-nums sm:pr-0">{l.score}</td>
                        <td className="hidden px-5 py-3 text-right text-site-dim tabular-nums sm:table-cell md:px-6">{fmtDate(l.lastActive)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <Card title="Leaderboard">
            <BoardList board={board} />
            <p className="mt-4 text-xs leading-relaxed text-site-dim">
              Good decision +100, missed 0, +50 for finishing the shift. Best run counts. Learners without a display name show as “Teammate N”.
            </p>
          </Card>
        </div>
        <div className="space-y-6">
          <Invite orgId={orgId} onDone={load} />
          <Campaign orgId={orgId} dueAt={detail.campaign?.dueAt ?? null} hasCampaign={!!detail.campaign} onDone={load} />
          <Card title="Settings">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span>
                <span className="block font-semibold">Show the leaderboard</span>
                <span className="block text-sm text-site-dim">Learners see their team's ranking.</span>
              </span>
              <input
                type="checkbox"
                className="h-5 w-5 accent-[#8b2cf5]"
                checked={detail.org.leaderboardEnabled}
                onChange={async (e) => {
                  await api("/api/org", { action: "settings", orgId, leaderboardEnabled: e.target.checked });
                  load();
                }}
              />
            </label>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Status({ value }: { value: string }) {
  const tone = value === "Complete" ? "text-site-mint" : value === "In progress" ? "text-site-violet-hi" : "text-site-dim";
  return <span className={tone}>{value}</span>;
}

function Invite({ orgId, onDone }: { orgId: string; onDone: () => void }) {
  const [emails, setEmails] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [devLinks, setDevLinks] = useState<Record<string, string> | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const out = await api<{ invited: string[]; already: string[]; devLinks?: Record<string, string> }>("/api/org", { action: "invite", orgId, emails });
      setMsg(
        `Invited ${out.invited.length}.` + (out.already.length ? ` ${out.already.length} already on the team.` : ""),
      );
      setDevLinks(out.devLinks ?? null);
      setEmails("");
      onDone();
    } catch (error) {
      setErr((error as Error).message);
    }
    setBusy(false);
  }
  return (
    <Card title="Invite learners">
      <form onSubmit={submit} className="space-y-3">
        <label htmlFor="emails" className="block text-sm text-site-mist">
          Paste emails, one per line or comma separated, or load a CSV.
        </label>
        <textarea id="emails" rows={4} value={emails} onChange={(e) => setEmails(e.target.value)} className={input} placeholder={"alex@company.com\nsam@company.com"} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy || !emails.trim()} className={primary}>
            {busy ? "Sending…" : "Send invites"}
          </button>
          <label className={`${ghost} cursor-pointer text-sm`}>
            Load CSV
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setEmails((await f.text()).slice(0, 200_000));
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <Note text={msg} />
        <Note text={err} tone="err" />
        {devLinks ? (
          <ul className="space-y-1 text-xs text-site-dim">
            <li>Local only, no email provider set:</li>
            {Object.entries(devLinks).map(([email, link]) => (
              <li key={email} className="truncate">
                <a href={link} className="text-site-mint underline">
                  {email}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </form>
    </Card>
  );
}

function Campaign({ orgId, dueAt, hasCampaign, onDone }: { orgId: string; dueAt: number | null; hasCampaign: boolean; onDone: () => void }) {
  const [date, setDate] = useState(dueAt ? new Date(dueAt).toISOString().slice(0, 10) : "");
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => setDate(dueAt ? new Date(dueAt).toISOString().slice(0, 10) : ""), [dueAt]);
  return (
    <Card title="Assignment">
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          await api("/api/org", { action: "campaign", orgId, dueAt: date ? `${date}T23:59:00` : null });
          setMsg(hasCampaign ? "Saved." : "Monday assigned to every learner.");
          onDone();
        }}
      >
        <p className="font-semibold">Monday: First night</p>
        <p className="text-sm text-site-dim">About 20 minutes, nine decisions. The other days aren't out yet.</p>
        <label htmlFor="due" className="block text-sm text-site-mist">
          Due date <span className="text-site-dim">(optional)</span>
        </label>
        <input id="due" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${input} [color-scheme:dark]`} />
        <button type="submit" className={primary}>
          {hasCampaign ? "Save" : "Assign Monday"}
        </button>
        <Note text={msg} />
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ learner */

function LearnerView({ orgId, membership }: { orgId: string; membership?: Membership }) {
  const board = useBoard(orgId);
  const [name, setName] = useState(membership?.displayName ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="mt-8">
      <H1>{membership?.orgName ?? "Your team"}</H1>
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_minmax(0,360px)]">
        <Card title="Leaderboard">
          <BoardList board={board} />
        </Card>
        <div className="space-y-6">
          <Card title="Your shift">
            <p className="font-semibold">Monday: First night</p>
            <p className="mt-1 text-sm text-site-dim">About 20 minutes. Your decisions are recorded for your organization.</p>
            <a href="/play" className={`${primary} mt-4 inline-block`}>
              Start Monday
            </a>
          </Card>
          <Card title="Display name">
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                await api("/api/org", { action: "displayName", orgId, displayName: name });
                setMsg(name.trim() ? "Saved." : "You'll show as “Teammate N”.");
              }}
            >
              <label htmlFor="dn" className="block text-sm text-site-mist">
                How you appear on the leaderboard. Leave blank to stay anonymous.
              </label>
              <input id="dn" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} className={input} />
              <button type="submit" className={primary}>
                Save
              </button>
              <Note text={msg} />
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
