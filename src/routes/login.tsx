import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Arrow, Check, Mail, btn, field } from "@/portal/ui";
import { api, type Me } from "@/site/portal-api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Dry Run Cyber" },
      { name: "description", content: "Sign in to Dry Run Cyber with a one-time link sent to your work email." },
      { name: "theme-color", content: "#101319" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico", sizes: "any" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [next, setNext] = useState("/portal");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("error") === "expired") setError("That link has expired or was already used. Request a new one.");
    const n = q.get("next");
    if (n && n.startsWith("/") && !n.startsWith("//")) setNext(n);
    api<Me>("/api/me").then(setMe).catch(() => setMe({ user: null }));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setState("sending");
    try {
      const out = await api<{ devLink?: string }>("/api/auth/request", { email, next });
      setDevLink(out.devLink ?? null);
      setState("sent");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  const card = me?.user ? (
    <div>
      <h2 className="text-2xl font-bold">You're already signed in</h2>
      <p className="mt-2 text-site-mist">
        as <span className="text-site-paper">{me.user.email}</span>
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <a href="/portal" className={`${btn.primary} !px-5 !py-3`}>
          Open the portal <Arrow size={17} />
        </a>
        <button
          type="button"
          className={`${btn.ghost} !px-5 !py-3`}
          onClick={async () => {
            await api("/api/auth/signout", {});
            setMe({ user: null });
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  ) : state === "sent" ? (
    <div role="status">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-site-mint/15 text-site-mint">
        <Mail size={26} />
      </span>
      <h2 className="mt-5 text-2xl font-bold">Check your inbox</h2>
      <p className="mt-2 leading-relaxed text-site-mist">
        We sent a sign-in link to <span className="text-site-paper">{email}</span>. It works once and expires in 15 minutes.
      </p>
      {devLink ? (
        <p className="mt-4 break-all text-sm text-site-dim">
          Local only, no email provider set:{" "}
          <a className="text-site-mint underline" href={devLink}>
            open the link
          </a>
        </p>
      ) : null}
      <button type="button" className={`${btn.quiet} -ml-2.5 mt-5`} onClick={() => setState("idle")}>
        Use a different email
      </button>
    </div>
  ) : (
    <form onSubmit={submit}>
      <h2 className="text-2xl font-bold">Sign in</h2>
      <p className="mt-2 text-site-mist">No password. We'll email you a one-time link.</p>
      <label htmlFor="email" className="mt-7 block text-sm font-semibold">
        Work email
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`mt-2 ${field} !py-3`}
        placeholder="you@company.com"
      />
      {error ? (
        <p className="mt-3 text-sm text-site-alarm" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={state === "sending" || !email.trim()} className={`${btn.primary} mt-5 w-full !py-3.5 text-[16px]`}>
        {state === "sending" ? "Sending…" : "Email me a sign-in link"}
      </button>
      <p className="mt-6 text-sm leading-relaxed text-site-dim">
        Invited to play? The link in your admin's email signs you straight in. New here? Sign in and we'll help you set up a workspace.
      </p>
    </form>
  );

  return (
    <div className="portal grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="aurora !rounded-none flex flex-col justify-between px-6 py-8 sm:px-12 lg:py-12">
        <a href="/" aria-label="Dry Run Cyber home" className="inline-block">
          <img src="/brand/logo-horizontal.svg" alt="Dry Run Cyber" className="h-10 w-auto" />
        </a>
        <div className="my-10 max-w-lg lg:my-0">
          <h1 className="display text-[clamp(2.6rem,6vw,4.6rem)] font-extrabold leading-[0.98]" style={{ fontStretch: "120%" }}>
            Clock in.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-site-mist">One place to see who's ready, who needs a nudge, and the evidence your auditors will ask for.</p>
          <ul className="mt-8 hidden space-y-4 sm:block">
            {[
              ["Live readiness", "Every client's progress, updated as people play."],
              ["One-click reminders", "Fresh links to anyone who hasn't started."],
              ["Audit-ready evidence", "Each decision logged against the controls it covers."],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-site-mint/15 text-site-mint">
                  <Check size={14} />
                </span>
                <span>
                  <b className="font-semibold">{t}</b> <span className="text-site-mist">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="hidden text-sm text-site-dim lg:block">© {new Date().getFullYear()} Dry Run Cyber · hello@dryruncyber.com</p>
      </section>
      <main id="main" className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="panel w-full max-w-md !p-8 sm:!p-10">{card}</div>
      </main>
    </div>
  );
}
