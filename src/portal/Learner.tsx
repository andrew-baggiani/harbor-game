// A learner's home, and the first-run setup for someone with no workspace yet.
import { useState, type FormEvent } from "react";
import { WEEK } from "@/game/week";
import { api, type Brand, type Membership } from "@/site/portal-api";
import { Podium, useBoard } from "@/portal/Org";
import type { View } from "@/routes/portal";
import { Building, LiveDot, Lock, Panel, PanelHead, Pill, Play, SCENARIOS, Users, btn, field, useToast } from "@/portal/ui";

export function LearnerHome({ orgId, membership, brand }: { orgId: string; membership?: Membership; brand?: Brand | null }) {
  const board = useBoard(orgId);
  const toast = useToast();
  const [name, setName] = useState(membership?.displayName ?? "");
  const mine = board?.rows.find((r) => r.you);
  const done = !!mine?.complete;

  return (
    <div className="space-y-6">
      <section className="aurora px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            {brand ? (
              <p className="mb-4 flex items-center gap-3 text-sm text-site-mist">
                {brand.logo ? <img src={brand.logo} alt={brand.name} className="h-10 max-w-[170px] rounded-lg bg-white/95 object-contain px-2 py-1" /> : null}
                <span>
                  Training from <span className="font-semibold text-site-paper">{brand.name}</span>
                </span>
              </p>
            ) : null}
            <p className="text-site-mist">{membership?.orgName ?? "Your team"}</p>
            <h1 className="display mt-1 text-[clamp(2.1rem,5vw,3.4rem)] font-extrabold leading-[1.02]" style={{ fontStretch: "118%" }}>
              {done ? "Shift complete." : mine ? "Pick up where you left off." : "Your shift starts tonight."}
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-site-mist">
              {done
                ? "Nice work. You can replay Monday any time; your best run is the one that counts."
                : "Monday is about 20 minutes: nine moments at the front desk where an attacker tries their luck. Make the call, see what happens next."}
            </p>
            <a href="/play" className={`${btn.primary} mt-7 !px-6 !py-3.5 text-[17px]`}>
              <Play /> {done ? "Play again" : mine ? "Resume Monday" : "Start Monday"}
            </a>
          </div>
          {mine ? (
            <div className="rounded-3xl border border-white/10 bg-black/25 px-8 py-6 text-center backdrop-blur-sm">
              <div className="text-sm text-site-mist">You're ranked</div>
              <div className="num text-6xl font-extrabold">#{mine.rank}</div>
              <div className="num mt-1 text-site-mist">{mine.score} points</div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel>
          <PanelHead title="Team standings" action={<LiveDot />} />
          <div className="mt-8">
            <Podium board={board} />
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel>
            <PanelHead title="Your name on the board" hint="Leave it blank to stay anonymous as “Teammate N”." />
            <form
              className="mt-4 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api("/api/org", { action: "displayName", orgId, displayName: name });
                  toast(name.trim() ? `You'll show as ${name.trim()}.` : "You're anonymous on the board.");
                } catch (err) {
                  toast((err as Error).message, "err");
                }
              }}
            >
              <label htmlFor="dn" className="sr-only">
                Display name
              </label>
              <input id="dn" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="Maria O." className={field} />
              <button type="submit" className={btn.ghost}>
                Save
              </button>
            </form>
          </Panel>
          <Panel>
            <PanelHead title="What Monday covers" />
            <ul className="mt-4 space-y-2 text-[14.5px] text-site-mist">
              {SCENARIOS.map((s) => (
                <li key={s.id} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-site-violet-hi" /> {s.name}
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <PanelHead title="Later this week" />
            <ul className="mt-4 space-y-2.5">
              {WEEK.filter((w) => w.status === "soon").map((w) => (
                <li key={w.day} className="flex items-center justify-between gap-3 text-[14.5px]">
                  <span>
                    <b>{w.day}</b> <span className="text-site-dim">· {w.title}</span>
                  </span>
                  <Pill tone="dim">
                    <Lock size={12} /> Soon
                  </Pill>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function Setup({ onDone }: { onDone: (v: View) => void }) {
  const [kind, setKind] = useState<"partner" | "org">("partner");
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (kind === "org") {
        const o = await api<{ id: string }>("/api/org", { action: "create", name, domain });
        onDone({ kind: "org", id: o.id, tab: "people" });
      } else {
        // Partner workspaces come from an approved application.
        window.location.href = "/partners#apply";
        return;
      }
    } catch (error) {
      setErr((error as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-2xl">
      <section className="aurora px-6 py-9 sm:px-10">
        <h1 className="display text-[clamp(2rem,4.6vw,3rem)] font-extrabold leading-[1.03]" style={{ fontStretch: "118%" }}>
          Let's set up your workspace.
        </h1>
        <p className="mt-3 text-[17px] text-site-mist">Takes a minute. If someone invited you to play, open the link in their email instead.</p>
      </section>
      <form onSubmit={submit} className="panel mt-6 space-y-6">
        <fieldset>
          <legend className="text-sm font-semibold">Who's this for?</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["partner", "My MSP's clients", "Apply for partner access: 25 free internal seats, one portal for every client.", <Building key="i" size={22} />],
                ["org", "My own company", "Start a free 14-day trial for up to 10 people.", <Users key="i" size={22} />],
              ] as const
            ).map(([k, label, hint, icon]) => (
              <label key={k} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${kind === k ? "border-site-violet bg-site-violet/10" : "border-white/10 hover:border-white/20"}`}>
                <input type="radio" name="kind" className="sr-only" checked={kind === k} onChange={() => setKind(k)} />
                <span className={kind === k ? "text-site-violet-hi" : "text-site-dim"}>{icon}</span>
                <span>
                  <span className="block font-semibold">{label}</span>
                  <span className="mt-0.5 block text-sm text-site-dim">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="name" className="block text-sm font-semibold">
            {kind === "org" ? "Company name" : "MSP name"}
          </label>
          <input id="name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={`mt-2 ${field}`} />
        </div>
        {kind === "org" ? (
          <div>
            <label htmlFor="domain" className="block text-sm font-semibold">
              Email domain <span className="font-normal text-site-dim">(optional)</span>
            </label>
            <input id="domain" placeholder="company.com" value={domain} onChange={(e) => setDomain(e.target.value)} className={`mt-2 ${field}`} />
          </div>
        ) : null}
        {err ? (
          <p className="text-sm text-site-alarm" role="alert">
            {err}
          </p>
        ) : null}
        <button type="submit" disabled={busy || !name.trim()} className={`${btn.primary} w-full !py-3`}>
          {busy ? "Creating…" : "Create workspace"}
        </button>
      </form>
    </div>
  );
}
