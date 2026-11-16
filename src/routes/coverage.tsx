import { createFileRoute, Link } from "@tanstack/react-router";
import { FRAMEWORK_LABEL, coverage, type CoverageRow } from "@/content/controls";
import { getLesson } from "@/content/curriculum";
import { mondayScenarios } from "@/game/scenarios";

export const Route = createFileRoute("/coverage")({
  head: () => ({ meta: [{ title: "Coverage · Dry Run Cyber" }] }),
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

function ContentItem({ id }: { id: string }) {
  if (id.startsWith("drill:")) {
    const drillId = id.slice("drill:".length);
    return (
      <Link to="/drills/$drillId" params={{ drillId }} className="underline-offset-4 hover:underline">
        Drill · {drillId}
      </Link>
    );
  }
  const lesson = getLesson(id);
  if (lesson) {
    return (
      <Link to="/lesson/$lessonId" params={{ lessonId: id }} className="underline-offset-4 hover:underline">
        Lesson · {lesson.title}
      </Link>
    );
  }
  return <span>Monday shift · {id}</span>;
}

function CoveragePage() {
  const rows = coverage(shiftControls());
  const gaps = rows.filter((row) => row.gap);

  return (
    <div className="enter mx-auto w-full max-w-3xl">
      <p className="text-sm text-faint">Maps to, does not certify</p>
      <h1 className="mt-2 font-display text-4xl text-balance md:text-5xl">Coverage</h1>
      <p className="mt-4 text-pretty text-muted">
        Each control lists the lessons, drills, and Monday scenarios that support it. A gap means nothing in this
        program maps there yet. Program-level controls are how the program is run, not a missing lesson.
      </p>
      <p className="mt-6 text-sm tabular-nums text-faint">
        {gaps.length} gaps · {rows.length - gaps.length} controls with content or a program owner
      </p>
      <ul className="mt-6">
        {rows.map((row) => (
          <ControlBlock key={row.control.id} row={row} />
        ))}
      </ul>
    </div>
  );
}

function ControlBlock({ row }: { row: CoverageRow }) {
  return (
    <li className="border-t border-line py-4">
      <p className="font-mono text-xs text-faint">{FRAMEWORK_LABEL[row.control.framework]}</p>
      <h2 className="font-display text-2xl text-fg">{row.control.id}</h2>
      <p className="mt-1 text-sm text-muted">{row.control.title}</p>
      {row.gap ? (
        <p className="mt-2 text-sm text-bad">Gap. No lesson, drill, or Monday scenario maps here yet.</p>
      ) : row.content.length === 0 ? (
        <p className="mt-2 text-sm text-faint">Program-level. Met by cadence, records, and role assignment, not by one lesson.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {row.content.map((id) => (
            <li key={id} className="text-sm text-fg">
              <ContentItem id={id} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
