import { createFileRoute } from "@tanstack/react-router";
import { FRAMEWORK_LABEL, coverage, type CoverageRow, type Framework } from "@/content/controls";
import { getLesson } from "@/content/curriculum";
import { mondayScenarios } from "@/game/scenarios";
import { shiftById, weekScenarios } from "@/content/week";
import { ChatWidget } from "@/site/ChatWidget";
import { CONTACT, SiteFooter, SiteNav, SkipLink } from "@/site/SiteChrome";

export const Route = createFileRoute("/coverage")({
  head: () => ({
    meta: [
      { title: "Control coverage · Dry Run Cyber" },
      {
        name: "description",
        content:
          "Which NIST, CIS, CMMC, HIPAA and NIST CSF controls the Dry Run Cyber week of shifts, role tracks, monthly reminders and lessons map to.",
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

/** Why a gap is still open, and what closes it. Empty now that role tracks and monthly reminders ship. */
const PLANNED: Record<string, string> = {};

const ORDER: Framework[] = ["NIST53", "NIST171", "CMMC", "HIPAA", "CIS", "CSF"];

function shiftControls(): Record<string, string[]> {
  const extra: Record<string, string[]> = {};
  for (const scenario of [...mondayScenarios, ...weekScenarios]) {
    const ids: string[] = [];
    for (const [framework, list] of Object.entries(scenario.controls)) {
      const map = FRAMEWORK_ID[framework] ?? ((id: string) => id);
      for (const id of list) ids.push(map(id));
    }
    extra[scenario.id] = ids;
  }
  return extra;
}

function source(id: string): { kind: "Monday" | "Week" | "Track" | "Reminder" | "Lesson" | "Drill"; label: string } {
  if (BEAT_NAME[id]) return { kind: "Monday", label: BEAT_NAME[id] };
  if (id.startsWith("REM-")) return { kind: "Reminder", label: "Monthly reminders" };
  const week = weekScenarios.find((s) => s.id === id);
  if (week) {
    const shift = shiftById(week.day);
    if (shift?.kind === "track") return { kind: "Track", label: `${shift.day}: ${week.prompt.who.toLowerCase()}` };
    return { kind: "Week", label: `${shift?.day ?? week.day}: ${week.prompt.who.toLowerCase()}` };
  }
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
              Every awareness and training control we track, and what in Dry Run Cyber supports it: a decision in one of the week's shifts, a role
              track, a monthly reminder, a lesson, or a drill. This shows what the training maps to. It does not certify your clients against any
              framework.
            </p>
            <p className="mt-4 max-w-[38rem] leading-relaxed text-site-dim">
              Role-based controls are met by short tracks for admins, finance and the help desk, assigned per person in the portal. HIPAA's
              security reminders are met by a one-minute reminder each month. Assigning the tracks and sending the reminders is still on you.
            </p>
          </div>
          <dl className="panel grid grid-cols-3 gap-4 !py-5 text-center">
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
              className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[14px] font-semibold text-site-mist transition hover:border-site-violet hover:text-site-paper"
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

        <section className="aurora mt-24 p-8 sm:p-10">
          <h2 className="text-2xl font-bold" style={{ fontStretch: "112%" }}>Need this mapped to a framework that isn't here?</h2>
          <p className="mt-3 max-w-[40rem] leading-relaxed text-site-mist">
            Tell us what your clients are audited against. Mappings are added as each night of the week ships.
          </p>
          <a
            href={CONTACT}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-site-violet px-6 py-3.5 font-semibold text-white shadow-[0_8px_30px_-8px_rgba(139,44,245,.7)] transition hover:bg-site-violet-hi"
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
  const sources = row.content.map(source).filter((s, i, all) => all.findIndex((x) => x.kind === s.kind && x.label === s.label) === i);
  const monday = sources.filter((s) => s.kind === "Monday");
  return (
    <li className="grid gap-3 py-6 md:grid-cols-[13rem_1fr_minmax(0,22rem)] md:gap-8">
      <p className="font-semibold tabular-nums">{row.control.id.replace(/^CIS-/, "")}</p>
      <p className="leading-relaxed text-site-mist">{row.control.title}</p>
      <div className="text-[15px]">
        {row.gap ? (
          <p>
            <span className="font-semibold text-site-alarm">Not covered yet.</span>{" "}
            <span className="text-site-mist">{PLANNED[row.control.id] ?? "Nothing maps here yet."}</span>
          </p>
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
            {(["Week", "Track", "Reminder", "Lesson", "Drill"] as const).map((kind) => {
              const items = sources.filter((s) => s.kind === kind);
              if (!items.length) return null;
              return (
                <details key={kind} className="group">
                  <summary className="cursor-pointer list-none text-site-mist hover:text-site-paper [&::-webkit-details-marker]:hidden">
                    <span className="underline decoration-site-rule decoration-2 underline-offset-4 group-open:decoration-site-violet">
                      {kind === "Reminder"
                        ? "Monthly reminders"
                        : `${items.length} ${({ Week: ["week beat", "week beats"], Track: ["role-track beat", "role-track beats"], Lesson: ["lesson", "lessons"], Drill: ["drill", "drills"] } as const)[kind][items.length === 1 ? 0 : 1]}`}
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
