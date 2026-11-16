import { useMemo, useReducer, useState } from "react";
import { Dialogue, type TalkContent, type TalkResult } from "@/game/talk/dialogue";

// In-world conversation bar: the scene stays visible, the NPC's line and your
// options sit at the bottom. "Look" options inspect without answering.

const GOLD = "#c4a574";

export function TalkPanel({ content, onDone }: { content: TalkContent; onDone: (r: TalkResult) => void }) {
  const d = useMemo(() => new Dialogue(content), [content]);
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const [summary, setSummary] = useState<TalkResult | null>(null);

  if (summary) return <Summary content={content} result={summary} onContinue={() => onDone(summary)} />;

  const looks = d.lines.filter((l) => l.who === "look");
  const lastYou = [...d.lines].reverse().find((l) => l.who === "you");
  const opts = d.options();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-3 text-[#f4f0e6] md:p-6"
      onKeyDownCapture={(e) => e.stopPropagation()}
      onKeyUpCapture={(e) => e.stopPropagation()}
    >
      <div className="pointer-events-auto w-full max-w-2xl border border-white/10 bg-[#0c0d0f]/92 p-5 shadow-2xl backdrop-blur md:p-6">
        <p className="text-[10px] tracking-[0.24em]" style={{ color: GOLD }}>
          {content.speaker.who.toUpperCase()} <span className="text-[#a8a59c]">· {content.speaker.role}</span>
        </p>
        {lastYou && <p className="mt-3 text-sm text-[#a8a59c]">You: “{lastYou.text}”</p>}
        <p className="mt-2 font-display text-xl leading-snug md:text-2xl">“{d.say}”</p>

        {looks.length > 0 && (
          <ul className="mt-3 space-y-1 border-l-2 pl-3 text-sm" style={{ borderColor: GOLD }}>
            {looks.map((l, i) => (
              <li key={i} className="text-[#d9d4c7]">
                {l.text}
              </li>
            ))}
          </ul>
        )}

        {!d.ended ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {opts.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  d.pick(o.id);
                  rerender();
                }}
                className={`min-h-11 px-3 py-2 text-left text-sm ${
                  o.look ? "border border-dashed border-white/25 text-[#d9d4c7]" : "border border-white/20 hover:bg-white/5"
                }`}
              >
                {o.look ? `👁 ${o.label}` : o.label}
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            className="mt-4 min-h-11 border px-4 text-sm"
            style={{ borderColor: GOLD }}
            onClick={() => setSummary(d.result())}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

function Summary({ content, result, onContinue }: { content: TalkContent; result: TalkResult; onContinue: () => void }) {
  const ok = result.score >= 100;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#07090e]/80 p-4 text-[#f4f0e6] md:items-center">
      <div className="w-full max-w-lg border border-white/10 bg-[#0c0d0f]/95 p-6 md:p-8">
        <p className="text-[10px] tracking-[0.24em]" style={{ color: GOLD }}>
          {content.speaker.who.toUpperCase()} · WHAT YOU CAUGHT
        </p>
        <h2 className="mt-2 font-display text-3xl text-balance">{content.headlines?.[result.choiceId] ?? (ok ? "Handled." : "That one got through.")}</h2>
        <ul className="mt-5 space-y-2 text-sm">
          {content.tells.map((t) => {
            const got = result.evidence.includes(t.tell);
            return (
              <li key={t.tell} className="flex gap-3">
                <span style={{ color: got ? GOLD : "#6b6a66" }}>{got ? "✓" : "○"}</span>
                <span className={got ? "" : "text-[#a8a59c]"}>{t.why}</span>
              </li>
            );
          })}
        </ul>
        <button type="button" className="mt-6 min-h-11 border px-4 text-sm" style={{ borderColor: GOLD }} onClick={onContinue}>
          Continue the shift
        </button>
      </div>
    </div>
  );
}
