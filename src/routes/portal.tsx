import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type Me, type Membership, type PartnerOrg } from "@/site/portal-api";
import { PartnerHome, type PartnerSection } from "@/portal/Partner";
import { OrgView, type OrgTab } from "@/portal/Org";
import { LearnerHome, Setup } from "@/portal/Learner";
import { Avatar, Building, Home, MiniRing, Out, Play, Shield, ToastHost, Menu, btn, Users, Trophy, Calendar, Gear } from "@/portal/ui";

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

/* ------------------------------------------------------------------ where we are (kept in the URL so Back works) */

export type View =
  | { kind: "partner"; id: string; section: PartnerSection }
  | { kind: "org"; id: string; tab: OrgTab }
  | { kind: "learner"; id: string }
  | { kind: "setup" };

function parse(search: string): View | null {
  const q = new URLSearchParams(search);
  if (q.get("p")) return { kind: "partner", id: q.get("p") as string, section: (q.get("s") as PartnerSection) || "overview" };
  if (q.get("o")) return { kind: "org", id: q.get("o") as string, tab: (q.get("t") as OrgTab) || "people" };
  if (q.get("l")) return { kind: "learner", id: q.get("l") as string };
  return null;
}
function serialize(v: View): string {
  if (v.kind === "partner") return `?p=${encodeURIComponent(v.id)}${v.section !== "overview" ? `&s=${v.section}` : ""}`;
  if (v.kind === "org") return `?o=${encodeURIComponent(v.id)}${v.tab !== "people" ? `&t=${v.tab}` : ""}`;
  if (v.kind === "learner") return `?l=${encodeURIComponent(v.id)}`;
  return "";
}

function defaultView(ms: Membership[]): View {
  const p = ms.find((m) => m.role === "partner_admin" && m.partnerId);
  if (p) return { kind: "partner", id: p.partnerId as string, section: "overview" };
  const o = ms.find((m) => m.role === "org_admin" && m.orgId);
  if (o) return { kind: "org", id: o.orgId as string, tab: "people" };
  const l = ms.find((m) => m.role === "learner" && m.orgId);
  if (l) return { kind: "learner", id: l.orgId as string };
  return { kind: "setup" };
}

/* ------------------------------------------------------------------ page */

function PortalPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [view, setViewState] = useState<View | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [orgs, setOrgs] = useState<PartnerOrg[] | null>(null);

  const go = useCallback((v: View, replace = false) => {
    setViewState(v);
    setDrawer(false);
    const url = `/portal${serialize(v)}`;
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
    window.scrollTo({ top: 0 });
  }, []);

  const load = useCallback(
    async (pick?: View) => {
      const m = await api<Me>("/api/me").catch(() => ({ user: null }) as Me);
      setMe(m);
      if (!m.user) return;
      go(pick ?? parse(window.location.search) ?? defaultView(m.memberships ?? []), true);
    },
    [go],
  );
  useEffect(() => {
    void load();
    const onPop = () => {
      const v = parse(window.location.search);
      if (v) setViewState(v);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [load]);
  useEffect(() => {
    if (me && !me.user) window.location.replace("/login?next=/portal");
  }, [me]);

  const ms = me?.memberships ?? [];
  const partners = ms.filter((m) => m.role === "partner_admin" && m.partnerId);
  // Partner context: the partner being viewed, or the partner that owns the org being viewed.
  const [orgPartner, setOrgPartner] = useState<string | null>(null);
  const partnerId = view?.kind === "partner" ? view.id : view?.kind === "org" ? orgPartner : null;
  const partner = partners.find((p) => p.partnerId === partnerId) ?? null;

  const reloadOrgs = useCallback(() => {
    if (!partnerId || !partner) return setOrgs(null);
    api<{ orgs: PartnerOrg[] }>(`/api/partner?partner=${encodeURIComponent(partnerId)}`)
      .then((d) => setOrgs(d.orgs))
      .catch(() => setOrgs([]));
  }, [partnerId, partner]);
  useEffect(() => {
    reloadOrgs();
    if (!partnerId) return;
    const t = window.setInterval(reloadOrgs, 20_000);
    return () => window.clearInterval(t);
  }, [reloadOrgs, partnerId]);

  if (!me?.user || !view) {
    return (
      <div className="portal grid min-h-dvh place-items-center">
        <div className="flex items-center gap-3 text-site-mist" role="status">
          <span className="live-dot" aria-hidden="true" /> Opening your portal…
        </div>
      </div>
    );
  }

  const orgAdminOf = ms.filter((m) => m.role === "org_admin" && m.orgId);
  const learnerOf = ms.filter((m) => m.role === "learner" && m.orgId && !orgAdminOf.some((o) => o.orgId === m.orgId));

  const nav = (
    <SideNav
      email={me.user.email}
      view={view}
      go={go}
      partners={partners}
      partner={partner}
      orgs={orgs}
      orgAdminOf={orgAdminOf}
      learnerOf={learnerOf}
    />
  );

  return (
    <ToastHost>
      <div className="portal min-h-dvh lg:grid lg:grid-cols-[272px_1fr]">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-site-violet focus:px-3 focus:py-2">
          Skip to content
        </a>
        <aside className="hidden border-r border-white/[0.06] bg-[#0d1016] lg:block">
          <div className="sticky top-0 h-dvh">{nav}</div>
        </aside>

        {/* phone / tablet bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.06] bg-[#0d1016]/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <a href="/" aria-label="Dry Run Cyber home">
            <img src="/brand/logo-horizontal.svg" alt="Dry Run Cyber" className="h-8 w-auto" />
          </a>
          <button type="button" className={btn.ghost + " !px-3 !py-2"} onClick={() => setDrawer(true)} aria-label="Open menu" aria-expanded={drawer}>
            <Menu />
          </button>
        </div>
        {drawer ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" aria-label="Close menu" className="sheet-scrim absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
            <div className="sheet absolute inset-y-0 left-0 w-[86%] max-w-[320px] border-r border-white/10 bg-[#0d1016]">{nav}</div>
          </div>
        ) : null}

        <main id="main" className="min-w-0 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          <div className="mx-auto max-w-[1180px]">
            {view.kind === "setup" ? <Setup onDone={(v) => load(v)} /> : null}
            {view.kind === "partner" && partner ? (
              <PartnerHome
                partnerId={view.id}
                name={partner.partnerName ?? "Your MSP"}
                section={view.section}
                orgs={orgs}
                reload={reloadOrgs}
                openOrg={(id, tab = "people") => go({ kind: "org", id, tab })}
                goSection={(s) => go({ kind: "partner", id: view.id, section: s })}
              />
            ) : null}
            {view.kind === "partner" && !partner ? <NoAccess /> : null}
            {view.kind === "org" ? (
              <OrgView
                key={view.id}
                orgId={view.id}
                tab={view.tab}
                setTab={(t) => go({ kind: "org", id: view.id, tab: t }, true)}
                onPartner={(pid) => setOrgPartner(pid && partners.some((p) => p.partnerId === pid) ? pid : null)}
                backTo={partner ? { label: partner.partnerName ?? "All clients", go: () => go({ kind: "partner", id: partner.partnerId as string, section: "clients" }) } : null}
                onChanged={reloadOrgs}
              />
            ) : null}
            {view.kind === "learner" ? <LearnerHome orgId={view.id} membership={ms.find((m) => m.role === "learner" && m.orgId === view.id)} brand={me.brand ?? null} /> : null}
          </div>
        </main>
      </div>
    </ToastHost>
  );
}

function NoAccess() {
  return (
    <div className="panel max-w-lg">
      <h1 className="text-xl font-bold">This workspace isn't yours</h1>
      <p className="mt-2 text-site-mist">You don't have access to it. Pick one of your workspaces from the menu.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ sidebar */

function SideNav({
  email,
  view,
  go,
  partners,
  partner,
  orgs,
  orgAdminOf,
  learnerOf,
}: {
  email: string;
  view: View;
  go: (v: View) => void;
  partners: Membership[];
  partner: Membership | null;
  orgs: PartnerOrg[] | null;
  orgAdminOf: Membership[];
  learnerOf: Membership[];
}) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => (orgs ?? []).filter((o) => o.name.toLowerCase().includes(q.trim().toLowerCase())), [orgs, q]);
  const directOrg = view.kind === "org" && !partner ? orgAdminOf.find((o) => o.orgId === view.id) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6">
        <a href="/" aria-label="Dry Run Cyber home" className="inline-block">
          <img src="/brand/logo-horizontal.svg" alt="Dry Run Cyber" className="h-9 w-auto" />
        </a>
      </div>

      <nav aria-label="Portal" className="flex-1 overflow-y-auto px-3 pb-4">
        {partner ? (
          <>
            <WorkspaceCard name={partner.partnerName ?? "Your MSP"} kind="Partner workspace" />
            <NavItem icon={<Home />} label="Overview" current={view.kind === "partner" && view.section === "overview"} onClick={() => go({ kind: "partner", id: partner.partnerId as string, section: "overview" })} />
            <NavItem icon={<Building />} label="Clients" badge={orgs ? String(orgs.length) : undefined} current={view.kind === "partner" && view.section === "clients"} onClick={() => go({ kind: "partner", id: partner.partnerId as string, section: "clients" })} />
            <NavItem icon={<Shield />} label="Evidence" current={view.kind === "partner" && view.section === "evidence"} onClick={() => go({ kind: "partner", id: partner.partnerId as string, section: "evidence" })} />

            <div className="mt-6 px-2">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-site-dim">Your clients</h2>
              </div>
              {orgs && orgs.length > 5 ? (
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a client" aria-label="Find a client" className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm placeholder:text-site-dim" />
              ) : null}
            </div>
            <ul className="mt-2 space-y-0.5">
              {shown.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    aria-current={view.kind === "org" && view.id === o.id ? "page" : undefined}
                    onClick={() => go({ kind: "org", id: o.id, tab: "people" })}
                    className="nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[14.5px] text-site-mist transition hover:bg-white/[0.05] hover:text-site-paper"
                  >
                    <MiniRing value={o.completion} size={28} />
                    <span className="min-w-0 flex-1 truncate">{o.name}</span>
                    {o.inProgress > 0 ? <span className="live-dot !h-1.5 !w-1.5" title="Someone is playing now" /> : null}
                  </button>
                </li>
              ))}
              {orgs && !orgs.length ? <li className="px-3 py-2 text-sm text-site-dim">No clients yet.</li> : null}
            </ul>
          </>
        ) : null}

        {!partner && (directOrg || (view.kind === "org" && orgAdminOf.length)) ? (
          <>
            <WorkspaceCard name={directOrg?.orgName ?? "Your organization"} kind="Organization" />
            {(
              [
                ["people", "People", <Users key="i" />],
                ["leaderboard", "Leaderboard", <Trophy key="i" />],
                ["plan", "Training plan", <Calendar key="i" />],
                ["settings", "Settings", <Gear key="i" />],
              ] as const
            ).map(([t, label, icon]) => (
              <NavItem key={t} icon={icon} label={label} current={view.kind === "org" && view.tab === t} onClick={() => view.kind === "org" && go({ kind: "org", id: view.id, tab: t })} />
            ))}
          </>
        ) : null}

        {view.kind === "learner" ? <WorkspaceCard name={learnerOf.find((l) => l.orgId === view.id)?.orgName ?? "Your team"} kind="Your training" /> : null}

        {/* other places this person belongs */}
        {partners.length + orgAdminOf.length + learnerOf.length > 1 ? (
          <div className="mt-6">
            <h2 className="px-5 text-[13px] font-semibold text-site-dim">Switch workspace</h2>
            <ul className="mt-2 space-y-0.5">
              {partners.map((p) => (
                <li key={p.partnerId}>
                  <NavItem small icon={<Avatar name={p.partnerName ?? "P"} size={22} />} label={p.partnerName ?? "Partner"} current={false} onClick={() => go({ kind: "partner", id: p.partnerId as string, section: "overview" })} />
                </li>
              ))}
              {orgAdminOf.map((o) => (
                <li key={o.orgId}>
                  <NavItem small icon={<Avatar name={o.orgName ?? "O"} size={22} />} label={o.orgName ?? "Organization"} current={false} onClick={() => go({ kind: "org", id: o.orgId as string, tab: "people" })} />
                </li>
              ))}
              {learnerOf.map((o) => (
                <li key={o.orgId}>
                  <NavItem small icon={<Avatar name={o.orgName ?? "T"} size={22} />} label={`${o.orgName ?? "Team"} (training)`} current={false} onClick={() => go({ kind: "learner", id: o.orgId as string })} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <a href="/play" className="nav-item mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] text-site-mist transition hover:bg-white/[0.05] hover:text-site-paper">
          <Play size={16} /> Play Monday
        </a>
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <Avatar name={email} size={32} />
          <span className="min-w-0 flex-1 truncate text-sm text-site-mist" title={email}>
            {email}
          </span>
          <button
            type="button"
            className={btn.quiet + " !px-2"}
            aria-label="Sign out"
            title="Sign out"
            onClick={async () => {
              await api("/api/auth/signout", {});
              window.location.href = "/login";
            }}
          >
            <Out size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkspaceCard({ name, kind }: { name: string; kind: string }) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-site-violet/15 to-transparent px-3 py-3">
      <Avatar name={name} size={38} />
      <div className="min-w-0">
        <div className="truncate font-bold">{name}</div>
        <div className="text-[12.5px] text-site-dim">{kind}</div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, current, onClick, badge, small }: { icon: ReactNode; label: string; current: boolean; onClick: () => void; badge?: string; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={current ? "page" : undefined}
      className={`nav-item flex w-full items-center gap-3 rounded-xl px-3 text-left text-site-mist transition hover:bg-white/[0.05] hover:text-site-paper ${small ? "py-2 text-[14px]" : "py-2.5 text-[15px] font-semibold"}`}
    >
      <span className="grid w-5 place-items-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge ? <span className="num rounded-full bg-white/[0.06] px-2 py-0.5 text-[12px] text-site-mist">{badge}</span> : null}
    </button>
  );
}
