import { useState } from "react";

// Misdirect beat on the desk monitor: Maya's chat on the left, a real compose
// window on the right. Autocomplete offers the wrong Mark first. Send it to the
// wrong one and you get the Sent screen, a recall that fails, and Report / Delete.

type Person = { name: string; email: string; tag: string };

export type ComposeContent = {
  chat: { from: string; role: string; text: string };
  subject: string;
  body: string;
  attachment: { name: string; size: string; preview: string };
  internal_domain: string;
  variants: { wrong: Person; right: Person }[];
  mailtip: string;
  sent: { title: string; text: string; recall: string };
  tells: { tell: string; why: string }[];
};

export type ComposeResult = {
  /** v1 choice ids in order: ["misdirect-check"] or ["misdirect-send", "misdirect-report" | "misdirect-hide"]. */
  steps: string[];
  evidence: string[];
  tellsTotal: number;
  variant: number;
};


export function ComposeApp({
  content,
  variant,
  onDone,
}: {
  content: ComposeContent;
  variant: number;
  onDone: (r: ComposeResult) => void;
}) {
  const v = content.variants[variant] ?? content.variants[0];
  const [to, setTo] = useState<Person | null>(null);
  const [typing, setTyping] = useState("");
  const [suggest, setSuggest] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState(false);
  const [stage, setStage] = useState<"compose" | "sent">("compose");
  const [recallFailed, setRecallFailed] = useState(false);
  const [evidence] = useState(() => new Set<string>());

  const external = (p: Person | null) => !!p && !p.email.endsWith(`@${content.internal_domain}`);
  const options = [v.wrong, v.right].filter((p) =>
    `${p.name} ${p.email}`.toLowerCase().includes(typing.trim().toLowerCase()),
  );

  const finish = (steps: string[]) => {
    const r = { steps, evidence: [...evidence], tellsTotal: content.tells.length, variant };
    onDone(r);
  };

  const send = () => {
    if (!to) return;
    if (to.email === v.right.email) finish(["misdirect-check"]);
    else setStage("sent");
  };

  return (
    <div
      className="absolute inset-0 flex flex-col bg-[#f6f5f1] text-[#1b1d22] md:flex-row"
      onKeyDownCapture={(e) => e.stopPropagation()}
      onKeyUpCapture={(e) => e.stopPropagation()}
    >
      {/* chat */}
      <aside className="border-b border-black/10 bg-[#ecebe6] p-4 md:w-72 md:border-r md:border-b-0">
        <p className="text-[11px] tracking-[0.16em] text-black/50">CHAT</p>
        <p className="mt-3 text-sm font-semibold">
          {content.chat.from} <span className="font-normal text-black/50">· {content.chat.role}</span>
        </p>
        <p className="mt-1 rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-sm shadow-sm">{content.chat.text}</p>
      </aside>

      {/* compose / sent */}
      <section className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between bg-[#14161b] px-4 py-2 text-xs tracking-[0.16em] text-[#f4f0e6]">
          <span>{stage === "sent" ? "SENT" : "NEW MESSAGE"}</span>
          <span className="text-[#a8a59c]">HARBOR MAIL</span>
        </div>

        {stage === "compose" ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {/* To */}
            <div className="relative flex flex-wrap items-center gap-2 border-b border-black/10 px-4 py-2 text-sm">
              <span className="text-black/45">To</span>
              {to ? (
                <button
                  type="button"
                  onClick={() => {
                    setExpanded((x) => !x);
                    evidence.add("checked_to");
                  }}
                  className={`rounded-full px-3 py-1 text-xs ${external(to) ? "bg-[#fff1dc] text-[#7a4a0e] ring-1 ring-[#d98a1e]" : "bg-[#e3ecfb] text-[#1e4fa0]"}`}
                >
                  {to.name}
                  {expanded && <span className="ml-1 opacity-75">&lt;{to.email}&gt;</span>}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Remove recipient"
                    className="ml-2 opacity-60"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTo(null);
                      setExpanded(false);
                    }}
                  >
                    ✕
                  </span>
                </button>
              ) : (
                <input
                  value={typing}
                  autoFocus
                  onFocus={() => setSuggest(true)}
                  onChange={(e) => {
                    setTyping(e.target.value);
                    setSuggest(true);
                  }}
                  placeholder="Type a name"
                  className="min-w-40 flex-1 bg-transparent py-1 outline-none"
                />
              )}
              {suggest && !to && (
                <ul className="absolute top-full left-10 z-10 mt-1 w-[min(26rem,85%)] border border-black/10 bg-white shadow-lg">
                  {options.map((p) => (
                    <li key={p.email}>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-black/[0.04]"
                        onClick={() => {
                          setTo(p);
                          setSuggest(false);
                          setTyping("");
                        }}
                      >
                        <span className="font-semibold">{p.name}</span>
                        <span className="ml-2 rounded bg-black/[0.06] px-1.5 text-[10px] uppercase tracking-wide text-black/60">
                          {p.tag}
                        </span>
                        <span className="block text-xs text-black/50">{p.email}</span>
                      </button>
                    </li>
                  ))}
                  {options.length === 0 && <li className="px-3 py-2 text-sm text-black/45">No matches.</li>}
                </ul>
              )}
            </div>

            {external(to) && (
              <p
                className="border-b border-[#d98a1e]/40 bg-[#fff4e2] px-4 py-2 text-xs text-[#6b4510]"
                ref={() => {
                  evidence.add("mailtip");
                }}
              >
                ⚠ {content.mailtip.replace("{{NAME}}", to!.name)}
              </p>
            )}

            <div className="border-b border-black/10 px-4 py-2 text-sm">
              <span className="text-black/45">Subject </span>
              {content.subject}
            </div>
            <div className="px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setPreview((x) => !x);
                  evidence.add("sensitive");
                }}
                className="inline-flex items-center gap-2 rounded border border-black/15 bg-white px-3 py-1.5 text-xs"
              >
                📎 {content.attachment.name} <span className="text-black/45">{content.attachment.size}</span>
              </button>
              {preview && <p className="mt-2 text-xs text-black/70">{content.attachment.preview}</p>}
            </div>
            <pre className="flex-1 px-4 py-2 font-sans text-sm whitespace-pre-wrap">{content.body}</pre>
            <div className="flex justify-end gap-2 border-t border-black/10 p-3">
              <button
                type="button"
                disabled={!to}
                onClick={send}
                className="min-h-10 rounded bg-[#2f6fd6] px-5 text-sm text-white disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <p className="max-w-md text-sm">
              {content.sent.text.replace("{{NAME}}", to?.name ?? "").replace("{{EMAIL}}", to?.email ?? "")}
            </p>
            {recallFailed && <p className="mt-3 max-w-md text-xs text-[#b3261e]">{content.sent.recall}</p>}
            <div className="mt-6 grid w-full max-w-sm gap-2">
              {!recallFailed && (
                <button
                  type="button"
                  className="min-h-10 rounded border border-black/20 text-sm"
                  onClick={() => setRecallFailed(true)}
                >
                  Recall this message
                </button>
              )}
              <button
                type="button"
                className="min-h-10 rounded bg-[#b3261e] text-sm text-white"
                onClick={() => {
                  evidence.add("reported");
                  finish(["misdirect-send", "misdirect-report"]);
                }}
              >
                Report it to Security now
              </button>
              <button
                type="button"
                className="min-h-10 rounded text-sm text-black/55"
                onClick={() => finish(["misdirect-send", "misdirect-hide"])}
              >
                Delete it from Sent and move on
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
