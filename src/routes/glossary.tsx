import { createFileRoute, Link } from "@tanstack/react-router";
import { GLOSSARY } from "@/content/glossary";
import { ShareButton } from "@/components/share-button";

export const Route = createFileRoute("/glossary")({
  head: () => ({ meta: [{ title: "Glossary · Dry Run Cyber" }] }),
  component: GlossaryPage,
});

function GlossaryPage() {
  return (
    <div className="enter mx-auto w-full max-w-prose">
      <Link to="/path" className="text-sm text-muted underline-offset-4 hover:underline">
        Path
      </Link>
      <h1 className="mt-4 font-display text-4xl text-balance md:text-5xl">Glossary</h1>
      <p className="mt-4 text-pretty text-muted">
        Short definitions for the floor. Share the page if someone needs the words before the drills.
      </p>
      <div className="mt-5">
        <ShareButton
          label="Share the glossary"
          title="Dry Run Cyber glossary"
          text="Short definitions for a cybersecurity awareness field school."
          path="/glossary"
        />
      </div>
      <dl className="mt-8">
        {GLOSSARY.map((entry) => (
          <div key={entry.term} className="border-t border-line py-4">
            <dt className="font-display text-2xl text-fg">{entry.term}</dt>
            <dd className="mt-2 text-pretty text-muted">{entry.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
