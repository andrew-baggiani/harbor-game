import { useEffect, useState, type ReactNode } from "react";
import {
  BANNED_WORDS,
  BEATS,
  LINKS,
  LINK_LABEL,
  MAILS,
  SECRETS,
  VERDICT_LABEL,
  verdictTone,
} from "@/content/drills";
import type { Beat, DrillResult, LinkVerdict, Verdict } from "@/content/types";
import { toPct } from "@/lib/utils";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

function choiceClass(active: boolean) {
  return cn(
    "w-full min-h-11 rounded-md border px-4 py-3 text-left disabled:opacity-40",
    active ? "border-line-strong bg-elevated text-fg" : "border-line bg-sunken text-fg hover:border-line-strong",
  );
}

export function InboxRun({ onComplete }: { onComplete: (result: DrillResult) => void }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Verdict | null>(null);
  const [rows, setRows] = useState<DrillResult["rows"]>([]);
  const mail = MAILS[index];
  if (!mail) return null;
  const locked = picked != null;
  const tone = picked ? verdictTone(picked, mail) : null;

  function commit(verdict: Verdict) {
    if (locked) return;
    setPicked(verdict);
  }

  function next() {
    if (!picked || !tone) return;
    const row = {
      id: mail.id,
      label: mail.subject,
      picked: VERDICT_LABEL[picked],
      right: VERDICT_LABEL[mail.verdict],
      tone: tone.tone,
      why: mail.why,
      earned: tone.earned,
      max: 10,
    };
    const nextRows = [...rows, row];
    if (index + 1 >= MAILS.length) {
      const earned = nextRows.reduce((sum, item) => sum + item.earned, 0);
      const max = nextRows.length * 10;
      onComplete({ earned, max, pct: toPct(earned, max), rows: nextRows });
      return;
    }
    setRows(nextRows);
    setPicked(null);
    setIndex((value) => value + 1);
  }

  return (
    <StepFrame index={index} total={MAILS.length} kicker="Inbox">
      <article className="rounded-3xl border border-line bg-elevated">
        <header className="border-b border-line px-5 py-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-2xl text-balance text-fg">{mail.subject}</h2>
            <p className="shrink-0 text-sm tabular-nums text-faint">{mail.time}</p>
          </div>
          <p className="mt-3 text-sm text-fg">
            {mail.fromName}{" "}
            <span className="font-mono text-xs text-muted">{mail.fromEmail}</span>
          </p>
        </header>
        <div className="space-y-3 px-5 py-4">
          {mail.body.map((paragraph) => (
            <p key={paragraph} className="text-pretty text-fg">
              {paragraph}
            </p>
          ))}
          {mail.attachment ? (
            <p className="rounded-md border border-line bg-sunken px-3 py-2 text-sm text-muted">
              Attachment {mail.attachment}. Not opened in this drill.
            </p>
          ) : null}
          {mail.link ? (
            <div className="rounded-md border border-line bg-sunken px-3 py-3">
              <p className="text-xs text-faint">Link in this message</p>
              <p className="mt-1 text-sm text-fg">{mail.link.text}</p>
              <p className="mt-1 font-mono text-xs break-all text-muted">{mail.link.href}</p>
            </div>
          ) : null}
        </div>
      </article>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {(Object.keys(VERDICT_LABEL) as Verdict[]).map((verdict) => (
          <button
            key={verdict}
            type="button"
            className={choiceClass(picked === verdict)}
            onClick={() => commit(verdict)}
            disabled={locked && picked !== verdict}
          >
            {VERDICT_LABEL[verdict]}
          </button>
        ))}
      </div>
      {locked && tone ? (
        <div className="mt-4">
          <p className={tone.tone === "exact" ? "text-sm text-ok" : tone.tone === "partial" ? "text-sm text-warn" : "text-sm text-bad"}>
            {tone.tone === "exact" ? "Full credit." : tone.tone === "partial" ? "Partial credit." : "Miss."}{" "}
            {mail.why}
          </p>
          <Button className="mt-4" onClick={next}>
            {index + 1 >= MAILS.length ? "See the debrief" : "Next message"}
          </Button>
        </div>
      ) : null}
    </StepFrame>
  );
}

function hostFacts(href: string): { host: string; unusual: string[] } {
  let host = href;
  try {
    host = new URL(href).hostname;
  } catch {
    host = href;
  }
  const unusual: string[] = [];
  for (const char of host) {
    const code = char.codePointAt(0) ?? 0;
    if (code > 127) {
      unusual.push(
        `“${char}” is U+${code.toString(16).toUpperCase().padStart(4, "0")}, not basic Latin.`,
      );
    }
  }
  return { host, unusual };
}

export function LinkRun({ onComplete }: { onComplete: (result: DrillResult) => void }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<LinkVerdict | null>(null);
  const [rows, setRows] = useState<DrillResult["rows"]>([]);
  const [inspect, setInspect] = useState(false);
  const item = LINKS[index];
  if (!item) return null;
  const facts = hostFacts(item.href);

  function next() {
    if (!picked) return;
    const exact = picked === item.verdict;
    const row = {
      id: item.id,
      label: item.display,
      picked: LINK_LABEL[picked],
      right: LINK_LABEL[item.verdict],
      tone: exact ? ("exact" as const) : ("miss" as const),
      why: item.why,
      earned: exact ? 10 : 0,
      max: 10,
    };
    const nextRows = [...rows, row];
    if (index + 1 >= LINKS.length) {
      const earned = nextRows.reduce((sum, entry) => sum + entry.earned, 0);
      const max = nextRows.length * 10;
      onComplete({ earned, max, pct: toPct(earned, max), rows: nextRows });
      return;
    }
    setRows(nextRows);
    setPicked(null);
    setInspect(false);
    setIndex((value) => value + 1);
  }

  return (
    <StepFrame index={index} total={LINKS.length} kicker="Link lab">
      <div className="rounded-3xl border border-line bg-elevated p-5">
        <p className="text-sm text-pretty text-muted">{item.context}</p>
        <p className="mt-4 text-xs text-faint">Visible text</p>
        <p className="mt-1 break-all text-fg">{item.display}</p>
        <p className="mt-4 text-xs text-faint">Actual target</p>
        <p className="mt-1 font-mono text-sm break-all text-fg">{item.href}</p>
        <p className="mt-4 text-xs text-faint">Host</p>
        <p className="mt-1 font-mono text-sm break-all text-fg">{facts.host}</p>
        {facts.unusual.length > 0 ? (
          <p className="mt-3 text-sm text-warn">This host is not all basic Latin.</p>
        ) : null}
        <button
          type="button"
          className="mt-3 text-sm text-muted underline-offset-4 hover:underline"
          onClick={() => setInspect((value) => !value)}
        >
          {inspect ? "Hide character codes" : "Show character codes"}
        </button>
        {inspect ? (
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {facts.unusual.length > 0 ? (
              facts.unusual.map((note) => <li key={note}>{note}</li>)
            ) : (
              <li>Every character in the host is basic Latin. If this is a trick, it is the name itself.</li>
            )}
          </ul>
        ) : null}
      </div>
      <div className="mt-4 grid gap-2">
        {(Object.keys(LINK_LABEL) as LinkVerdict[]).map((verdict) => (
          <button
            key={verdict}
            type="button"
            className={choiceClass(picked === verdict)}
            onClick={() => setPicked(verdict)}
          >
            {LINK_LABEL[verdict]}
          </button>
        ))}
      </div>
      <Button className="mt-4" onClick={next} disabled={!picked}>
        {index + 1 >= LINKS.length ? "See the debrief" : "Next link"}
      </Button>
    </StepFrame>
  );
}

export function BeatRun({
  drillId,
  onComplete,
}: {
  drillId: string;
  onComplete: (result: DrillResult) => void;
}) {
  const beats = BEATS[drillId] ?? [];
  const [index, setIndex] = useState(0);
  const [choiceId, setChoiceId] = useState<string | null>(null);
  const [rows, setRows] = useState<DrillResult["rows"]>([]);
  const beat = beats[index];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!beat || choiceId) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      const n = Number(event.key);
      const choice = beat.choices[n - 1];
      if (n >= 1 && choice) setChoiceId(choice.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [beat, choiceId]);

  if (!beat) return null;
  const chosen = beat.choices.find((choice) => choice.id === choiceId) ?? null;

  function next() {
    if (!chosen) return;
    const best = [...beat.choices].sort((a, b) => b.score - a.score)[0];
    const tone = chosen.score >= 10 ? "exact" : chosen.score > 0 ? "partial" : "miss";
    const row = {
      id: beat.id,
      label: beat.kicker,
      picked: chosen.label,
      right: best?.label ?? chosen.label,
      tone: tone as DrillResult["rows"][number]["tone"],
      why: chosen.why,
      earned: chosen.score,
      max: 10,
    };
    const nextRows = [...rows, row];
    if (index + 1 >= beats.length) {
      const earned = nextRows.reduce((sum, item) => sum + item.earned, 0);
      const max = nextRows.length * 10;
      onComplete({ earned, max, pct: toPct(earned, max), rows: nextRows });
      return;
    }
    setRows(nextRows);
    setChoiceId(null);
    setIndex((value) => value + 1);
  }

  return (
    <StepFrame index={index} total={beats.length} kicker={beat.kicker}>
      <div className="rounded-3xl border border-line bg-elevated p-5">
        <p className="text-pretty text-lg text-fg">{beat.prompt}</p>
      </div>
      <div className="mt-4 grid gap-2">
        {beat.choices.map((choice, choiceIndex) => (
          <button
            key={choice.id}
            type="button"
            className={choiceClass(choiceId === choice.id)}
            onClick={() => {
              if (!choiceId) setChoiceId(choice.id);
            }}
            disabled={choiceId != null && choiceId !== choice.id}
          >
            <span className="mr-2 font-mono text-xs text-faint">{choiceIndex + 1}</span>
            {choice.label}
          </button>
        ))}
      </div>
      {chosen ? (
        <div className="mt-4">
          <p className={chosen.score >= 10 ? "text-sm text-ok" : chosen.score > 0 ? "text-sm text-warn" : "text-sm text-bad"}>
            {chosen.why}
          </p>
          <Button className="mt-4" onClick={next}>
            {index + 1 >= beats.length ? "See the debrief" : "Next"}
          </Button>
        </div>
      ) : (
        <p className="mt-3 hidden text-xs text-faint sm:block">Keys 1 to {beat.choices.length} commit a choice.</p>
      )}
    </StepFrame>
  );
}

export function PassphraseRun({ onComplete }: { onComplete: (result: DrillResult) => void }) {
  const [marks, setMarks] = useState<Record<string, boolean | undefined>>({});
  const ready = SECRETS.every((item) => marks[item.id] != null);

  function finish() {
    if (!ready) return;
    const rows: DrillResult["rows"] = SECRETS.map((item) => {
      const accept = marks[item.id] === true;
      const exact = accept === item.ok;
      return {
        id: item.id,
        label: item.secret,
        picked: accept ? "Accept" : "Reject",
        right: item.ok ? "Accept" : "Reject",
        tone: exact ? "exact" : "miss",
        why: item.why,
        earned: exact ? 10 : 0,
        max: 10,
      };
    });
    const earned = rows.reduce((sum, row) => sum + row.earned, 0);
    const max = rows.length * 10;
    onComplete({ earned, max, pct: toPct(earned, max), rows });
  }

  return (
    <div>
      <ul className="grid gap-3">
        {SECRETS.map((item) => (
          <li key={item.id} className="rounded-3xl border border-line bg-elevated p-5">
            <p className="font-mono text-sm break-all text-fg">{item.secret}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                className={choiceClass(marks[item.id] === true)}
                onClick={() => setMarks((current) => ({ ...current, [item.id]: true }))}
              >
                Accept
              </button>
              <button
                type="button"
                className={choiceClass(marks[item.id] === false)}
                onClick={() => setMarks((current) => ({ ...current, [item.id]: false }))}
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
      <Button className="mt-4" onClick={finish} disabled={!ready}>
        Score the samples
      </Button>
      <Forge />
    </div>
  );
}

function Forge() {
  const [words, setWords] = useState(["", "", "", ""]);
  const cleaned = words.map((word) => word.trim().toLowerCase());
  const longEnough = cleaned.every((word) => word.length >= 4);
  const unique = new Set(cleaned.filter(Boolean)).size === 4 && cleaned.every(Boolean);
  const banned = cleaned.some((word) => BANNED_WORDS.includes(word));
  const length = words.join("").replace(/\s+/g, "").length >= 20;
  const checks = [
    { ok: longEnough, label: "Each word is at least 4 letters" },
    { ok: unique, label: "Four different words" },
    { ok: !banned && cleaned.some(Boolean), label: "None of the burned examples" },
    { ok: length, label: "At least 20 characters before spaces" },
  ];

  return (
    <section className="mt-10 border-t border-line pt-8">
      <h2 className="font-display text-3xl text-balance">Shape one you will not submit</h2>
      <p className="mt-2 max-w-prose text-pretty text-muted">
        This draft never leaves the page. Dry Run Cyber does not file it, score it, or send it anywhere. A manager-generated secret is still the better default. This is only the shape.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {words.map((word, index) => (
          <label key={index} className="block text-sm text-muted">
            Word {index + 1}
            <input
              value={word}
              onChange={(event) => {
                const next = [...words];
                next[index] = event.target.value.slice(0, 24);
                setWords(next);
              }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="mt-1 min-h-11 w-full rounded-md border border-line bg-sunken px-3 text-fg"
            />
          </label>
        ))}
      </div>
      <ul className="mt-4 space-y-1 text-sm">
        {checks.map((check) => (
          <li key={check.label} className={check.ok ? "text-ok" : "text-faint"}>
            {check.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

function StepFrame({
  index,
  total,
  kicker,
  children,
}: {
  index: number;
  total: number;
  kicker: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-sm tabular-nums text-faint">
        {kicker} · {index + 1} of {total}
      </p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function beatCount(drillId: string): number {
  return (BEATS[drillId] ?? []).length;
}

export type { Beat };
