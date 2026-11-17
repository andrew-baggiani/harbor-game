import { createFileRoute } from "@tanstack/react-router";
import { mondayScenarios } from "@/game/scenarios";
import { SiteFooter, SiteNav, SkipLink } from "@/site/SiteChrome";
import { Download, Pill, btn } from "@/portal/ui";

export const Route = createFileRoute("/sample-record")({
  head: () => ({
    meta: [
      { title: "Sample training record · Dry Run Cyber" },
      { name: "description", content: "What a Dry Run Cyber training record looks like: every decision in the Monday shift, the outcome, and the controls it maps to." },
      { name: "theme-color", content: "#101319" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico", sizes: "any" }],
  }),
  component: SampleRecord,
});

const BEAT: Record<string, string> = {
  "MON-01-tailgate": "The door: someone without a badge wants it held",
  "MON-02-phishing": "The inbox: a password-reset email",
  "MON-03-vishing-mfa": "The call: \"IT\" asks for the code on your phone",
  "MON-04-usb": "The drive: a USB stick by the elevator",
  "MON-05-wire": "The wire: an urgent payment with new bank details",
  "MON-06-updates": "The update: a restart prompt mid-deadline",
  "MON-07-signin": "The push: a sign-in approval you didn't start",
  "MON-08-misdirect": "The send: autocomplete picks the wrong person",
  "MON-09-cleandesk": "The desk: end of shift",
};
const FW: Record<string, string> = {
  "NIST_800-53r5": "NIST 800-53",
  "NIST_800-171r2": "NIST 800-171",
  CMMC_L2: "CMMC L2",
  HIPAA: "HIPAA",
  "CIS_v8.1": "CIS v8.1",
  "CSF_2.0": "CSF 2.0",
};

const LEARNER = { name: "Jordan Avery", email: "jordan.avery@acmefreight.example", org: "Acme Freight", partner: "Northbridge IT" };
const START = Date.UTC(2026, 10, 16, 0, 4); // Mon Nov 16 2026, 7:04 PM Eastern
const MISSED = "MON-07-signin";

type Choice = { id: string; label: string; ok?: boolean };
const ROWS = mondayScenarios.map((s, i) => {
  const choices = (s as unknown as { choices: Choice[] }).choices;
  const missed = s.id === MISSED;
  const choice = missed ? choices.find((c) => !c.ok)! : choices.find((c) => c.ok)!;
  return {
    ts: START + i * 128_000,
    id: s.id,
    beat: BEAT[s.id] ?? s.id,
    choice: choice.label,
    choiceId: choice.id,
    good: !missed,
    points: missed ? 0 : 100,
    controls: s.controls as Record<string, string[]>,
  };
});
const DONE = ROWS[ROWS.length - 1].ts + 40_000;
const SCORE = ROWS.reduce((a, r) => a + r.points, 0) + 50;

const time = (ms: number) => new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });

function csv() {
  const head = ["timestamp_utc", "learner", "organization", "shift", "event", "scenario", "choice", "correct", "points", "controls"];
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = ROWS.map((r) =>
    [
      new Date(r.ts).toISOString(),
      LEARNER.email,
      LEARNER.org,
      "monday",
      "decision",
      r.id,
      r.choice,
      r.good ? "yes" : "no",
      r.points,
      Object.entries(r.controls)
        .map(([k, v]) => `${FW[k] ?? k}: ${v.join(" ")}`)
        .join("; "),
    ]
      .map(q)
      .join(","),
  );
  lines.push([new Date(DONE).toISOString(), LEARNER.email, LEARNER.org, "monday", "shift_complete", "", "", "", 50, ""].map(q).join(","));
  return [head.join(","), ...lines].join("\n");
}

function SampleRecord() {
  const download = () => {
    const url = URL.createObjectURL(new Blob([csv()], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "dry-run-cyber-sample-record.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="site min-h-dvh overflow-x-clip">
      <SkipLink />
      <div className="no-print">
        <SiteNav />
      </div>
      <main id="main" className="mx-auto max-w-[1040px] px-6 pb-28 pt-10 md:px-10 lg:pt-16">
        <div className="no-print flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="display text-[40px] sm:text-[56px]">A sample record</h1>
            <p className="mt-5 max-w-[36rem] text-lg leading-relaxed text-site-mist">
              This is what an admin or auditor gets for one person who finished Monday. The learner and company are made up; the controls are the ones the shift
              really maps to.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={btn.primary} onClick={download}>
              <Download size={17} /> Download CSV
            </button>
            <button type="button" className={btn.ghost} onClick={() => window.print()}>
              Print or save as PDF
            </button>
          </div>
        </div>

        <article className="record panel mt-10 !p-6 sm:!p-10" aria-label="Training record">
          <header className="flex flex-wrap items-start justify-between gap-6 border-b border-white/[0.08] pb-6">
            <div>
              <p className="text-sm text-site-dim">Security awareness training record</p>
              <p className="mt-1 text-2xl font-bold" style={{ fontStretch: "112%" }}>
                {LEARNER.name}
              </p>
              <p className="text-site-mist">
                {LEARNER.email} · {LEARNER.org}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-[15px]">
              <dt className="text-site-dim">Shift</dt>
              <dd>Monday: First night</dd>
              <dt className="text-site-dim">Completed</dt>
              <dd>Nov 16, 2026, {time(DONE)} ET</dd>
              <dt className="text-site-dim">Result</dt>
              <dd>
                8 of 9 correct · {SCORE} points
              </dd>
              <dt className="text-site-dim">Managed by</dt>
              <dd>{LEARNER.partner}</dd>
            </dl>
          </header>

          <ol className="divide-y divide-white/[0.06]">
            {ROWS.map((r) => (
              <li key={r.id} className="grid gap-3 py-5 md:grid-cols-[5.5rem_1fr_minmax(0,17rem)] md:gap-6">
                <span className="num text-[15px] text-site-dim">{time(r.ts)}</span>
                <div>
                  <p className="font-semibold">{r.beat}</p>
                  <p className="mt-1 text-site-mist">
                    Chose: {r.choice}{" "}
                    <span className="ml-1 inline-block align-middle">
                      <Pill tone={r.good ? "mint" : "alarm"} dot>
                        {r.good ? "Correct" : "Missed"}
                      </Pill>
                    </span>
                  </p>
                </div>
                <ul className="space-y-0.5 text-[13.5px] text-site-mist">
                  {Object.entries(r.controls)
                    .filter(([, v]) => v.length)
                    .map(([k, v]) => (
                      <li key={k}>
                        <span className="text-site-dim">{FW[k] ?? k}</span> {v.join(", ")}
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ol>
          <footer className="border-t border-white/[0.08] pt-5 text-sm leading-relaxed text-site-dim">
            Each line is stored as an xAPI statement with the learner, the choice, the outcome and a timestamp. Records show what the training maps to; they
            don't certify an organization against any framework.
          </footer>
        </article>
        <p className="no-print mt-8 text-sm text-site-dim">
          Where records are kept and who can see them: <a href="/privacy" className="text-site-paper underline decoration-white/25 underline-offset-4">privacy</a>.
        </p>
      </main>
      <div className="no-print">
        <SiteFooter />
      </div>
    </div>
  );
}
