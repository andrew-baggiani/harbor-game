import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { SiteFooter, SiteNav, SkipLink } from "@/site/SiteChrome";
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

  return (
    <div className="site flex min-h-dvh flex-col overflow-x-clip">
      <SkipLink />
      <SiteNav />
      <main id="main" className="mx-auto w-full max-w-[1240px] flex-1 px-6 pb-24 pt-12 md:px-10 lg:pt-20">
        <div className="max-w-md">
          <p className="text-[13px] font-semibold tracking-[0.18em] text-site-mint uppercase">Sign in</p>
          <h1 className="display mt-3 text-4xl font-extrabold leading-[1.02] sm:text-5xl" style={{ fontStretch: "118%" }}>
            Clock in.
          </h1>
          {me?.user ? (
            <div className="mt-8 rounded-lg border border-site-rule bg-site-ink-2 p-6">
              <p className="text-site-mist">
                Signed in as <span className="text-site-paper">{me.user.email}</span>.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href="/portal" className="rounded-md bg-site-violet px-5 py-3 font-semibold text-site-paper hover:bg-site-violet-hi">
                  Open the portal
                </a>
                <button
                  type="button"
                  className="rounded-md border border-site-rule px-5 py-3 text-site-mist hover:text-site-paper"
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
            <div className="mt-8 rounded-lg border border-site-rule bg-site-ink-2 p-6" role="status">
              <p className="text-lg font-semibold">Check your email.</p>
              <p className="mt-2 leading-relaxed text-site-mist">
                We sent a sign-in link to <span className="text-site-paper">{email}</span>. It works once and expires in 15 minutes.
              </p>
              {devLink ? (
                <p className="mt-4 break-all text-sm text-site-dim">
                  Local only, no email provider set: <a className="text-site-mint underline" href={devLink}>open the link</a>
                </p>
              ) : null}
              <button type="button" className="mt-5 text-sm text-site-mist underline hover:text-site-paper" onClick={() => setState("idle")}>
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8">
              <p className="leading-relaxed text-site-mist">No password. We email you a one-time link.</p>
              <label htmlFor="email" className="mt-6 block text-sm font-semibold">
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
                className="mt-2 w-full rounded-md border border-site-rule bg-site-ink-2 px-4 py-3 text-site-paper placeholder:text-site-dim focus:border-site-violet"
                placeholder="you@company.com"
              />
              {error ? (
                <p className="mt-3 text-sm text-site-alarm" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={state === "sending"}
                className="mt-5 w-full rounded-md bg-site-violet px-5 py-3 font-semibold text-site-paper transition-colors hover:bg-site-violet-hi disabled:opacity-60"
              >
                {state === "sending" ? "Sending…" : "Email me a sign-in link"}
              </button>
              <p className="mt-6 text-sm leading-relaxed text-site-dim">
                Learners: your admin's invite email has a link that signs you in. New to Dry Run Cyber? Sign in and set up your organization.
              </p>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
