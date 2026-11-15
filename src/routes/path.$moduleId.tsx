import { createFileRoute, Link } from "@tanstack/react-router";
import { getModule, lessonsFor } from "@/content/curriculum";
import { ShareButton } from "@/components/share-button";
import { Missing, buttonClass } from "@/components/ui";
import { moduleMastery, useProgress } from "@/lib/progress";

export const Route = createFileRoute("/path/$moduleId")({
  head: ({ params }) => ({
    meta: [{ title: `${getModule(params.moduleId)?.title ?? "Module"} · Meridian` }],
  }),
  component: ModulePage,
});

function ModulePage() {
  const { moduleId } = Route.useParams();
  const module = getModule(moduleId);
  const lessons = useProgress((state) => state.lessons);
  if (!module) return <Missing what="module" />;
  const group = lessonsFor(module.id);

  return (
    <div className="enter mx-auto w-full max-w-3xl">
      <Link to="/path" className="text-sm text-muted underline-offset-4 hover:underline">
        Path
      </Link>
      <p className="mt-4 text-sm text-faint">Module {module.num}</p>
      <h1 className="mt-2 font-display text-4xl text-balance md:text-5xl">{module.title}</h1>
      <p className="mt-4 text-pretty text-muted">{module.summary}</p>
      <p className="mt-3 text-sm tabular-nums text-faint">Mastery {moduleMastery(module.id, lessons)}%</p>
      <div className="mt-5">
        <ShareButton
          label="Share this module"
          title={`Meridian · ${module.title}`}
          text={`Module ${module.num} of Meridian: ${module.title}. ${module.summary}`}
          path={`/path/${module.id}`}
        />
      </div>
      <ol className="mt-8">
        {group.map((lesson, index) => {
          const record = lessons[lesson.id];
          return (
            <li key={lesson.id} className="border-t border-line">
              <Link
                to="/lesson/$lessonId"
                params={{ lessonId: lesson.id }}
                className="flex items-baseline justify-between gap-4 py-4"
              >
                <span>
                  <span className="block text-sm tabular-nums text-faint">
                    {String(index + 1).padStart(2, "0")} · {lesson.minutes} min
                  </span>
                  <span className="mt-1 block font-display text-2xl text-fg">{lesson.title}</span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted">
                  {record ? `${record.best}` : "Open"}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <Link to="/drills" className={`${buttonClass({ variant: "secondary" })} mt-6`}>
        Drills for this floor
      </Link>
    </div>
  );
}
