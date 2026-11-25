import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { api, type Me } from "@/site/portal-api";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [{ title: "Leads · Dry Run Cyber" }, { name: "robots", content: "noindex" }, { name: "theme-color", content: "#101319" }],
  }),
  component: Leads,
});

type Lead = {
  id: string;
  kind: "waitlist" | "demo" | "partner" | "trial";
  name: string | null;
  email: string;
  company: string | null;
  role: string | null;
  seats: number | null;
  message: string | null;
  status: string;
  created_at: number;
};

const KIND = { waitlist: "Waitlist", demo: "Demo", partner: "Partner", trial: "Trial" } as const;

/** The owner's inbox for sign-ups: approve MSPs, start trials, mark things handled. */
function Leads() {
  const [me, setMe] = useState<Me | null>(null);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [filter, setFilter] = useState<"all" | Lead["kind"]>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const out = await api<{ leads: Lead[] }>("/api/leads");
    setLeads(out.leads);
  }, []);

  useEffect(() => {
    api<Me>("/api/me")
      .then((m) => {
        setMe(m);
        if (m.owner) void load();
      })
      .catch(() => setMe({ user: null }));
  }, [load]);

  async function act(lead: Lead, action: "approvePartner" | "startTrial" | "status", status?: string) {
    setBusy(lead.id);
    setNote(null);
    try {
      const out = await api<{ emailed?: boolean; error?: string }>("/api/leads", { action, leadId: lead.id, status });
      if (action !== "status")
        setNote(
          out.emailed
            ? `Done. ${lead.email} has their sign-in link.`
            : `Done, but email isn't set up yet, so ${lead.email} didn't get a link. Once Resend is connected, they can sign in at /login with that email.`,
        );
      await load();
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (!me) return <div className="site min-h-dvh" aria-busy="true" />;
  if (!me.owner)
    return (
      <div className="site flex min-h-dvh items-center justify-center p-6">
        <p className="text-site-mist">
          This page is for Dry Run Cyber staff.{" "}
          <a href="/login?next=/leads" className="underline">
            Sign in
          </a>
        </p>
      </div>
    );

  const shown = (leads ?? []).filter((l) => filter === "all" || l.kind === filter);
  return (
    <div className="site min-h-dvh">
      <main className="mx-auto max-w-[1100px] px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="display text-[40px]">Leads</h1>
          <div className="flex gap-2" role="group" aria-label="Filter">
            {(["all", "trial", "waitlist", "demo", "partner"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={filter === k}
                onClick={() => setFilter(k)}
                className={`rounded-full border px-4 py-1.5 text-sm ${filter === k ? "border-site-violet bg-site-violet/15" : "border-site-rule hover:border-white/30"}`}
              >
                {k === "all" ? `All (${leads?.length ?? 0})` : `${KIND[k]} (${leads?.filter((l) => l.kind === k).length ?? 0})`}
              </button>
            ))}
          </div>
        </div>
        {note ? (
          <p role="status" className="mt-5 rounded-xl border border-site-rule bg-white/[0.03] p-4 text-[15px]">
            {note}
          </p>
        ) : null}
        {leads === null ? (
          <p className="mt-8 text-site-mist">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="mt-8 text-site-mist">Nothing here yet. Sign-ups from /pricing and /partners show up here and in your inbox.</p>
        ) : (
          <ul className="mt-8 divide-y divide-site-rule border-y border-site-rule">
            {shown.map((l) => (
              <li key={l.id} className="grid gap-3 py-5 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-[13px] text-site-dim">
                    {KIND[l.kind]} · {new Date(l.created_at * 1000).toLocaleString()} · {l.status}
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {l.company ?? "No company"} <span className="font-normal text-site-mist">· {l.name ?? "No name"}</span>
                  </p>
                  <p className="text-[15px] text-site-mist">
                    <a href={`mailto:${l.email}`} className="underline underline-offset-4">
                      {l.email}
                    </a>
                    {l.role ? ` · ${l.role}` : ""}
                    {l.seats ? ` · ${l.seats} learners` : ""}
                  </p>
                  {l.message ? <p className="mt-2 max-w-[60ch] whitespace-pre-wrap text-[15px] leading-relaxed">{l.message}</p> : null}
                </div>
                <div className="flex flex-wrap items-start gap-2 md:justify-end">
                  {l.kind === "partner" && l.status !== "approved" ? (
                    <button
                      type="button"
                      disabled={busy === l.id}
                      onClick={() => act(l, "approvePartner")}
                      className="rounded-lg bg-site-violet px-3.5 py-2 text-sm font-semibold hover:bg-site-violet-hi disabled:opacity-60"
                    >
                      Approve partner + 25 NFR
                    </button>
                  ) : null}
                  {l.kind !== "partner" && l.status !== "trial" ? (
                    <button
                      type="button"
                      disabled={busy === l.id}
                      onClick={() => act(l, "startTrial")}
                      className="rounded-lg bg-site-violet px-3.5 py-2 text-sm font-semibold hover:bg-site-violet-hi disabled:opacity-60"
                    >
                      Start 14-day trial
                    </button>
                  ) : null}
                  {l.status === "new" ? (
                    <button
                      type="button"
                      disabled={busy === l.id}
                      onClick={() => act(l, "status", "contacted")}
                      className="rounded-lg border border-site-rule px-3.5 py-2 text-sm hover:border-white/30"
                    >
                      Mark contacted
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
