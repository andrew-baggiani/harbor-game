import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/site/portal-api";
import { Panel, PanelHead, Pill, btn, field, shortDate, useToast, type Tone } from "@/portal/ui";

type Summary = { plan: string | null; seats: number | null; status: string | null; trialEndsAt: number | null; paid: boolean; learners: number | null };

const STATUS: Record<string, { tone: Tone; label: string }> = {
  active: { tone: "mint", label: "Active" },
  trialing: { tone: "violet", label: "Free trial" },
  past_due: { tone: "amber", label: "Payment failed, retrying" },
  unpaid: { tone: "alarm", label: "Unpaid" },
  canceled: { tone: "alarm", label: "Canceled" },
  incomplete: { tone: "amber", label: "Waiting on payment" },
  paused: { tone: "dim", label: "Paused" },
};

const PLAN_NAME: Record<string, string> = { teams: "Teams", founders: "Founders", msp: "MSP Partner", trial: "Free trial", nfr: "Partner seats (NFR)" };

/** Plan, status and the way into Stripe Checkout or the billing portal, for one workspace or one MSP. */
export function BillingCard({ orgId, partnerId }: { orgId?: string; partnerId?: string }) {
  const toast = useToast();
  const [s, setS] = useState<Summary | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [seats, setSeats] = useState(10);
  const [busy, setBusy] = useState(false);
  const q = partnerId ? `partner=${encodeURIComponent(partnerId)}` : `org=${encodeURIComponent(orgId ?? "")}`;

  useEffect(() => {
    api<{ billing: Summary; enabled: boolean }>(`/api/billing?${q}`)
      .then((r) => {
        setS(r.billing);
        setEnabled(r.enabled);
        if (r.billing.seats) setSeats(Math.max(5, r.billing.seats));
      })
      .catch(() => {});
    const back = new URLSearchParams(window.location.search).get("billing");
    if (back === "done") toast("Thanks. Your plan is active; it can take a few seconds to show here.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function go(action: "checkout" | "portal", e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ url: string }>("/api/billing", { action, orgId, partnerId, seats });
      window.location.assign(r.url);
    } catch (err) {
      toast((err as Error).message, "err");
      setBusy(false);
    }
  }

  if (!s) return null;
  const st = s.status ? (STATUS[s.status] ?? { tone: "dim" as Tone, label: s.status }) : null;
  const msp = !!partnerId;

  return (
    <Panel className="mt-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelHead
          title="Billing"
          hint={
            msp
              ? "$1.25 per active learner per month across all your clients. Your first 25 learners are free. Removed people stop counting at the next bill."
              : "$1.99 per learner per month, billed yearly. 5-seat minimum. Sales tax added where it applies."
          }
        />
        {st ? (
          <Pill tone={st.tone} dot>
            {st.label}
          </Pill>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-3 text-[15px] sm:grid-cols-[160px_1fr]">
        <dt className="text-site-dim">Plan</dt>
        <dd>{s.plan ? (PLAN_NAME[s.plan] ?? s.plan) : "No plan yet"}</dd>
        {msp ? (
          <>
            <dt className="text-site-dim">Learners today</dt>
            <dd className="num">{s.learners ?? 0}</dd>
          </>
        ) : s.seats ? (
          <>
            <dt className="text-site-dim">Seats</dt>
            <dd className="num">{s.seats}</dd>
          </>
        ) : null}
        {s.status === "trialing" && s.trialEndsAt ? (
          <>
            <dt className="text-site-dim">Trial ends</dt>
            <dd>{shortDate(s.trialEndsAt)}</dd>
          </>
        ) : null}
      </dl>

      {!enabled ? (
        <p className="mt-5 text-sm text-site-mist">Online payment is coming soon. Email hello@dryruncyber.com to start a paid plan now.</p>
      ) : s.paid ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" disabled={busy} className={btn.primary} onClick={() => go("portal")}>
            {busy ? "Opening…" : "Manage billing"}
          </button>
          <p className="self-center text-sm text-site-dim">Change seats or card, download invoices, or cancel.</p>
        </div>
      ) : msp ? (
        <div className="mt-5">
          <button type="button" disabled={busy} className={btn.primary} onClick={() => go("checkout")}>
            {busy ? "Opening checkout…" : "Start partner billing"}
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => go("checkout", e)} className="mt-5 flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5 text-sm">
            <span className="text-site-mist">Seats</span>
            <input type="number" min={5} max={10000} className={`${field} w-32`} value={seats} onChange={(e) => setSeats(Math.max(5, Number(e.target.value) || 5))} />
          </label>
          <button type="submit" disabled={busy} className={btn.primary}>
            {busy ? "Opening checkout…" : "Choose this plan"}
          </button>
          <p className="num self-center text-sm text-site-dim">${(seats * 23.88).toFixed(2)} a year before tax</p>
        </form>
      )}
    </Panel>
  );
}
