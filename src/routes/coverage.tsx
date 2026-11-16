import { createFileRoute } from "@tanstack/react-router";
import { FRAMEWORK_LABEL, coverage, type CoverageRow, type Framework } from "@/content/controls";
import { getLesson } from "@/content/curriculum";
import { mondayScenarios } from "@/game/scenarios";
import { ChatWidget } from "@/site/ChatWidget";
import { CONTACT, SiteFooter, SiteNav, SkipLink } from "@/site/SiteChrome";

export const Route = createFileRoute("/coverage")({
  head: () => ({
    meta: [
      { title: "Control coverage · Dry Run Cyber" },
      {
        name: "description",
        content:
          "Which NIST, CIS, CMMC, HIPAA and NIST CSF controls the Dry Run Cyber Monday shift and lessons map to, and where the gaps are.",
      },
      { name: "theme-color", content: "#101319" },
    ],
    links: [{ rel: "icon", href: "/favicon.ico", sizes: "any" }],
  }),
  component: CoveragePage,
});

const FRAMEWORK_ID: Record<string, (id: string) => string> = {
  "CIS_v8.1": (id) => (id.startsWith("CIS-") ? id : `CIS-${id}`),
  "NIST_800-53r5": (id) => id,
  "NIST_800-171r2": (id) => id,
  CMMC_L2: (id) => id,
  HIPAA: (id) => id,
  "CSF_2.0": (id) => id,
};

/** Monday beats, by scenario id, in the words the landing page uses. */
const BEAT_NAME: Record<string, string> = {
  "MON-01-tailgate": "The door",
  "MON-02-phishing": "The inbox",
  "MON-03-vishing": "The call",
  "MON-03-vishing-mfa": "The call",
  "MON-04-usb": "The drive",
  "MON-05-wire": "The wire",
  "MON-06-updates": "The update",
  "MON-07-signin": "The push",
  "MON-08-misdirect": "The send",
  "MON-09-cleandesk": "The desk",
};

const ORDER: Framework[] = ["NIST53", "NIST171", "CMMC", "HIPAA", "CIS", "CSF"];

function shiftControls(): Record<string, string[]> {
  const extra: Record<string, string[]> = {};
  for (const scenario of mondayScenarios) {
    const ids: string[] = [];
    for (const [framework, list] of Object.entries(scenario.controls)) {
      const map = FRAMEWORK_ID[framework] ?? ((id: string) => id);
      for (const id of list) ids.push(map(id));
    }
    extra[scenario.id] = ids;
  }
  return extra;
}

function source(id: string): { kind: "Monday" | "Lesson" | "Drill"; label: string } {
  if (BEAT_NAME[id]) return { kind: "Monday", label: BEAT_NAME[id] };
  if (id.startsWith("drill:")) return { kind: "Drill", label: id.slice("drill:".length).replaceAll("-", " ") };
  const lesson = getLesson(id);
  if (lesson) return { kind: "Lesson", label: lesson.title };
  return { kind: "Monday", label: id };
}

function CoveragePage() {
  const rows = coverage(shiftControls());
  const gaps = rows.filter((r) => r.gap).length;
  const program = rows.filter((r) => !r.gap && r.content.length === 0).length;
  const covered = rows.length - gaps - program;

  return (
    <div className="site min-h-dvh overflow-x-clip">
      <SkipLink />
      <SiteNav />
      <main id="main" className="mx-auto max-w-[1240px] px-6 pb-28 pt-10 md:px-10 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-end lg:gap-16">
          <div>
            <h1 className="display text-[40px] sm:text-[56px] lg:text-[68px]">Control coverage</h1>
            <p className="mt-6 max-w-[38rem] text-lg leading-relaxed text-site-mist">
              Every awareness and training control we track, and what in Dry Run Cyber supports it: a decision in the Monday shift, a lesson, or a
              drill. This shows what the training maps to. It does not certify your clients against any framework.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-4 border-y border-site-rule py-5 text-center">
            <Count n={covered} label="Covered by content" tone="text-site-mint" />
            <Count n={program} label="Met by how the program runs" tone="text-site-paper" />
            <Count n={gaps} label="Gaps today" tone="text-site-alarm" />
          </dl>
        </div>

        <nav aria-label="Frameworks" className="mt-14 flex flex-wrap gap-2">
          {ORDER.map((fw) => (
            <a
              key={fw}
              href={`#fw-${fw}`}
              className="rounded-md border border-site-rule px-3 py-2 text-[14px] text-site-mist transition-colors hover:border-site-violet hover:text-site-paper"
            >
              {FRAMEWORK_LABEL[fw]}
            </a>
          ))}
        </nav>

        {ORDER.map((fw) => {
          const list = rows.filter((r) => r.control.framework === fw);
          if (!list.length) return null;
          return (
            <section key={fw} id={`fw-${fw}`} aria-labelledby={`h-${fw}`} className="mt-16">
              <h2 id={`h-${fw}`} className="text-2xl font-bold sm:text-3xl" style={{ fontStretch: "118%" }}>
                {FRAMEWORK_LABEL[fw]}
              </h2>
              <ul className="mt-6 divide-y divide-site-rule border-y border-site-rule">
                {list.map((row) => (
                  <ControlRow key={row.control.id} row={row} />
                ))}
              </ul>
            </section>
          );
        })}

        <section className="mt-24 rounded-[10px] bg-site-ink-2 p-8 sm:p-10">
          <h2 className="text-2xl font-bold" style={{ fontStretch: "112%" }}>Need this mapped to a framework that isn't here?</h2>
          <p className="mt-3 max-w-[40rem] leading-relaxed text-site-mist">
            Tell us what your clients are audited against. Mappings are added as each night of the week ships.
          </p>
          <a
            href={CONTACT}
            className="mt-6 inline-block rounded-md bg-site-violet px-6 py-3.5 font-semibold text-white transition-colors hover:bg-site-violet-hi"
          >
            Email hello@dryruncyber.com
          </a>
        </section>
      </main>
      <SiteFooter />
      <ChatWidget />
    </div>
  );
}

function Count({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className={`text-4xl font-extrabold tabular-nums ${tone}`} style={{ fontStretch: "118%" }}>
        {n}
      </dd>
      <dd className="mt-1 text-[13px] leading-snug text-site-dim" aria-hidden="true">
        {label}
      </dd>
    </div>
  );
}

function ControlRow({ row }: { row: CoverageRow }) {
  const sources = row.content.map(source);
  const monday = sources.filter((s) => s.kind === "Monday");
  return (
    <li className="grid gap-3 py-6 md:grid-cols-[13rem_1fr_minmax(0,22rem)] md:gap-8">
      <p className="font-semibold tabular-nums">{row.control.id.replace(/^CIS-/, "")}</p>
      <p className="leading-relaxed text-site-mist">{row.control.title}</p>
      <div className="text-[15px]">
        {row.gap ? (
          <p className="text-site-alarm">Gap. Nothing maps here yet.</p>
        ) : sources.length === 0 ? (
          <p className="text-site-dim">Met by how the program is run: cadence, records and roles.</p>
        ) : (
          <div className="space-y-2">
            {monday.length > 0 && (
              <p>
                <span className="text-site-mint">Monday shift: </span>
                <span className="text-site-paper">{monday.map((s) => s.label).join(", ")}</span>
              </p>
            )}
            {(["Lesson", "Drill"] as const).map((kind) => {
              const items = sources.filter((s) => s.kind === kind);
              if (!items.length) return null;
              return (
                <details key={kind} className="group">
                  <summary className="cursor-pointer list-none text-site-mist hover:text-site-paper [&::-webkit-details-marker]:hidden">
                    <span className="underline decoration-site-rule decoration-2 underline-offset-4 group-open:decoration-site-violet">
                      {items.length} {kind === "Lesson" ? (items.length === 1 ? "lesson" : "lessons") : items.length === 1 ? "drill" : "drills"}
                    </span>
                  </summary>
                  <ul className="mt-2 space-y-1 border-l border-site-rule pl-3 text-site-paper">
                    {items.map((s, i) => (
                      <li key={i} className="first-letter:uppercase">{s.label}</li>
                    ))}
                  </ul>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </li>
  );
}
