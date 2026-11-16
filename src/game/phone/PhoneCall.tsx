import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import mail from "@/content/scenarios/mon-02-phishing-v2.json";
import { sayLine } from "@/game/audio";
import { Call, type CallContent, type CallResult } from "@/game/phone/callLogic";

// Phone beat as a conversation. The caller talks; you talk back with real lines,
// look him up in the directory, read the text on your phone, hang up, call back.

type Props = { content: CallContent; onDone: (r: CallResult) => void };

type Entry = { name: string; title: string; email: string; ext: string; note: string };
const directory = (mail as unknown as { directory: Entry[] }).directory;


export function PhoneCall({ content, onDone }: Props) {
  const call = useMemo(() => new Call(content), [content]);
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const [smsOpen, setSmsOpen] = useState(false);
  const [dirOpen, setDirOpen] = useState(false);
  const [calledBack, setCalledBack] = useState(false);
  const idleTimer = useRef<number | null>(null);
  const idled = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  // One nudge from the caller if you go quiet.
  useEffect(() => {
    if (call.ended || idled.current) return;
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      idled.current = true;
      call.idle();
      rerender();
    }, content.idle_seconds * 1000);
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  });

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  });

  // Voice new caller / service-desk lines (the opening line is the beat's own v1 clip).
  const voiced = useRef(1);
  useEffect(() => {
    if (call.lines.length <= voiced.current) return;
    const fresh = call.lines.slice(voiced.current);
    voiced.current = call.lines.length;
    const line = [...fresh].reverse().find((l) => l.who === "caller" || l.who === "desk");
    if (!line) return;
    const id =
      line.who === "desk"
        ? "v2-phone-desk"
        : line.text === content.idle_line
          ? "v2-phone-idle"
          : `v2-phone-${call.node}`;
    sayLine(id, line.text, line.who === "desk" ? "woman" : "man", line.who === "desk" ? "IT Service Desk" : "Caller · \"Dan, Harbor IT\"");
  });

  const act = (f: () => void) => {
    f();
    rerender();
  };

  const ended = call.ended;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[#07090e]/80 p-3 text-[#f4f0e6] md:items-center"
      onKeyDownCapture={(e) => e.stopPropagation()}
      onKeyUpCapture={(e) => e.stopPropagation()}
    >
      <div className="relative flex h-[min(44rem,92dvh)] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#101318] shadow-2xl">
        {/* SMS banner: the code arrived, with its own warning */}
        <button
          type="button"
          onClick={() =>
            act(() => {
              call.readSms();
              setSmsOpen((v) => !v);
            })
          }
          className="m-3 rounded-2xl bg-white/10 px-4 py-2 text-left text-xs backdrop-blur"
        >
          <span className="font-semibold">{content.sms.from}</span>
          <span className="float-right text-white/50">now</span>
          <span className={`mt-0.5 block ${smsOpen ? "" : "truncate"} text-white/80`}>{content.sms.text}</span>
        </button>

        {/* caller */}
        <div className="px-6 pt-2 text-center">
          <p className="text-[11px] tracking-[0.2em] text-white/50">{ended ? "CALL ENDED" : "ON CALL"}</p>
          <p className="mt-1 text-2xl">{content.caller_id.name}</p>
          <p className="text-sm text-white/55">{content.caller_id.number}</p>
        </div>

        {/* transcript */}
        <div ref={logRef} className="mt-4 flex-1 space-y-2 overflow-y-auto px-4 pb-2">
          {call.lines.map((l, i) => (
            <p
              key={i}
              className={
                l.who === "you"
                  ? "ml-10 rounded-2xl rounded-br-sm bg-[#2f6fd6] px-3 py-2 text-sm"
                  : l.who === "system"
                    ? "py-1 text-center text-xs text-white/45"
                    : `mr-10 rounded-2xl rounded-bl-sm px-3 py-2 text-sm ${l.who === "desk" ? "bg-[#2a4a35]" : "bg-white/10"}`
              }
            >
              {l.text}
            </p>
          ))}
        </div>

        {/* what you can say */}
        {!ended && (
          <div className="space-y-1.5 border-t border-white/10 p-3">
            {call.options().map((o) => (
              <button
                key={o.id}
                type="button"
                className="block min-h-10 w-full rounded-xl border border-white/15 px-3 py-2 text-left text-sm hover:bg-white/5"
                onClick={() => act(() => call.pick(o.id))}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {/* phone controls */}
        <div className="flex items-center justify-around border-t border-white/10 p-4">
          <button type="button" className="text-xs text-white/70" onClick={() => setDirOpen(true)}>
            <span className="mx-auto mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-white/10">☰</span>
            Directory
          </button>
          {!ended ? (
            <button type="button" className="text-xs text-white/70" onClick={() => act(() => call.hangUp())}>
              <span className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-[#d33] text-xl">✆</span>
              Hang up
            </button>
          ) : (
            <>
              {call.ended === "hangup" && !calledBack && (
                <button
                  type="button"
                  className="text-xs text-white/70"
                  onClick={() =>
                    act(() => {
                      call.callBack();
                      setCalledBack(true);
                    })
                  }
                >
                  <span className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-[#2c8a4b] text-xl">✆</span>
                  Call {content.callback.number}
                </button>
              )}
              <button type="button" className="text-xs text-white/70" onClick={() => onDone(call.result())}>
                <span className="mx-auto mb-1 flex h-11 w-11 items-center justify-center rounded-full border border-white/30">→</span>
                Done
              </button>
            </>
          )}
        </div>

        {dirOpen && (
          <Directory
            onClose={() => setDirOpen(false)}
            onLook={(name) => {
              const t = call.lookedUp(name);
              rerender();
              return t;
            }}
          />
        )}
      </div>
    </div>
  );
}

function Directory({ onClose, onLook }: { onClose: () => void; onLook: (name: string) => { why: string } | null }) {
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<Entry | null>(null);
  const hits = directory.filter((e) => `${e.name} ${e.title} ${e.ext}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-[#101318]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <p className="text-sm font-semibold">Staff directory</p>
        <button type="button" className="text-sm text-white/60" onClick={onClose}>
          Back to call
        </button>
      </div>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search a name or extension"
        className="m-3 rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
      />
      <ul className="flex-1 overflow-y-auto">
        {hits.map((e) => (
          <li key={e.email}>
            <button
              type="button"
              className="block w-full px-5 py-2 text-left text-sm hover:bg-white/5"
              onClick={() => {
                setPick(e);
                onLook(e.name);
              }}
            >
              {e.name} <span className="text-white/45">· ext {e.ext}</span>
              <span className="block text-xs text-white/45">{e.title}</span>
            </button>
          </li>
        ))}
        {hits.length === 0 && <li className="px-5 py-3 text-sm text-white/50">Nobody matches “{q}”.</li>}
      </ul>
      {pick && (
        <div className="border-t border-white/10 p-5 text-sm">
          <p className="font-semibold">{pick.name}</p>
          <p className="text-xs text-white/55">
            {pick.email} · ext {pick.ext}
          </p>
          <p className="mt-2 text-xs">{pick.note}</p>
        </div>
      )}
    </div>
  );
}
