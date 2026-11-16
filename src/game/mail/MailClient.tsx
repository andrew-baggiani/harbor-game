import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  allTells,
  finish,
  hostOf,
  inboxFor,
  newTracker,
  type BodyPart,
  type DirectoryEntry,
  type InboxContent,
  type MailResult,
  type Message,
} from "@/game/mail/mailLogic";

// Inbox version of the Monday mail beat.
// The player investigates instead of picking from a menu:
//   - open mails, read headers, hover (or tap the i) on links to see where they really go
//   - turn on the highlighter and mark what looks wrong
//   - look people up in the directory and call them to verify
//   - Report phish, reply, open the link, or just close the inbox
// When the beat ends it calls onDone with a MailResult whose choiceId is a v1 id
// (mail-report / mail-codes / mail-ignore), so the rest of the game is unchanged.

type Props = {
  content: InboxContent;
  variant: number;
  onDone: (result: MailResult) => void;
  /** Show the found/missed card before handing back. The night debrief can replace it. */
  showSummary?: boolean;
  /** Fill the parent box (the in-world monitor) instead of a full-page overlay. */
  embedded?: boolean;
};

type Mark = { key: string; tell?: string; why?: string };

const GOLD = "#c4a574";

export function MailClient({ content, variant, onDone, showSummary = true, embedded = false }: Props) {
  const messages = useMemo(() => inboxFor(content, variant), [content, variant]);
  const phish = messages.find((m) => m.kind === "phish")!;
  const tracker = useRef(newTracker());
  const [openId, setOpenId] = useState<string | null>(null);
  const [read, setRead] = useState<Set<string>>(() => new Set(messages.filter((m) => !m.unread).map((m) => m.id)));
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState(false);
  const [marking, setMarking] = useState(false);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [panel, setPanel] = useState<null | "directory" | "compose" | "login">(null);
  const [done, setDone] = useState<MailResult | null>(null);
  const [, force] = useState(0);

  const open = messages.find((m) => m.id === openId) ?? null;

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  function end() {
    const result = finish(content, variant, tracker.current);
    if (showSummary) setDone(result);
    else onDone(result);
  }

  function openMail(m: Message) {
    setOpenId(m.id);
    setDetails(false);
    setStatus(null);
    setRead((s) => new Set(s).add(m.id));
  }

  function mark(msg: Message, key: string, tell?: string, why?: string) {
    if (!marking) return false;
    const k = `${msg.id}:${key}`;
    setMarks((all) => ({ ...all, [k]: { key: k, tell, why } }));
    if (tell && msg.kind === "phish") tracker.current.found.add(tell);
    return true;
  }

  function headerTell(msg: Message, field: "from" | "reply_to" | "external") {
    return msg.header_tells.find((h) => h.field === field);
  }

  function report() {
    if (!open) return;
    if (open.kind === "phish") {
      tracker.current.reportedPhish = true;
      setGone((g) => new Set(g).add(open.id));
      setToast("Reported to Security. Everyone who got this mail is now warned.");
      window.setTimeout(end, 1400);
    } else {
      tracker.current.reportedLegit.add(open.id);
      setToast("Reported. Security checked: this one is real. Reporting when unsure is always fine.");
    }
  }

  function clickLink(msg: Message, part: Extract<BodyPart, { link: string }>) {
    if (mark(msg, part.link, part.tell, part.why)) return;
    if (msg.kind === "phish" && msg.fake_login) {
      tracker.current.openedLink = true;
      setPanel("login");
      return;
    }
    setToast(`Opened ${hostOf(part.href)}. That's a real Harbor page.`);
  }

  function send() {
    if (!open) return;
    setPanel(null);
    if (open.kind === "phish") {
      tracker.current.repliedToPhish = true;
      end();
    } else {
      setToast("Sent.");
    }
  }

  function call(entry: DirectoryEntry): string {
    const verify = phish.verify;
    if (verify && entry.name === verify.who) {
      tracker.current.verified = true;
      force((n) => n + 1);
      return verify.result;
    }
    return `${entry.name} picks up. Nothing unusual tonight.`;
  }

  if (done) return <Summary phish={phish} result={done} embedded={embedded} onContinue={() => onDone(done)} />;

  const list = messages.filter((m) => !gone.has(m.id));

  return (
    <div
      className={
        embedded
          ? "absolute inset-0 flex items-stretch text-[#f4f0e6]"
          : "fixed inset-0 z-50 flex items-stretch justify-center bg-[#07090e]/85 p-0 text-[#f4f0e6] md:p-8"
      }
      onKeyDownCapture={(e) => e.stopPropagation()}
      onKeyUpCapture={(e) => e.stopPropagation()}
    >
      <div
        className={`relative flex w-full flex-col overflow-hidden bg-[#f6f5f1] text-[#1b1d22] ${
          embedded ? "" : "max-w-6xl border border-white/10 shadow-2xl"
        }`}
      >
        {/* title bar */}
        <div className="flex items-center justify-between bg-[#14161b] px-4 py-2 text-[#f4f0e6]">
          <p className="text-xs tracking-[0.18em]">
            HARBOR MAIL <span className="text-[#a8a59c]">· {content.mailbox}</span>
          </p>
          <p className="text-xs text-[#a8a59c]">{content.clock}</p>
        </div>

        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-black/10 bg-white px-3 py-2">
          <Tool disabled={!open} onClick={() => setPanel("compose")}>Reply</Tool>
          <Tool
            disabled={!open}
            onClick={() => {
              if (!open) return;
              setGone((g) => new Set(g).add(open.id));
              setOpenId(null);
            }}
          >
            Delete
          </Tool>
          <Tool disabled={!open} onClick={report} accent>
            ⚑ {content.report_label}
          </Tool>
          <span className="mx-1 h-6 w-px bg-black/10" />
          <Tool onClick={() => setMarking((v) => !v)} active={marking}>
            {marking ? "Highlighter on" : "Mark what looks wrong"}
          </Tool>
          <Tool onClick={() => setPanel("directory")}>Directory</Tool>
          <span className="flex-1" />
          <Tool onClick={end}>Close inbox</Tool>
        </div>

        <div className="relative flex min-h-0 flex-1">
          {/* message list */}
          <ul className={`${open ? "hidden md:block" : "block"} w-full overflow-y-auto border-r border-black/10 bg-white md:w-80`}>
            {list.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => openMail(m)}
                  className={`block w-full border-b border-black/5 px-4 py-3 text-left ${openId === m.id ? "bg-[#efe8da]" : "hover:bg-black/[0.03]"}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`truncate text-sm ${read.has(m.id) ? "" : "font-semibold"}`}>
                      {!read.has(m.id) && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#2f6fd6]" />}
                      {m.from_name}
                    </span>
                    <span className="shrink-0 text-[11px] text-black/50">{m.time}</span>
                  </div>
                  <p className={`truncate text-sm ${read.has(m.id) ? "text-black/70" : "font-semibold"}`}>{m.subject}</p>
                  <p className="truncate text-xs text-black/50">{m.preview}</p>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="p-6 text-sm text-black/50">Inbox zero.</li>}
          </ul>

          {/* reader */}
          <div className={`${open ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col overflow-y-auto bg-[#fbfaf7]`}>
            {!open ? (
              <div className="m-auto p-8 text-center text-sm text-black/45">Pick a message.</div>
            ) : (
              <article className="p-5 md:p-8">
                <button type="button" className="mb-3 text-xs text-[#2f6fd6] md:hidden" onClick={() => setOpenId(null)}>
                  ← Inbox
                </button>
                {open.external && (
                  <Markable
                    marking={marking}
                    state={marks[`${open.id}:external`]}
                    onMark={() => mark(open, "external", headerTell(open, "external")?.tell, headerTell(open, "external")?.why)}
                    className="mb-4 block border-l-4 border-[#d98a1e] bg-[#fff4e2] px-3 py-2 text-xs text-[#6b4510]"
                  >
                    EXTERNAL · This message came from outside Harbor. Be careful with links and requests.
                  </Markable>
                )}
                <h1 className="font-display text-2xl leading-tight md:text-3xl">{open.subject}</h1>
                <div className="mt-3 text-sm">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => setDetails((d) => !d)}
                    title="Show the full address"
                  >
                    <span className="font-semibold underline decoration-dotted underline-offset-4">{open.from_name}</span>
                    <span className="ml-2 text-xs text-black/45">{open.time}</span>
                    <span className="ml-2 text-xs text-[#2f6fd6]">{details ? "▲ hide details" : "▼ details"}</span>
                  </button>
                </div>
                {details && (
                  <dl className="mt-2 grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1 rounded border border-black/10 bg-white p-3 text-xs">
                    <dt className="text-black/45">From</dt>
                    <dd>
                      <Markable
                        marking={marking}
                        state={marks[`${open.id}:from`]}
                        onMark={() => mark(open, "from", headerTell(open, "from")?.tell, headerTell(open, "from")?.why)}
                      >
                        {open.from_name} &lt;{open.from_email}&gt;
                      </Markable>
                    </dd>
                    <dt className="text-black/45">Reply-To</dt>
                    <dd>
                      <Markable
                        marking={marking}
                        state={marks[`${open.id}:reply_to`]}
                        onMark={() => mark(open, "reply_to", headerTell(open, "reply_to")?.tell, headerTell(open, "reply_to")?.why)}
                      >
                        {open.reply_to ?? open.from_email}
                      </Markable>
                    </dd>
                    <dt className="text-black/45">To</dt>
                    <dd>{content.mailbox}</dd>
                  </dl>
                )}

                <div className="mt-6 space-y-3 text-[15px] leading-relaxed">
                  {open.body.map((part, i) =>
                    "link" in part ? (
                      <p key={i} className="flex items-center gap-2">
                        <button
                          type="button"
                          onMouseEnter={() => setStatus(part.href)}
                          onMouseLeave={() => setStatus(null)}
                          onClick={() => clickLink(open, part)}
                          className={`rounded px-4 py-2 text-sm font-semibold text-white ${
                            marks[`${open.id}:${part.link}`]?.tell ? "ring-4 ring-[#c4a574]" : ""
                          } bg-[#2f6fd6]`}
                          title={part.shown}
                        >
                          {part.link}
                        </button>
                        <button
                          type="button"
                          className="h-7 w-7 rounded-full border border-black/20 text-xs text-black/60"
                          onClick={() => setStatus((s) => (s === part.href ? null : part.href))}
                          aria-label="Preview where this link goes"
                        >
                          i
                        </button>
                      </p>
                    ) : (
                      <p key={i}>
                        <Markable
                          marking={marking}
                          state={marks[`${open.id}:${i}`]}
                          onMark={() => mark(open, String(i), part.tell, part.why)}
                        >
                          {part.text}
                        </Markable>
                      </p>
                    ),
                  )}
                </div>
                <MarkNotes marks={marks} msgId={open.id} />
              </article>
            )}
            {status && (
              <div className="sticky bottom-0 mt-auto border-t border-black/10 bg-[#eceae4] px-3 py-1 font-mono text-[11px] text-black/70">
                {status}
              </div>
            )}
          </div>

          {panel === "directory" && (
            <Directory content={content} onClose={() => setPanel(null)} onCall={call} />
          )}
          {panel === "compose" && open && (
            <Compose content={content} msg={open} onCancel={() => setPanel(null)} onSend={send} />
          )}
          {panel === "login" && open?.fake_login && (
            <FakeLogin
              domain={open.fake_login.domain}
              title={open.fake_login.title}
              onBack={() => setPanel(null)}
              onSubmit={() => {
                tracker.current.enteredCreds = true;
                setPanel(null);
                end();
              }}
            />
          )}
        </div>

        {toast && (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
            <p className="max-w-md bg-[#14161b] px-4 py-2 text-center text-sm text-[#f4f0e6] shadow-lg">{toast}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Tool({
  children,
  onClick,
  disabled,
  accent,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-9 rounded px-3 text-sm disabled:opacity-35 ${
        accent
          ? "bg-[#b3261e] text-white"
          : active
            ? "bg-[#c4a574] text-[#14161b]"
            : "border border-black/15 bg-white text-[#1b1d22] hover:bg-black/[0.04]"
      }`}
    >
      {children}
    </button>
  );
}

function Markable({
  children,
  marking,
  state,
  onMark,
  className = "",
}: {
  children: ReactNode;
  marking: boolean;
  state?: Mark;
  onMark: () => void;
  className?: string;
}) {
  const hit = state?.tell;
  const miss = state && !state.tell;
  return (
    <span
      role={marking ? "button" : undefined}
      tabIndex={marking ? 0 : undefined}
      onClick={() => marking && onMark()}
      className={`${className} ${marking ? "cursor-pointer rounded-sm hover:bg-[#c4a574]/25" : ""} ${
        hit ? "bg-[#c4a574]/45" : miss ? "bg-black/[0.06]" : ""
      }`}
    >
      {children}
    </span>
  );
}

function MarkNotes({ marks, msgId }: { marks: Record<string, Mark>; msgId: string }) {
  const mine = Object.values(marks).filter((m) => m.key.startsWith(`${msgId}:`));
  if (mine.length === 0) return null;
  return (
    <ul className="mt-6 space-y-1 border-t border-black/10 pt-3 text-xs">
      {mine.map((m) => (
        <li key={m.key} className={m.tell ? "text-[#6b4f22]" : "text-black/45"}>
          {m.tell ? `✓ ${m.why}` : "Looks normal."}
        </li>
      ))}
    </ul>
  );
}

function Directory({
  content,
  onClose,
  onCall,
}: {
  content: InboxContent;
  onClose: () => void;
  onCall: (e: DirectoryEntry) => string;
}) {
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<DirectoryEntry | null>(null);
  const [heard, setHeard] = useState<string | null>(null);
  const hits = content.directory.filter((e) => `${e.name} ${e.title}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <aside className="absolute inset-y-0 right-0 z-10 flex w-full max-w-sm flex-col border-l border-black/10 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
        <p className="text-sm font-semibold">Staff directory</p>
        <button type="button" className="text-sm text-black/50" onClick={onClose}>
          Close
        </button>
      </div>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search a name"
        className="m-3 rounded border border-black/15 px-3 py-2 text-sm"
      />
      <ul className="flex-1 overflow-y-auto">
        {hits.map((e) => (
          <li key={e.email}>
            <button
              type="button"
              className={`block w-full px-4 py-2 text-left text-sm ${pick?.email === e.email ? "bg-[#efe8da]" : "hover:bg-black/[0.03]"}`}
              onClick={() => {
                setPick(e);
                setHeard(null);
              }}
            >
              <span className="font-semibold">{e.name}</span>
              <span className="block text-xs text-black/50">{e.title}</span>
            </button>
          </li>
        ))}
      </ul>
      {pick && (
        <div className="border-t border-black/10 p-4 text-sm">
          <p className="font-semibold">{pick.name}</p>
          <p className="text-xs text-black/55">{pick.email}</p>
          <p className="text-xs text-black/55">Ext {pick.ext}</p>
          <p className="mt-2 text-xs">{pick.note}</p>
          <button
            type="button"
            className="mt-3 min-h-9 rounded bg-[#14161b] px-3 text-sm text-[#f4f0e6]"
            onClick={() => setHeard(onCall(pick))}
          >
            Call ext {pick.ext}
          </button>
          {heard && <p className="mt-3 border-l-2 border-[#c4a574] pl-3 text-xs">{heard}</p>}
        </div>
      )}
    </aside>
  );
}

function Compose({
  content,
  msg,
  onCancel,
  onSend,
}: {
  content: InboxContent;
  msg: Message;
  onCancel: () => void;
  onSend: () => void;
}) {
  const [body, setBody] = useState(msg.reply_draft ?? "");
  const to = msg.reply_to ?? msg.from_email;
  return (
    <aside className="absolute inset-0 z-10 flex flex-col bg-white md:inset-auto md:bottom-0 md:right-6 md:h-[26rem] md:w-[30rem] md:border md:border-black/15 md:shadow-2xl">
      <div className="flex items-center justify-between bg-[#14161b] px-4 py-2 text-sm text-[#f4f0e6]">
        <span>Reply</span>
        <button type="button" onClick={onCancel} className="text-[#a8a59c]">
          ✕
        </button>
      </div>
      <div className="border-b border-black/10 px-4 py-2 text-xs">
        <span className="text-black/45">To </span>
        {to}
        {!to.endsWith(`@${content.internal_domain}`) && <span className="ml-2 text-[#b3261e]">outside Harbor</span>}
      </div>
      <div className="border-b border-black/10 px-4 py-2 text-xs">
        <span className="text-black/45">Subject </span>Re: {msg.subject}
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} className="flex-1 resize-none p-4 text-sm outline-none" />
      <div className="flex justify-end gap-2 border-t border-black/10 p-3">
        <button type="button" className="min-h-9 px-3 text-sm text-black/60" onClick={onCancel}>
          Discard
        </button>
        <button type="button" className="min-h-9 rounded bg-[#2f6fd6] px-4 text-sm text-white" onClick={onSend}>
          Send
        </button>
      </div>
    </aside>
  );
}

function FakeLogin({
  domain,
  title,
  onBack,
  onSubmit,
}: {
  domain: string;
  title: string;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [pw, setPw] = useState("");
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#f3f2f1]">
      <div className="flex items-center gap-2 border-b border-black/10 bg-white px-3 py-2">
        <button type="button" onClick={onBack} className="min-h-8 rounded border border-black/15 px-2 text-sm">
          ← Back
        </button>
        <div className="flex-1 truncate rounded bg-[#eceae4] px-3 py-1 font-mono text-xs text-black/70">
          https://{domain}/session?id=88213
        </div>
      </div>
      <div className="m-auto w-full max-w-sm bg-white p-8 shadow">
        <p className="text-xs font-semibold tracking-wide text-black/60">HARBOR &amp; CO.</p>
        <h2 className="mt-3 text-2xl">{title}</h2>
        <p className="mt-4 text-sm">you@harborandco.com</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password (training: type anything)"
          className="mt-3 w-full border-b-2 border-[#2f6fd6] px-1 py-2 text-sm outline-none"
          autoComplete="off"
        />
        <button
          type="button"
          disabled={!pw}
          onClick={onSubmit}
          className="mt-6 min-h-10 w-full bg-[#2f6fd6] text-sm text-white disabled:opacity-40"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

function Summary({
  phish,
  result,
  embedded,
  onContinue,
}: {
  phish: Message;
  result: MailResult;
  embedded: boolean;
  onContinue: () => void;
}) {
  const tells = allTells(phish);
  const headline =
    result.choiceId === "mail-report"
      ? "Reported. That's the move."
      : result.choiceId === "mail-codes"
        ? result.enteredCreds
          ? "You typed your password into a fake page."
          : "You replied to the scammer."
        : "You closed it without reporting.";
  return (
    <div
      className={`${embedded ? "absolute" : "fixed z-50"} inset-0 flex items-end justify-center overflow-y-auto bg-[#07090e]/85 p-4 text-[#f4f0e6] md:items-center`}
    >
      <div className="w-full max-w-lg border border-white/10 bg-[#0c0d0f]/95 p-6 md:p-8">
        <p className="text-[10px] tracking-[0.24em]" style={{ color: GOLD }}>
          MAIL · WHAT YOU CAUGHT
        </p>
        <h2 className="mt-2 font-display text-3xl text-balance">{headline}</h2>
        <p className="mt-2 text-sm text-[#a8a59c]">
          You found {result.evidence.length} of {result.tellsTotal} warning signs
          {result.verified ? " and checked with the real person." : "."}
        </p>
        <ul className="mt-5 space-y-2 text-sm">
          {tells.map((t) => {
            const got = result.evidence.includes(t.tell);
            return (
              <li key={t.tell} className="flex gap-3">
                <span style={{ color: got ? GOLD : "#6b6a66" }}>{got ? "✓" : "○"}</span>
                <span className={got ? "" : "text-[#a8a59c]"}>{t.why}</span>
              </li>
            );
          })}
        </ul>
        {result.reportedLegit.length > 0 && (
          <p className="mt-4 text-xs text-[#a8a59c]">
            You also reported {result.reportedLegit.length} real mail. No harm done: reporting when you're unsure is the habit.
          </p>
        )}
        <button type="button" className="mt-6 min-h-11 border px-4 text-sm" style={{ borderColor: GOLD }} onClick={onContinue}>
          Continue the shift
        </button>
      </div>
    </div>
  );
}
