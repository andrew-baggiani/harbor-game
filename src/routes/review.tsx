import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { findQuestion } from "@/content/curriculum";
import { Button } from "@/components/ui";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/review")({
  head: () => ({ meta: [{ title: "Review · Dry Run Cyber" }] }),
  component: ReviewPage,
});

function ReviewPage() {
  const missed = useProgress((state) => state.missed);
  const clearMiss = useProgress((state) => state.clearMiss);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const question = useMemo(() => {
    for (const id of missed) {
      const found = findQuestion(id);
      if (found) return found;
    }
    return null;
  }, [missed]);

  return (
    <div className="enter mx-auto w-full max-w-prose">
      <Link to="/record" className="text-sm text-muted underline-offset-4 hover:underline">
        Record
      </Link>
      <h1 className="mt-4 font-display text-4xl text-balance">Review</h1>
      <p className="mt-3 text-pretty text-muted">
        Misses from lesson checks wait here. A correct answer clears that question. No extra XP, so there is
        nothing to farm.
      </p>
      {!question ? (
        <p className="mt-8 text-pretty text-fg">Nothing in review.</p>
      ) : (
        <fieldset className="mt-8" disabled={revealed && picked === question.question.answer}>
          <legend className="text-pretty font-medium">
            <span className="mb-2 block text-sm text-faint">{question.lesson.title}</span>
            {question.question.prompt}
          </legend>
          <div className="mt-3 grid gap-2">
            {question.question.choices.map((label, index) => {
              const selected = picked === index;
              const right = index === question.question.answer;
              return (
                <label
                  key={label}
                  className={cn(
                    "flex min-h-11 items-start gap-3 rounded-md border px-3 py-3",
                    selected ? "border-line-strong bg-elevated" : "border-line bg-sunken",
                    revealed && right && "border-ok",
                    revealed && selected && !right && "border-bad",
                  )}
                >
                  <input
                    type="radio"
                    className="mt-1"
                    name="review"
                    checked={selected}
                    onChange={() => {
                      if (!revealed) setPicked(index);
                    }}
                  />
                  <span className="text-pretty">{label}</span>
                </label>
              );
            })}
          </div>
          {!revealed ? (
            <Button
              className="mt-4"
              disabled={picked == null}
              onClick={() => {
                if (picked == null) return;
                setRevealed(true);
              }}
            >
              Check
            </Button>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-pretty text-muted">{question.question.why}</p>
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() => {
                  if (picked === question.question.answer) clearMiss(question.question.id);
                  setPicked(null);
                  setRevealed(false);
                }}
              >
                {picked === question.question.answer ? "Clear and continue" : "Try again"}
              </Button>
            </div>
          )}
        </fieldset>
      )}
    </div>
  );
}
