import { useEffect, useMemo, useReducer, useRef } from "react";
import { sayLine } from "@/game/audio";
import { Dialogue, type TalkContent, type TalkResult } from "@/game/talk/dialogue";

// In-world conversation bar: the scene stays visible, the current line and your
// options sit at the bottom. 👁 options inspect, gold-edged options do something and stay done.

const GOLD = "#c4a574";

export function TalkPanel({ content, onDone }: { content: TalkContent; onDone: (r: TalkResult) => void }) {
  const d = useMemo(() => new Dialogue(content), [content]);
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const spoken = useRef(content.start);

  // Voice each new node (the start node is voiced by the beat's own v1 clip).
  useEffect(() => {
    if (!content.voice || d.node === spoken.current) return;
    spoken.current = d.node;
    const n = content.nodes[d.node];
    sayLine(`${content.voice}-${d.node}`, n.say, n.kind ?? content.speaker.kind ?? "narrator", n.who ?? content.speaker.who);
  });

  const notes = d.lines.filter((l) => l.who === "look" || l.who === "act");
  const lastYou = [...d.lines].reverse().find((l) => l.who === "you");
  const last = d.last;
  const who = last.by ?? content.speaker.who;
  const quoted = !content.narration || !!last.by;
  const opts = d.options();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-3 text-[#f4f0e6] md:p-6"
      onKeyDownCapture={(e) => e.stopPropagation()}
      onKeyUpCapture={(e) => e.stopPropagation()}
    >
      <div className="pointer-events-auto max-h-[78dvh] w-full max-w-2xl overflow-y-auto border border-white/10 bg-[#0c0d0f]/92 p-5 shadow-2xl backdrop-blur md:p-6">
        <p className="text-[10px] tracking-[0.24em]" style={{ color: GOLD }}>
          {who.toUpperCase()} {!last.by && <span className="text-[#a8a59c]">· {content.speaker.role}</span>}
        </p>
        {lastYou && <p className="mt-3 text-sm text-[#a8a59c]">You: “{lastYou.text}”</p>}
        <p className="mt-2 font-display text-xl leading-snug md:text-2xl">{quoted ? `“${last.text}”` : last.text}</p>

        {notes.length > 0 && (
          <ul className="mt-3 space-y-1 border-l-2 pl-3 text-sm" style={{ borderColor: GOLD }}>
            {notes.map((l, i) => (
              <li key={i} className={l.who === "act" ? "text-[#e9dcc0]" : "text-[#d9d4c7]"}>
                {l.who === "act" ? `✓ ${l.text}` : l.text}
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
                  // The beat's own voiced debrief explains what happened, so no summary card here.
                  if (d.ended) window.setTimeout(() => onDone(d.result()), 700);
                }}
                className={`min-h-11 px-3 py-2 text-left text-sm ${
                  o.kind === "look"
                    ? "border border-dashed border-white/25 text-[#d9d4c7]"
                    : o.kind === "act"
                      ? "border border-[#c4a574]/50 hover:bg-white/5"
                      : "border border-white/20 hover:bg-white/5"
                }`}
              >
                {o.kind === "look" ? `👁 ${o.label}` : o.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
