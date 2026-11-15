import { createFileRoute, Link } from "@tanstack/react-router";
import { LESSONS, MODULES, lessonsFor } from "@/content/curriculum";
import { moduleMastery, useProgress } from "@/lib/progress";

export const Route = createFileRoute("/path/")({
  head: () => ({ meta: [{ title: "Path · Meridian" }] }),
  component: PathPage,
});

function PathPage() {
  const lessons = useProgress((state) => state.lessons);

  return (
    <div className="enter mx-auto w-full max-w-3xl">
      <p className="text-sm text-faint">Curriculum</p>
      <h1 className="mt-2 font-display text-4xl text-balance md:text-5xl">Eight modules. One pause.</h1>
      <p className="mt-4 text-pretty text-muted">
        Take them in order once. Any lesson opens on its own link, so you can hand a single briefing to someone
        else. {LESSONS.length} lessons, each with a field rule and a short check.
      </p>
      <p className="mt-3 text-sm">
        <Link to="/glossary" className="text-fg underline-offset-4 hover:underline">
          Glossary
        </Link>
      </p>
      <ol className="mt-8">
        {MODULES.map((module) => {
          const group = lessonsFor(module.id);
          const done = group.filter((lesson) => lessons[lesson.id]).length;
          return (
            <li key={module.id} className="border-t border-line">
              <Link
                to="/path/$moduleId"
                params={{ moduleId: module.id }}
                className="grid grid-cols-[auto_1fr_auto] items-baseline gap-4 py-5"
              >
                <span className="font-display text-2xl text-faint">{module.num}</span>
                <span>
                  <span className="block font-display text-3xl text-fg">{module.title}</span>
                  <span className="mt-2 block text-pretty text-muted">{module.summary}</span>
                  <span className="mt-2 block text-sm tabular-nums text-faint">
                    {done}/{group.length} filed · mastery {moduleMastery(module.id, lessons)}%
                  </span>
                </span>
                <span className="text-sm text-muted">Open</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
