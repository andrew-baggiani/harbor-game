import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = ["What happens in the Monday shift?", "How does the compliance mapping work?", "Can I resell it to my clients?"];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  // On the homepage the floating button would sit on top of the hero game, so it appears once the visitor scrolls past it.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const on = () => setShown(window.location.pathname !== "/" || window.scrollY > window.innerHeight * (window.innerWidth >= 640 ? 0.6 : 1.1));
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        launcher.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: question }];
    setMsgs(next);
    setText("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      setMsgs((m) => [...m, { role: "assistant", content: data.reply ?? data.error ?? "Something went wrong. Email hello@dryruncyber.com." }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Couldn't reach the assistant. Check your connection, or email hello@dryruncyber.com." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        ref={launcher}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="site-chat"
        tabIndex={shown || open ? 0 : -1}
        className={`fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full border border-site-violet bg-site-ink-2 p-2.5 sm:py-2.5 sm:pl-3 sm:pr-4 text-[15px] font-semibold text-site-paper shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)] hover:bg-[#1f1630] transition-[opacity,transform,background-color] duration-300 ${shown || open ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
      >
        <img src="/brand/dry-run-cyber-icon-dark-surface.svg" alt="" className="h-7 w-7 rounded-full" />
        <span className={open ? "" : "sr-only sm:not-sr-only"}>{open ? "Close" : "Ask a question"}</span>
      </button>

      {open && (
        <section
          id="site-chat"
          role="dialog"
          aria-label="Ask Dry Run Cyber"
          className="fixed bottom-20 right-3 z-40 flex h-[min(560px,calc(100dvh-7rem))] w-[min(400px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-site-rule bg-site-ink-2 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)] sm:right-5"
        >
          <header className="border-b border-site-rule px-5 py-4">
            <p className="font-bold" style={{ fontStretch: "112%" }}>Ask Dry Run Cyber</p>
            <p className="mt-0.5 text-[13px] text-site-dim">An AI assistant. It can get things wrong. For pricing or access, email hello@dryruncyber.com.</p>
          </header>

          <div ref={list} className="flex-1 space-y-3 overflow-y-auto px-5 py-4 text-[15px] leading-relaxed" aria-live="polite">
            {msgs.length === 0 && (
              <div>
                <p className="text-site-mist">Ask about the game, the week of shifts, compliance mapping, or reselling it to your clients.</p>
                <div className="mt-4 flex flex-col items-start gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      className="rounded-md border border-site-rule px-3 py-2 text-left text-[14px] text-site-paper hover:border-site-violet"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <p key={i} className="ml-8 rounded-lg bg-site-violet/20 px-3.5 py-2.5 text-site-paper">{m.content}</p>
              ) : (
                <p key={i} className="mr-6 whitespace-pre-wrap text-site-mist">{m.content}</p>
              ),
            )}
            {busy && <p className="text-site-dim">Thinking…</p>}
          </div>

          <form
            className="flex items-end gap-2 border-t border-site-rule p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(text);
            }}
          >
            <label htmlFor="chat-input" className="sr-only">Your question</label>
            <textarea
              id="chat-input"
              ref={input}
              rows={1}
              value={text}
              maxLength={600}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void ask(text);
                }
              }}
              placeholder="Type a question"
              className="max-h-28 min-h-11 flex-1 resize-none rounded-md border border-site-rule bg-site-ink px-3 py-2.5 text-[15px] text-site-paper placeholder:text-site-dim focus:border-site-violet focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !text.trim()}
              className="h-11 rounded-md bg-site-violet px-4 text-[15px] font-semibold text-white transition-colors hover:bg-site-violet-hi disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </section>
      )}
    </>
  );
}
