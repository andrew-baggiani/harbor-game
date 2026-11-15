import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { getLesson, getModule, neighborLessons } from "@/content/curriculum";
import { GrantLine } from "@/components/debrief";
import { ShareButton } from "@/components/share-button";
import { Button, Missing, buttonClass } from "@/components/ui";
import type { Grant } from "@/lib/progress";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lesson/$lessonId")({
  head: ({ params }) => ({
    meta: [{ title: `${getLesson(params.lessonId)?.title ?? "Lesson"} · Meridian` }],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const lesson = getLesson(lessonId);
  const record = useProgress((state) => state.lessons[lessonId]);
  const recordLesson = useProgress((state) => state.recordLesson);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [grant, setGrant] = useState<Grant | null>(null);
  const filed = useRef(false);
  const [seen, setSeen] = useState(lessonId);
  if (seen !== lessonId) {
    setSeen(lessonId);
    setPicked({});
    setSubmitted(false);
    setGrant(null);
    filed.current = false;
  }

  if (!lesson) return <Missing what="lesson" />;
  const module = getModule(lesson.moduleId);
  const neighbors = neighborLessons(lesson.id);
  const complete = lesson.questions.every((question) => picked[question.id] != null);
  const correctCount = lesson.questions.filter((question) => picked[question.id] === question.answer).length;

  function submit() {
    if (!lesson || filed.current || !complete) return;
    const wrong: string[] = [];
    const right: string[] = [];
    for (const question of lesson.questions) {
      if (picked[question.id] === question.answer) right.push(question.id);
      else wrong.push(question.id);
    }
    const pct = Math.round((correctCount / lesson.questions.length) * 100);
    filed.current = true;
    setGrant(recordLesson(lesson.id, pct, wrong, right));
    setSubmitted(true);
  }

  function retake() {
    filed.current = false;
    setPicked({});
    setSubmitted(false);
    setGrant(null);
  }

  return (
    <article className="enter mx-auto w-full max-w-prose">
      {module ? (
        <Link
          to="/path/$moduleId"
          params={{ moduleId: module.id }}
          className="text-sm text-muted underline-offset-4 hover:underline"
        >
          {module.num} {module.title}
        </Link>
      ) : null}
      <h1 className="mt-4 font-display text-4xl text-balance md:text-5xl">{lesson.title}</h1>
      <p className="mt-3 text-sm text-faint">
        {lesson.minutes} min
        {record ? ` · best on record ${record.best}` : ""}
      </p>
      <div className="mt-5">
        <ShareButton
          label="Share this lesson"
          title={`Meridian · ${lesson.title}`}
          text={`Lesson on Meridian: ${lesson.title}. Field rule: ${lesson.fieldRule}`}
          path={`/lesson/${lesson.id}`}
        />
      </div>

      <div className="mt-8 space-y-8">
        {lesson.sections.map((section, index) => (
          <section key={section.heading} className="grid grid-cols-[auto_1fr] gap-4">
            <p className="pt-1 font-mono text-xs text-faint">{String(index + 1).padStart(2, "0")}</p>
            <div>
              <h2 className="font-display text-2xl text-balance">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-pretty leading-relaxed text-fg">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <blockquote className="mt-10 border-l border-line pl-4">
        <p className="text-sm text-faint">Field rule</p>
        <p className="mt-2 font-display text-2xl text-pretty text-fg">{lesson.fieldRule}</p>
      </blockquote>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-3xl">Check</h2>
        <p className="mt-2 text-sm text-muted">
          Three questions. Filing keeps your best score. Misses land in review until you clear them.
        </p>
        <div className="mt-6 space-y-8">
          {lesson.questions.map((question, questionIndex) => {
            const choice = picked[question.id];
            return (
              <fieldset key={question.id} disabled={submitted}>
                <legend className="text-pretty font-medium text-fg">
                  <span className="mr-2 font-mono text-xs text-faint">{questionIndex + 1}</span>
                  {question.prompt}
                </legend>
                <div className="mt-3 grid gap-2">
                  {question.choices.map((label, choiceIndex) => {
                    const selected = choice === choiceIndex;
                    const show = submitted && (selected || choiceIndex === question.answer);
                    const right = choiceIndex === question.answer;
                    return (
                      <label
                        key={label}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-start gap-3 rounded-md border px-3 py-3",
                          selected ? "border-line-strong bg-elevated" : "border-line bg-sunken",
                          submitted && right && "border-ok",
                          submitted && selected && !right && "border-bad",
                        )}
                      >
                        <input
                          type="radio"
                          className="mt-1"
                          name={question.id}
                          checked={selected}
                          onChange={() =>
                            setPicked((current) => ({ ...current, [question.id]: choiceIndex }))
                          }
                        />
                        <span>
                          <span className="text-pretty">{label}</span>
                          {show ? (
                            <span className={right ? "mt-1 block text-sm text-ok" : "mt-1 block text-sm text-bad"}>
                              {right ? "Answer" : "Not this one"}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {submitted ? <p className="mt-3 text-sm text-pretty text-muted">{question.why}</p> : null}
              </fieldset>
            );
          })}
        </div>
        {!submitted ? (
          <Button className="mt-6" onClick={submit} disabled={!complete}>
            File the check
          </Button>
        ) : (
          <div className="mt-6">
            <p className="font-display text-5xl tabular-nums">
              {Math.round((correctCount / lesson.questions.length) * 100)}
            </p>
            <p className="text-sm text-muted">
              {correctCount} of {lesson.questions.length}
            </p>
            {grant ? (
              <div className="mt-3">
                <GrantLine grant={grant} />
              </div>
            ) : null}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button variant="secondary" onClick={retake}>
                Retake
              </Button>
              {neighbors.next ? (
                <Link
                  to="/lesson/$lessonId"
                  params={{ lessonId: neighbors.next.id }}
                  className={buttonClass()}
                >
                  Next lesson
                </Link>
              ) : (
                <Link to="/drills" className={buttonClass()}>
                  Go to drills
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </article>
  );
}
