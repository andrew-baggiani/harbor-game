import { useState, type FormEvent } from "react";

type Kind = "waitlist" | "demo" | "partner";

const field =
  "mt-1.5 w-full rounded-xl border border-site-rule bg-white/[0.03] px-3.5 py-2.5 text-[15px] text-site-paper placeholder:text-site-dim focus:border-site-violet focus:outline-none";

const COPY: Record<Kind, { button: string; done: string; seatsLabel: string; messageLabel: string; messageHint: string }> = {
  waitlist: {
    button: "Join the waitlist",
    done: "You're on the list, with founding pricing locked in. We'll email you the moment it opens, and about a free 14-day trial for your team.",
    seatsLabel: "How many people would train?",
    messageLabel: "Anything we should know?",
    messageHint: "Insurance or compliance deadline, industry, current training…",
  },
  demo: {
    button: "Request a demo",
    done: "Thanks. We'll reply within one business day with a time that works.",
    seatsLabel: "How many people would train?",
    messageLabel: "When suits you?",
    messageHint: "Days and times, and your time zone",
  },
  partner: {
    button: "Apply to partner",
    done: "Application received. We review every MSP by hand and reply within two business days.",
    seatsLabel: "Roughly how many client end users do you manage?",
    messageLabel: "Tell us about your MSP",
    messageHint: "Website, the clients you'd start with, the security training you sell today…",
  },
};

export function LeadForm({ kind, roles }: { kind: Kind; roles?: string[] }) {
  const c = COPY[kind];
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setState("sending");
    setErr(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, ...data }),
      });
      const out = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(out.error ?? "That didn't go through. Try again, or email hello@dryruncyber.com.");
      setState("done");
    } catch (error) {
      setErr((error as Error).message);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="rounded-2xl border border-site-rule bg-white/[0.03] p-5 text-[16px] leading-relaxed text-site-paper">
        {c.done}
      </p>
    );
  }

  const id = (s: string) => `${kind}-${s}`;
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-semibold" htmlFor={id("name")}>
        Your name
        <input id={id("name")} name="name" required maxLength={120} autoComplete="name" className={field} />
      </label>
      <label className="block text-sm font-semibold" htmlFor={id("email")}>
        Work email
        <input id={id("email")} name="email" type="email" required maxLength={254} autoComplete="email" className={field} />
      </label>
      <label className="block text-sm font-semibold" htmlFor={id("company")}>
        {kind === "partner" ? "MSP name" : "Company"}
        <input id={id("company")} name="company" required maxLength={160} autoComplete="organization" className={field} />
      </label>
      {roles ? (
        <label className="block text-sm font-semibold" htmlFor={id("role")}>
          Your role
          <select id={id("role")} name="role" required defaultValue="" className={field}>
            <option value="" disabled>
              Choose one
            </option>
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
      ) : (
        <span className="hidden sm:block" />
      )}
      <label className="block text-sm font-semibold sm:col-span-2" htmlFor={id("seats")}>
        {c.seatsLabel}
        <input id={id("seats")} name="seats" type="number" min={1} max={100000} inputMode="numeric" className={`${field} sm:max-w-[12rem]`} />
      </label>
      <label className="block text-sm font-semibold sm:col-span-2" htmlFor={id("message")}>
        {c.messageLabel} <span className="font-normal text-site-dim">(optional)</span>
        <textarea id={id("message")} name="message" rows={3} maxLength={2000} placeholder={c.messageHint} className={field} />
      </label>
      {/* honeypot: hidden from people, tempting to bots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {err ? (
        <p role="alert" className="text-sm text-site-alarm sm:col-span-2">
          {err}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={state === "sending"}
          className="rounded-xl bg-site-violet px-5 py-3 font-semibold text-site-paper transition hover:bg-site-violet-hi disabled:opacity-60"
        >
          {state === "sending" ? "Sending…" : c.button}
        </button>
      </div>
    </form>
  );
}
