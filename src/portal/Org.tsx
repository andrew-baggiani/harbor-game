// One organization: people, leaderboard, training plan, settings.
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AI_ENTRY, TRACK_LIST, WEEK } from "@/game/week";
import { api, type Board, type Learner, type OrgDetail } from "@/site/portal-api";
import { ActivityFeed, clientStatus } from "@/portal/Partner";
import {
  Avatar,
  Back,
  Calendar,
  Check,
  Copy,
  Download,
  Gauge,
  Gear,
  LiveDot,
  Lock,
  Mail,
  Panel,
  PanelHead,
  Pill,
  Plus,
  SCENARIOS,
  Search,
  Sheet,
  Switch,
  Trophy,
  Users,
  ago,
  btn,
  daysUntil,
  field,
  personName,
  shortDate,
  useToast,
} from "@/portal/ui";

export type OrgTab = "people" | "leaderboard" | "plan" | "settings";
const MAX = 950;

type Props = {
  orgId: string;
  tab: OrgTab;
  setTab: (t: OrgTab) => void;
  onPartner: (partnerId: string | null) => void;
  backTo: { label: string; go: () => void } | null;
  onChanged: () => void;
};

export function useBoard(orgId: string) {
  const [board, setBoard] = useState<Board | null>(null);
  useEffect(() => {
    let stop = false;
    let timer = 0;
    const tick = async () => {
      try {
        const b = await api<Board>(`/api/leaderboard?org=${encodeURIComponent(orgId)}`);
        if (!stop) setBoard(b);
      } catch {
        /* keep the last one */
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

export function OrgView({ orgId, tab, setTab, onPartner, backTo, onChanged }: Props) {
  const [d, setD] = useState<OrgDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const load = useCallback(() => {
    api<OrgDetail>(`/api/org?org=${encodeURIComponent(orgId)}`)
      .then((x) => {
        setD(x);
        onPartner(x.org.partnerId);
      })
      .catch((e) => setErr((e as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);
  useEffect(() => {
    load();
    const t = window.setInterval(load, 15_000);
    return () => window.clearInterval(t);
  }, [load]);
  const refresh = () => {
    load();
    onChanged();
  };

  if (err && !d) return <Panel className="max-w-lg"><p className="text-site-alarm">{err}</p></Panel>;
  if (!d) return <div className="aurora h-[300px] animate-pulse" />;

  const people = d.learners.filter((l) => l.role === "learner");
  const done = people.filter((l) => l.monday === "Complete").length;
  const playing = people.filter((l) => l.monday === "In progress").length;
  const scored = people.filter((l) => l.monday !== "Not started");
  const avg = scored.length ? Math.round(scored.reduce((a, l) => a + l.score, 0) / scored.length) : null;
  const completion = people.length ? Math.round((done / people.length) * 100) : 0;
  const status = clientStatus({ learners: people.length, completion, inProgress: playing, dueAt: d.campaign?.dueAt ?? null });

  return (
    <div className="space-y-6">
      {backTo ? (
        <button type="button" onClick={backTo.go} className={btn.quiet + " -ml-2"}>
          <Back size={16} /> {backTo.label}
        </button>
      ) : null}

      <section className="aurora px-6 py-7 sm:px-9 sm:py-8">
        <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Pill tone={status.tone} dot>
                {status.label}
              </Pill>
              {d.org.domain ? <span className="text-sm text-site-mist">{d.org.domain}</span> : null}
            </div>
            <h1 className="display mt-3 text-[clamp(2rem,4.4vw,3.1rem)] font-extrabold leading-[1.02]" style={{ fontStretch: "118%" }}>
              {d.org.name}
            </h1>
            <p className="mt-3 text-[17px] text-site-mist">
              {people.length
                ? `${done} of ${people.length} finished Monday${d.campaign?.dueAt ? `, due ${shortDate(d.campaign.dueAt)}` : ""}.`
                : "No one's enrolled yet. Invite the team to send out Monday."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className={btn.primary} onClick={() => setInviting(true)}>
                <Plus /> Invite people
              </button>
              <a href={`/api/export?org=${encodeURIComponent(orgId)}`} className={btn.ghost}>
                <Download /> Evidence (CSV)
              </a>
            </div>
          </div>
          <Gauge value={completion} size={176} sub="finished" />
        </div>
        <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Enrolled" value={people.length} />
          <MiniStat label="Finished" value={done} />
          <MiniStat label="Playing now" value={playing} live={playing > 0} />
          <MiniStat label="Average score" value={avg ?? "–"} sub={avg !== null ? `of ${MAX}` : undefined} />
        </dl>
      </section>

      <div role="tablist" aria-label="Sections" className="flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.07] bg-white/[0.02] p-1.5">
        {(
          [
            ["people", "People", <Users key="i" size={17} />, people.length],
            ["leaderboard", "Leaderboard", <Trophy key="i" size={17} />, null],
            ["plan", "Training plan", <Calendar key="i" size={17} />, null],
            ["settings", "Settings", <Gear key="i" size={17} />, null],
          ] as const
        ).map(([k, label, icon, count]) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-semibold transition ${tab === k ? "bg-site-violet text-site-paper shadow-[0_8px_24px_-10px_rgba(139,44,245,.8)]" : "text-site-mist hover:bg-white/[0.05] hover:text-site-paper"}`}
          >
            {icon}
            {label}
            {count !== null ? <span className={`num rounded-full px-1.5 text-[12px] ${tab === k ? "bg-white/20" : "bg-white/[0.06]"}`}>{count}</span> : null}
          </button>
        ))}
      </div>

      {tab === "people" ? <People orgId={orgId} d={d} people={people} onInvite={() => setInviting(true)} onChanged={load} /> : null}
      {tab === "leaderboard" ? <LeaderboardTab orgId={orgId} enabled={d.org.leaderboardEnabled} onSettings={() => setTab("settings")} /> : null}
      {tab === "plan" ? <Plan orgId={orgId} dueAt={d.campaign?.dueAt ?? null} hasCampaign={!!d.campaign} onDone={refresh} /> : null}
      {tab === "settings" ? <Settings orgId={orgId} d={d} onDone={refresh} /> : null}

      <Invite open={inviting} onClose={() => setInviting(false)} orgId={orgId} domain={d.org.domain} onDone={refresh} />
    </div>
  );
}

function MiniStat({ label, value, sub, live }: { label: string; value: number | string; sub?: string; live?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3 backdrop-blur-sm">
      <dt className="flex items-center gap-2 text-[13px] text-site-mist">
        {label}
        {live ? <span className="live-dot !h-1.5 !w-1.5" aria-label="live" /> : null}
      </dt>
      <dd className="num mt-1 text-[26px] font-extrabold leading-none">
        {value}
        {sub ? <span className="ml-1.5 text-sm font-semibold text-site-dim">{sub}</span> : null}
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------ people */

type Filter = "all" | "Complete" | "In progress" | "Not started";

function People({ orgId, d, people, onInvite, onChanged }: { orgId: string; d: OrgDetail; people: Learner[]; onInvite: () => void; onChanged: () => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [tracksFor, setTracksFor] = useState<Learner | null>(null);
  const [q, setQ] = useState("");
  const toast = useToast();
  const counts = {
    all: people.length,
    Complete: people.filter((p) => p.monday === "Complete").length,
    "In progress": people.filter((p) => p.monday === "In progress").length,
    "Not started": people.filter((p) => p.monday === "Not started").length,
  };
  const shown = people.filter((p) => (filter === "all" || p.monday === filter) && `${p.email} ${p.displayName ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()));
  const notStarted = people.filter((p) => p.monday === "Not started");

  async function remind(emails: string[]) {
    try {
      const out = await api<{ reminded: string[]; skipped: string[] }>("/api/org", { action: "remind", orgId, emails: emails.join(",") });
      if (out.reminded.length) toast(`Reminder sent to ${out.reminded.length === 1 ? personName(out.reminded[0]) : `${out.reminded.length} people`}.`);
      else if (out.skipped.length) toast("They already got a link in the last 15 minutes.");
    } catch (e) {
      toast((e as Error).message, "err");
    }
  }

  async function remindMonthly(emails: string[]) {
    try {
      const out = await api<{ reminded: string[]; skipped: string[] }>("/api/org", { action: "remind", orgId, emails: emails.join(","), next: "/reminder" });
      toast(out.reminded.length ? `This month's reminder went to ${out.reminded.length === 1 ? "1 person" : `${out.reminded.length} people`}.` : "Everyone got a link in the last 15 minutes.");
    } catch (e) {
      toast((e as Error).message, "err");
    }
  }

  if (!people.length) {
    return (
      <div className="panel flex flex-col items-center px-6 py-14 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-site-violet/15 text-site-violet-hi">
          <Mail size={30} />
        </span>
        <h2 className="mt-5 text-xl font-bold">Invite {d.org.name}'s team</h2>
        <p className="mt-2 max-w-sm text-site-mist">Paste emails or drop in a CSV. Everyone gets a personal link to Monday's shift, and you'll see their decisions here as they make them.</p>
        <button type="button" className={`${btn.primary} mt-6`} onClick={onInvite}>
          <Plus /> Invite people
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel className="!p-0">
        <div className="flex flex-wrap items-center gap-3 p-5 sm:p-6">
          <div role="radiogroup" aria-label="Filter" className="flex flex-wrap gap-1.5">
            {(["all", "Complete", "In progress", "Not started"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={filter === k}
                onClick={() => setFilter(k)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-inset transition ${filter === k ? "bg-site-paper text-site-ink ring-site-paper" : "text-site-mist ring-white/10 hover:text-site-paper hover:ring-white/25"}`}
              >
                {k === "all" ? "Everyone" : k === "Complete" ? "Finished" : k} <span className="num opacity-60">{counts[k]}</span>
              </button>
            ))}
          </div>
          <label className="relative ml-auto min-w-[180px] flex-1 sm:max-w-[240px]">
            <span className="sr-only">Search people</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-site-dim" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className={`${field} !py-2 pl-9 text-sm`} />
          </label>
        </div>

        {notStarted.length && (filter === "all" || filter === "Not started") ? (
          <div className="mx-5 mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-site-violet/[0.09] px-4 py-3 ring-1 ring-inset ring-site-violet/25 sm:mx-6">
            <p className="flex-1 text-[14.5px]">
              <b>{notStarted.length}</b> {notStarted.length === 1 ? "person hasn't" : "people haven't"} started yet.
            </p>
            <button type="button" className={`${btn.primary} !py-2 text-sm`} onClick={() => remind(notStarted.map((p) => p.email))}>
              <Mail size={16} /> Remind {notStarted.length === 1 ? "them" : "all"}
            </button>
            <button
              type="button"
              className={btn.quiet}
              onClick={async () => {
                await navigator.clipboard?.writeText(notStarted.map((p) => p.email).join(", "));
                toast("Emails copied.");
              }}
            >
              <Copy size={16} /> Copy emails
            </button>
          </div>
        ) : null}

        <ul className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
          {shown.map((p) => (
            <li key={p.userId} className="group flex items-center gap-4 px-5 py-3.5 transition hover:bg-white/[0.02] sm:px-6">
              <Avatar name={personName(p.email, p.displayName)} size={38} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{personName(p.email, p.displayName)}</div>
                <div className="truncate text-[13.5px] text-site-dim">{p.email}</div>
                <WeekDots p={p} />
              </div>
              <button
                type="button"
                title="Role tracks"
                aria-label={`Role tracks for ${p.email}`}
                onClick={() => setTracksFor(p)}
                className={`${btn.quiet} hidden !px-2.5 text-[12.5px] opacity-70 group-hover:opacity-100 sm:inline-flex`}
              >
                {p.tracks?.length ? `${p.tracks.length} track${p.tracks.length > 1 ? "s" : ""}` : "Tracks"}
              </button>
              <div className="hidden w-[150px] sm:block">
                {p.monday === "Not started" ? (
                  <span className="text-sm text-site-dim">–</span>
                ) : (
                  <>
                    <div className="num text-right text-[15px] font-bold">
                      {p.score}
                      <span className="text-xs font-semibold text-site-dim"> / {MAX}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <span className="block h-full rounded-full bg-gradient-to-r from-site-violet-hi to-site-mint" style={{ width: `${Math.min(100, (p.score / MAX) * 100)}%` }} />
                    </div>
                  </>
                )}
              </div>
              <div className="flex w-[118px] flex-col items-end gap-1">
                <Pill tone={p.monday === "Complete" ? "mint" : p.monday === "In progress" ? "violet" : "dim"} dot>
                  {p.monday === "Complete" ? "Finished" : p.monday}
                </Pill>
                <span className="text-[12px] text-site-dim">{p.lastActive ? ago(p.lastActive) : "Invited"}</span>
              </div>
              {p.monday !== "Complete" ? (
                <button type="button" title="Send a reminder" aria-label={`Remind ${p.email}`} onClick={() => remind([p.email])} className={`${btn.quiet} !px-2 opacity-70 group-hover:opacity-100`}>
                  <Mail size={17} />
                </button>
              ) : (
                <span className="grid w-[34px] place-items-center text-site-mint" aria-hidden="true">
                  <Check size={17} />
                </span>
              )}
            </li>
          ))}
          {!shown.length ? <li className="px-6 py-8 text-center text-site-dim">Nobody matches that.</li> : null}
        </ul>
      </Panel>

      <TrackSheet orgId={orgId} person={tracksFor} onClose={() => setTracksFor(null)} onChanged={onChanged} />
      <div className="space-y-6">
        <TracksCard people={people} onRemind={() => remindMonthly(people.map((p) => p.email))} />
        <Slips scenarios={d.scenarios} />
        <ActivityFeed scope={`org=${encodeURIComponent(orgId)}`} />
      </div>
    </div>
  );
}

/** Per-decision results: where this team gets it right, and where it slips. */
function Slips({ scenarios }: { scenarios: OrgDetail["scenarios"] }) {
  const rows = SCENARIOS.map((s) => {
    const r = scenarios.find((x) => x.id === s.id);
    return { ...s, total: r?.total ?? 0, rate: r && r.total ? Math.round((r.good / r.total) * 100) : null };
  });
  const any = rows.some((r) => r.total);
  const weakest = rows.filter((r) => r.rate !== null).sort((a, b) => (a.rate as number) - (b.rate as number))[0];
  return (
    <Panel>
      <PanelHead title="Decision by decision" hint={any ? (weakest && (weakest.rate as number) < 100 ? `Weakest spot: ${weakest.name}.` : "A clean sweep so far.") : "Fills in as people play."} />
      <ul className="mt-5 space-y-3">
        {rows.map((r) => (
          <li key={r.id}>
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className={r.total ? "" : "text-site-dim"}>{r.name}</span>
              <span className={`num font-bold ${r.rate === null ? "text-site-dim" : r.rate >= 80 ? "text-site-mint" : r.rate >= 50 ? "text-[#ffc56b]" : "text-site-alarm"}`}>{r.rate === null ? "–" : `${r.rate}%`}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              {r.rate !== null ? <span className={`block h-full rounded-full ${r.rate >= 80 ? "bg-site-mint" : r.rate >= 50 ? "bg-[#ffb547]" : "bg-site-alarm"}`} style={{ width: `${Math.max(4, r.rate)}%` }} /> : null}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ------------------------------------------------------------------ leaderboard */

export function Podium({ board, compact }: { board: Board | null; compact?: boolean }) {
  if (!board) return <p className="text-site-dim">Loading…</p>;
  if (!board.enabled) return <p className="text-site-dim">The leaderboard is off for this team.</p>;
  if (!board.rows.length) return <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-site-dim">No scores yet. The first decision puts someone on the board.</div>;
  const top = board.rows.slice(0, 3);
  const order = [top[1], top[0], top[2]];
  const heights = compact ? ["h-20", "h-28", "h-14"] : ["h-28", "h-40", "h-20"];
  return (
    <div>
      <div className="grid grid-cols-3 items-end gap-3">
        {order.map((r, i) =>
          r ? (
            <div key={`${r.rank}-${r.name}`} className="flex flex-col items-center text-center">
              <Avatar name={r.name} size={compact ? 40 : i === 1 ? 64 : 52} />
              <div className={`mt-2 max-w-full truncate font-bold ${r.you ? "text-site-mint" : ""}`}>{r.you ? "You" : r.name}</div>
              <div className="num text-sm text-site-mist">{r.score}</div>
              <div className={`podium-bar ${i === 1 ? "gold" : ""} mt-3 grid w-full place-items-start justify-center rounded-t-2xl pt-3 ${heights[i]}`}>
                <span className="num text-2xl font-extrabold text-white/80">{r.rank}</span>
              </div>
            </div>
          ) : (
            <div key={i} />
          ),
        )}
      </div>
      {board.rows.length > 3 ? (
        <ol className="mt-4 divide-y divide-white/[0.05]">
          {board.rows.slice(3, 25).map((r) => (
            <li key={`${r.rank}-${r.name}`} className={`flex items-center gap-3 px-1 py-2.5 ${r.you ? "text-site-paper" : "text-site-mist"}`}>
              <span className="num w-6 text-right font-bold text-site-dim">{r.rank}</span>
              <Avatar name={r.name} size={28} />
              <span className="min-w-0 flex-1 truncate">{r.you ? "You" : r.name}</span>
              {r.complete ? <Check size={15} className="text-site-mint" /> : null}
              <span className="num font-bold text-site-paper">{r.score}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function LeaderboardTab({ orgId, enabled, onSettings }: { orgId: string; enabled: boolean; onSettings: () => void }) {
  const board = useBoard(orgId);
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Panel>
        <PanelHead title="This week's standings" action={<LiveDot label="Updates live" />} />
        <div className="mt-8">
          <Podium board={board} />
        </div>
      </Panel>
      <Panel>
        <PanelHead title="How scoring works" />
        <ul className="mt-4 space-y-3 text-[14.5px] text-site-mist">
          <li className="flex justify-between gap-3"><span>Right call</span><b className="num text-site-mint">+100</b></li>
          <li className="flex justify-between gap-3"><span>Missed it</span><b className="num">0</b></li>
          <li className="flex justify-between gap-3"><span>Finished the shift</span><b className="num text-site-mint">+50</b></li>
        </ul>
        <p className="mt-4 text-sm text-site-dim">Best run counts. People without a display name show as "Teammate N", so nobody's put on the spot.</p>
        {!enabled ? (
          <button type="button" className={`${btn.ghost} mt-5 w-full`} onClick={onSettings}>
            Turn the leaderboard on
          </button>
        ) : null}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ training plan */

function Plan({ orgId, dueAt, hasCampaign, onDone }: { orgId: string; dueAt: number | null; hasCampaign: boolean; onDone: () => void }) {
  const toIso = (ms: number | null) => (ms ? new Date(ms).toISOString().slice(0, 10) : "");
  const [date, setDate] = useState(toIso(dueAt));
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => setDate(toIso(dueAt)), [dueAt]);
  const left = daysUntil(dueAt);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/org", { action: "campaign", orgId, dueAt: date ? `${date}T23:59:00` : null });
      toast(hasCampaign ? "Due date saved." : "Monday is assigned to everyone.");
      onDone();
    } catch (err) {
      toast((err as Error).message, "err");
    }
    setBusy(false);
  }
  return (
    <div className="space-y-4">
      <p className="text-site-mist">One shift a day, about 20 minutes each. Monday is live now; the rest of the week unlocks as it ships.</p>
      <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {WEEK.map((s) => {
          const open = s.status === "open";
          return (
            <li key={s.day} className={`panel flex flex-col ${open ? "ring-1 ring-site-violet/50 md:col-span-2 xl:col-span-2" : "opacity-80"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-bold ${open ? "text-site-mint" : "text-site-dim"}`}>{s.day}</span>
                {open ? <Pill tone="mint" dot>Live</Pill> : <Pill tone="dim"><Lock size={13} /> Coming soon</Pill>}
              </div>
              <h3 className="mt-3 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-site-dim">{s.topics.split(" · ").join(", ")}.</p>
              {open ? (
                <form onSubmit={save} className="mt-auto pt-6">
                  <label htmlFor="due" className="block text-sm font-semibold">
                    Due date <span className="font-normal text-site-dim">(optional)</span>
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input id="due" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${field} flex-1 [color-scheme:dark]`} />
                    <button type="submit" disabled={busy} className={btn.primary}>
                      {hasCampaign ? "Save" : "Assign Monday"}
                    </button>
                  </div>
                  {left !== null ? <p className="mt-2 text-sm text-site-dim">{left < 0 ? "Past due." : left === 0 ? "Due today." : `${left} day${left === 1 ? "" : "s"} left.`}</p> : null}
                </form>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ settings */

function Settings({ orgId, d, onDone }: { orgId: string; d: OrgDetail; onDone: () => void }) {
  const toast = useToast();
  const [on, setOn] = useState(d.org.leaderboardEnabled);
  useEffect(() => setOn(d.org.leaderboardEnabled), [d.org.leaderboardEnabled]);
  return (
    <div className="max-w-2xl space-y-6">
      <Panel>
        <Switch
          checked={on}
          label="Show the leaderboard"
          hint="People see where they rank on their own team. Names are optional."
          onChange={async (v) => {
            setOn(v);
            try {
              await api("/api/org", { action: "settings", orgId, leaderboardEnabled: v });
              toast(v ? "Leaderboard is on." : "Leaderboard is off.");
              onDone();
            } catch (e) {
              setOn(!v);
              toast((e as Error).message, "err");
            }
          }}
        />
      </Panel>
      <Panel>
        <PanelHead title="Organization" />
        <dl className="mt-4 grid gap-3 text-[15px] sm:grid-cols-[160px_1fr]">
          <dt className="text-site-dim">Name</dt>
          <dd>{d.org.name}</dd>
          <dt className="text-site-dim">Email domain</dt>
          <dd>{d.org.domain ?? "Not set"}</dd>
        </dl>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ invite */

const EMAIL = /^[^\s@,;<>"']+@[^\s@,;<>"']+\.[^\s@,;<>"']+$/;

function Invite({ open, onClose, orgId, domain, onDone }: { open: boolean; onClose: () => void; orgId: string; domain: string | null; onDone: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const parsed = useMemo(() => {
    const tokens = text.split(/[\s,;]+/).map((t) => t.replace(/^["'<]|["'>]$/g, "").toLowerCase()).filter(Boolean);
    const ok = [...new Set(tokens.filter((t) => EMAIL.test(t)))];
    const bad = tokens.filter((t) => t.includes("@") && !EMAIL.test(t));
    const off = domain ? ok.filter((e) => !e.endsWith(`@${domain.toLowerCase()}`)) : [];
    return { ok, bad, off };
  }, [text, domain]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const out = await api<{ invited: string[]; already: string[] }>("/api/org", { action: "invite", orgId, emails: parsed.ok.join(",") });
      toast(`Invited ${out.invited.length} ${out.invited.length === 1 ? "person" : "people"}.${out.already.length ? ` ${out.already.length} already on the team.` : ""}`);
      setText("");
      onClose();
      onDone();
    } catch (err) {
      toast((err as Error).message, "err");
    }
    setBusy(false);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Invite people" hint="Each person gets their own link to Monday. No passwords to set up.">
      <form onSubmit={submit} className="space-y-4">
        <label htmlFor="emails" className="block text-sm font-semibold">
          Work emails
        </label>
        <textarea id="emails" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={`alex@${domain ?? "company.com"}\nsam@${domain ?? "company.com"}`} className={field} />
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-site-mist">Paste a list, or load a CSV export from your directory.</span>
          <label className={`${btn.quiet} cursor-pointer`}>
            Load CSV
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setText((await f.text()).slice(0, 200_000));
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {parsed.ok.length ? (
          <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-3">
            <div className="flex flex-wrap gap-1.5">
              {parsed.ok.slice(0, 18).map((e) => (
                <span key={e} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] ring-1 ring-inset ${parsed.off.includes(e) ? "bg-[#ffb547]/10 text-[#ffc56b] ring-[#ffb547]/25" : "bg-white/[0.05] ring-white/10"}`}>
                  <Avatar name={e} size={16} />
                  {e}
                </span>
              ))}
              {parsed.ok.length > 18 ? <span className="px-2 py-1 text-[13px] text-site-dim">+{parsed.ok.length - 18} more</span> : null}
            </div>
          </div>
        ) : null}
        {parsed.off.length ? <p className="text-sm text-[#ffc56b]">{parsed.off.length} {parsed.off.length === 1 ? "address isn't" : "addresses aren't"} on {domain}. Double-check before sending.</p> : null}
        {parsed.bad.length ? <p className="text-sm text-site-alarm">Skipping {parsed.bad.length} that {parsed.bad.length === 1 ? "doesn't" : "don't"} look like an email.</p> : null}
        <button type="submit" disabled={busy || !parsed.ok.length} className={`${btn.primary} w-full !py-3`}>
          {busy ? "Sending…" : parsed.ok.length ? `Send ${parsed.ok.length} invite${parsed.ok.length === 1 ? "" : "s"}` : "Send invites"}
        </button>
      </form>
    </Sheet>
  );
}

const WEEK_IDS = ["tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/** One dot per shift after Monday, plus assigned tracks. Mint is done, violet is started. */
function WeekDots({ p }: { p: Learner }) {
  const items = [
    ...WEEK_IDS.map((id) => ({ id, label: WEEK.find((w) => w.href.endsWith(id))?.day.slice(0, 3) ?? id })),
    { id: AI_ENTRY.id, label: "AI" },
    ...(p.tracks ?? []).map((id) => ({ id, label: TRACK_LIST.find((t) => t.id === id)?.day ?? id })),
  ];
  return (
    <div className="mt-1.5 flex flex-wrap gap-1" aria-label="Week progress">
      {items.map((it) => {
        const st = p.week?.[it.id];
        const tone = st === "Complete" ? "bg-site-mint/15 text-site-mint ring-site-mint/30" : st ? "bg-site-violet/15 text-site-violet-hi ring-site-violet/30" : "text-site-dim ring-white/10";
        return (
          <span key={it.id} title={`${it.label}: ${st ?? "not started"}`} className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tone} ${it.id.startsWith("track-") ? "border-l-2 border-site-violet" : ""}`}>
            {it.label}
          </span>
        );
      })}
    </div>
  );
}

function TrackSheet({ orgId, person, onClose, onChanged }: { orgId: string; person: Learner | null; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [on, setOn] = useState<string[]>([]);
  useEffect(() => setOn(person?.tracks ?? []), [person]);
  if (!person) return null;
  const toggle = async (track: string, value: boolean) => {
    setOn((list) => (value ? [...list, track] : list.filter((t) => t !== track)));
    try {
      await api("/api/org", { action: "track", orgId, userId: person.userId, track, on: value });
      onChanged();
    } catch (e) {
      toast((e as Error).message, "err");
    }
  };
  return (
    <Sheet open={!!person} onClose={onClose} title={`Role tracks for ${personName(person.email, person.displayName)}`} hint="Assign the tracks that match their job. Each one is a short shift on top of the week.">
      <div className="space-y-5">
        {TRACK_LIST.map((t) => (
          <Switch key={t.id} checked={on.includes(t.id)} onChange={(v) => void toggle(t.id, v)} label={`${t.day}: ${t.title}`} hint={t.topics.replaceAll(" · ", ", ")} />
        ))}
      </div>
      <p className="mt-6 text-sm text-site-dim">These map to NIST 800-53 AT-3, 800-171 3.2.2, CMMC AT.L2-3.2.2, CIS 14.9 and CSF PR.AT-02.</p>
    </Sheet>
  );
}

function TracksCard({ people, onRemind }: { people: Learner[]; onRemind: () => void }) {
  const month = new Date().toLocaleString("en-US", { month: "long" });
  const remindedThisMonth = people.filter((p) => p.lastReminder && new Date(p.lastReminder).getMonth() === new Date().getMonth()).length;
  return (
    <Panel>
      <PanelHead title="Tracks and reminders" hint="Role-based training and HIPAA security reminders." />
      <ul className="mt-4 space-y-2 text-[14.5px]">
        {TRACK_LIST.map((t) => {
          const assigned = people.filter((p) => p.tracks?.includes(t.id));
          const done = assigned.filter((p) => p.week?.[t.id] === "Complete").length;
          return (
            <li key={t.id} className="flex items-center justify-between gap-3">
              <span>{t.day}</span>
              <span className="num text-site-dim">{assigned.length ? `${done} of ${assigned.length} done` : "Nobody assigned"}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-5 border-t border-white/[0.06] pt-4">
        <p className="text-[14.5px]">
          {month} reminder: <b className="num">{remindedThisMonth}</b> of {people.length} answered
        </p>
        <button type="button" className={`${btn.quiet} mt-3 !py-2 text-sm`} onClick={onRemind}>
          <Mail size={16} /> Send this month's reminder
        </button>
      </div>
    </Panel>
  );
}
