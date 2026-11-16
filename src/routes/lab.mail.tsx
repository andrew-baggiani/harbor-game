import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import content from "@/content/scenarios/mon-02-phishing-v2.json";
import { MailClient } from "@/game/mail/MailClient";
import { phishVariants, type InboxContent, type MailResult } from "@/game/mail/mailLogic";

// Prototype playground for the inbox version of the Monday mail beat.
// Not linked from the game yet. Open /lab/mail to try it.

export const Route = createFileRoute("/lab/mail")({
  head: () => ({ meta: [{ title: "Mail lab · Dry Run Cyber" }] }),
  component: MailLab,
});

const inbox = content as unknown as InboxContent;

function MailLab() {
  const variants = phishVariants(inbox);
  const [variant, setVariant] = useState(variants[0] ?? 0);
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<MailResult | null>(null);

  return (
    <div className="mx-auto w-full max-w-prose">
      <Link to="/play" className="text-sm text-muted underline-offset-4 hover:underline">
        Home
      </Link>
      <h1 className="mt-4 font-display text-4xl">Mail lab</h1>
      <p className="mt-3 text-muted">Prototype of the Monday mail beat as a real inbox. Pick a variant and play it.</p>
      <div className="mt-4 flex gap-2">
        {variants.map((v) => (
          <button
            key={v}
            type="button"
            className={`min-h-10 border px-3 text-sm ${v === variant ? "border-[#c4a574]" : "border-white/15"}`}
            onClick={() => {
              setVariant(v);
              setResult(null);
              setRun((n) => n + 1);
            }}
          >
            Variant {v === 0 ? "A · gift cards" : v === 1 ? "B · fake sign-in" : v}
          </button>
        ))}
      </div>
      {result ? (
        <div className="mt-6">
          <pre className="overflow-x-auto border border-white/10 p-4 text-xs">{JSON.stringify(result, null, 2)}</pre>
          <button
            type="button"
            className="mt-4 min-h-10 border border-[#c4a574] px-3 text-sm"
            onClick={() => {
              setResult(null);
              setRun((n) => n + 1);
            }}
          >
            Play again
          </button>
        </div>
      ) : (
        <MailClient key={`${variant}-${run}`} content={inbox} variant={variant} onDone={setResult} />
      )}
    </div>
  );
}
