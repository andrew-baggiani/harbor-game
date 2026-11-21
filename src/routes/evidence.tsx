import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/site/portal-api";
import type { EvidencePack } from "@/server/evidence";

// A client's training evidence as a one-document record for an insurer or auditor.
// Laid out for print: "Save as PDF" turns it into the PDF. Client admins and their MSP only.
export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [{ title: "Training evidence · Dry Run Cyber" }, { name: "robots", content: "noindex" }],
  }),
  component: EvidencePage,
});

const FRAMEWORK: Record<string, string> = {
  "NIST_800-53r5": "NIST SP 800-53 Rev. 5",
  "NIST_800-171r2": "NIST SP 800-171 Rev. 2",
  CMMC_L2: "CMMC Level 2",
  HIPAA: "HIPAA Security Rule",
  "CIS_v8.1": "CIS Controls v8.1",
  "CSF_2.0": "NIST CSF 2.0",
};

const day = (ms: number | null) => (ms ? new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "No activity yet");
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "–");

function EvidencePage() {
  const [pack, setPack] = useState<EvidencePack | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    const org = new URLSearchParams(window.location.search).get("org");
    if (!org) return setErr("No client selected.");
    api<EvidencePack>(`/api/evidence?org=${encodeURIComponent(org)}`)
      .then(setPack)
      .catch((e: Error) => setErr(e.message));
  }, []);

  if (err) return <Shell><p className="text-lg">{err}</p></Shell>;
  if (!pack) return <Shell><p className="text-lg text-neutral-500">Building the record…</p></Shell>;

  const brand = pack.partner.brand;
  const byFw = new Map<string, EvidencePack["controls"]>();
  for (const c of pack.controls) byFw.set(c.framework, [...(byFw.get(c.framework) ?? []), c]);

  return (
    <Shell>
      <div className="mb-8 flex flex-wrap items-center gap-3 print:hidden">
        <button type="button" onClick={() => window.print()} className="rounded-lg bg-[#8b2cf5] px-5 py-2.5 font-semibold text-white hover:bg-[#9d4bff]">
          Save as PDF
        </button>
        <a href="/portal" className="rounded-lg border border-neutral-300 px-5 py-2.5 font-semibold text-neutral-800 hover:bg-neutral-100">
          Back to the portal
        </a>
        <span className="text-sm text-neutral-500">In the print window, choose "Save as PDF" as the printer.</span>
      </div>

      <header className="flex items-start justify-between gap-6 border-b-2 border-neutral-900 pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Security awareness training record</p>
          <h1 className="mt-1 text-[28px] font-extrabold leading-tight text-neutral-950">{pack.org.name}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Training period: {day(pack.period.from)} to {day(pack.period.to)}
          </p>
        </div>
        <div className="text-right">
          {brand?.logo ? <img src={brand.logo} alt={brand.name} className="ml-auto h-12 max-w-[200px] object-contain" /> : null}
          <p className="mt-1 text-sm font-semibold text-neutral-800">{brand?.name ?? pack.partner.name ?? "Dry Run Cyber"}</p>
          {brand || pack.partner.name ? <p className="text-[11px] text-neutral-500">Training delivered with Dry Run Cyber</p> : null}
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-neutral-300 bg-neutral-300 sm:grid-cols-4 print:grid-cols-4">
        {[
          ["People enrolled", String(pack.totals.people)],
          ["Trained", `${pack.totals.trained} (${pct(pack.totals.trained, pack.totals.people)})`],
          ["Decisions recorded", String(pack.totals.decisions)],
          ["Right calls", pct(pack.totals.correct, pack.totals.decisions)],
        ].map(([k, v]) => (
          <div key={k} className="bg-white px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">{k}</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-neutral-950">{v}</p>
          </div>
        ))}
      </section>

      <Section title="People and completions">
        <table className="w-full text-left text-[13px]">
          <thead className="text-[11px] uppercase tracking-[0.1em] text-neutral-500">
            <tr className="border-b border-neutral-300">
              <th className="py-2 pr-3 font-semibold">Person</th>
              <th className="py-2 pr-3 font-semibold">Shifts completed</th>
              <th className="py-2 pr-3 text-right font-semibold">Decisions</th>
              <th className="py-2 pr-3 text-right font-semibold">Right calls</th>
              <th className="py-2 text-right font-semibold">Last active</th>
            </tr>
          </thead>
          <tbody>
            {pack.people.map((p) => (
              <tr key={p.email} className="border-b border-neutral-200 align-top">
                <td className="py-2 pr-3">
                  <span className="font-semibold text-neutral-900">{p.name ?? p.email}</span>
                  {p.name ? <span className="block text-neutral-500">{p.email}</span> : null}
                </td>
                <td className="py-2 pr-3 text-neutral-700">{p.shifts.length ? p.shifts.join(", ") : <span className="text-[#b4231a]">Not started</span>}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{p.decisions}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{pct(p.correct, p.decisions)}</td>
                <td className="py-2 text-right text-neutral-600">{p.lastActive ? new Date(p.lastActive).toLocaleDateString("en-US") : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Controls this training supports">
        {byFw.size === 0 ? (
          <p className="text-sm text-neutral-600">No decisions recorded yet.</p>
        ) : (
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 print:grid-cols-2">
            {[...byFw.entries()].map(([fw, list]) => (
              <div key={fw} className="break-inside-avoid">
                <p className="text-sm font-bold text-neutral-900">{FRAMEWORK[fw] ?? fw}</p>
                <ul className="mt-1.5 space-y-1 text-[13px]">
                  {list.map((c) => (
                    <li key={c.control} className="flex justify-between gap-3 border-b border-neutral-200 pb-1">
                      <span className="font-mono text-neutral-800">{c.control}</span>
                      <span className="text-neutral-500">
                        {c.decisions} {c.decisions === 1 ? "decision" : "decisions"}, {c.people} {c.people === 1 ? "person" : "people"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Scenarios and results">
        <table className="w-full text-left text-[13px]">
          <thead className="text-[11px] uppercase tracking-[0.1em] text-neutral-500">
            <tr className="border-b border-neutral-300">
              <th className="py-2 pr-3 font-semibold">Scenario</th>
              <th className="py-2 pr-3 text-right font-semibold">Decisions</th>
              <th className="py-2 text-right font-semibold">Right calls</th>
            </tr>
          </thead>
          <tbody>
            {pack.scenarios.map((s) => (
              <tr key={s.id} className="border-b border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-800">{s.label}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{s.decisions}</td>
                <td className="py-1.5 text-right tabular-nums">{pct(s.correct, s.decisions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Statement">
        <p className="text-[13px] leading-relaxed text-neutral-700">
          This record lists security awareness training completed by people at {pack.org.name} in Dry Run Cyber, a first-person training game. Each decision was
          recorded when it was made and scored by the platform, not self-reported. Control mappings show which framework requirements the training content
          supports; they describe training coverage, not a full assessment of the organization's controls.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-10 text-[13px] text-neutral-600">
          <div className="border-t border-neutral-400 pt-1.5">Prepared by{brand || pack.partner.name ? `, ${brand?.name ?? pack.partner.name}` : ""}</div>
          <div className="border-t border-neutral-400 pt-1.5">Reviewed by, {pack.org.name}</div>
        </div>
      </Section>

      <footer className="mt-10 border-t border-neutral-300 pt-3 text-[11px] text-neutral-500">
        Generated {day(pack.generatedAt)} from the Dry Run Cyber decision log. Record {pack.org.id}. The full decision-by-decision log is available as a CSV
        export from the portal.
      </footer>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-neutral-100 py-8 print:bg-white print:py-0">
      <style>{`@page { size: letter; margin: 14mm; } @media print { html, body { background: #fff !important; } }`}</style>
      <main className="mx-auto max-w-[860px] bg-white px-8 py-10 text-neutral-900 shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none" style={{ fontFamily: "var(--font-text, system-ui), sans-serif" }}>
        {children}
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 break-inside-avoid-page">
      <h2 className="mb-3 text-[15px] font-extrabold uppercase tracking-[0.08em] text-neutral-950">{title}</h2>
      {children}
    </section>
  );
}
