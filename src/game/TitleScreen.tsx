import { readMondaySave, restoreMonday } from "@/game/mondaySave";
import { ago, clearSave } from "@/game/save";
import { Briefing, needsBriefing } from "@/game/Briefing";
import { useEffect, useState, type ReactNode } from "react";
import { blip, say, unlockAudio } from "@/game/audio";
import { useHarbor } from "@/game/state";

// Game title screen: the live harbor renders behind it. Keyboard-first menu
// (↑↓ or W/S to move, Space/Enter to pick, Esc to go back), mouse and touch too.

const GOLD = "#c4a574";

/** A keyboard key, drawn like one. */
export function Key({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <kbd
      className={`inline-flex h-8 items-center justify-center rounded-md border border-white/25 border-b-[3px] border-b-white/35 bg-white/[0.07] px-2 font-game text-sm font-semibold uppercase tracking-wide text-[#f4f0e6] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ${
        wide ? "min-w-16" : "min-w-8"
      }`}
    >
      {children}
    </kbd>
  );
}

import { WEEK } from "@/game/week";
export { WEEK };

type Panel = "main" | "week" | "controls";

export function TitleScreen() {
  const [panel, setPanel] = useState<Panel>("main");
  const [sel, setSel] = useState(0);

  const [briefing, setBriefing] = useState(false);
  const go = () => {
    setBriefing(false);
    say("brief");
    useHarbor.getState().setBoot(false);
  };
  const start = () => {
    unlockAudio();
    blip(440);
    if (needsBriefing()) {
      setBriefing(true);
      return;
    }
    say("brief");
    useHarbor.getState().setBoot(false);
  };

  // Auto-save: offer to carry on a Monday that wasn't finished.
  const [saved] = useState(() => readMondaySave());
  const cont = () => {
    if (!saved) return;
    unlockAudio();
    blip(440);
    restoreMonday(saved);
    useHarbor.getState().setBoot(false);
  };
  const items: { label: string; note?: string; act: () => void }[] = [
    ...(saved ? [{ label: "Continue", note: `Saved ${ago(saved.savedAt)}`, act: cont }] : []),
    {
      label: saved ? "Start over" : "Start shift",
      note: "Monday · night 1",
      act: () => {
        if (saved) clearSave("monday");
        start();
      },
    },
    { label: "The week", note: `${WEEK.length} days + AI`, act: () => setPanel("week") },
    { label: "How to play", act: () => setPanel("controls") },
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (briefing) return;
      if (panel !== "main") {
        if (e.code === "Escape" || e.code === "Backspace") {
          e.preventDefault();
          blip(330);
          setPanel("main");
        }
        if ((e.code === "Space" || e.code === "Enter") && panel === "controls") {
          e.preventDefault();
          start();
        }
        return;
      }
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        blip(520);
        setSel((s) => (s + 1) % items.length);
      } else if (e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        blip(520);
        setSel((s) => (s + items.length - 1) % items.length);
      } else if (e.code === "Space" || e.code === "Enter" || e.code === "NumpadEnter") {
        e.preventDefault();
        items[sel].act();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="absolute inset-0 z-20 overflow-y-auto font-ui text-[#f4f0e6]">
      {briefing && <Briefing onDone={go} />}
      {/* cinematic vignette over the live scene */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,transparent_0%,rgba(7,9,14,0.55)_55%,rgba(7,9,14,0.95)_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#07090e]/95 via-[#07090e]/60 to-transparent md:w-3/4" />

      <div className="relative flex min-h-full flex-col justify-between p-6 md:p-12">
        <header className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center border border-[#c4a574] font-game text-lg font-bold text-[#c4a574]">H</span>
          <div className="leading-none">
            <p className="font-game text-lg font-semibold tracking-[0.18em]">HARBOR &amp; CO.</p>
            <p className="mt-1 text-[11px] tracking-[0.2em] text-[#a8a59c]">SECURITY TRAINING · DRY RUN CYBER</p>
          </div>
        </header>

        <main className="mt-6 max-w-xl md:mt-8">
          {panel === "main" && (
            <>
              <p className="font-game text-sm font-semibold tracking-[0.3em]" style={{ color: GOLD }}>
                DRY RUN CYBER · WEEK 1 · MONDAY
              </p>
              <h1 className="mt-1 font-game text-7xl leading-[0.86] font-bold uppercase md:text-[6.5rem]">
                The night
                <br />
                shift
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[#d9d4c8] md:text-lg">
                Your first night at Harbor &amp; Co., a freight company on the waterfront. People will ask you for things.
                Some of them are scams. Nobody's going to tell you which.
              </p>

              <nav className="mt-6 flex flex-col gap-0.5" aria-label="Main menu">
                {items.map((it, i) => (
                  <button
                    key={it.label}
                    type="button"
                    onMouseEnter={() => setSel(i)}
                    onFocus={() => setSel(i)}
                    onClick={it.act}
                    className={`group flex min-h-13 items-center gap-4 border-l-4 px-4 text-left transition-colors ${
                      sel === i ? "border-[#c4a574] bg-gradient-to-r from-[#c4a574]/25 to-transparent" : "border-transparent"
                    }`}
                  >
                    <span className={`font-game text-3xl font-semibold uppercase tracking-wide ${sel === i ? "text-white" : "text-[#cfc9bc]"}`}>
                      {it.label}
                    </span>
                    {it.note && <span className="font-game text-sm tracking-[0.18em] text-[#a8a59c] uppercase">{it.note}</span>}
                  </button>
                ))}
                <a
                  href="/portal"
                  className="flex min-h-12 items-center px-5 font-game text-lg tracking-wide text-[#a8a59c] uppercase hover:text-white"
                >
                  Your training record
                </a>
              </nav>
            </>
          )}

          {panel === "week" && (
            <section>
              <p className="font-game text-sm font-semibold tracking-[0.3em]" style={{ color: GOLD }}>
                WEEK 1
              </p>
              <h2 className="mt-1 font-game text-6xl font-bold uppercase">The week</h2>
              <p className="mt-3 max-w-md text-[#d9d4c8]">
                One night a day, about 20 minutes each. Every shift covers a block of the training your company is required to
                give. Finish the week for your certificate.
              </p>
              <ol className="mt-6 space-y-2">
                {WEEK.map((s, i) => (
                  <li
                    key={s.day}
                    className={`border px-4 py-3 ${s.status === "open" ? "border-[#c4a574]/70 bg-[#c4a574]/10" : "border-white/10 bg-white/[0.03]"}`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-game text-2xl font-semibold uppercase">
                        <span className="mr-3 text-[#a8a59c]">{String(i + 1).padStart(2, "0")}</span>
                        {s.day} · {s.title}
                      </p>
                      <span
                        className="shrink-0 font-game text-xs tracking-[0.2em] uppercase"
                        style={{ color: s.status === "open" ? GOLD : "#8d887f" }}
                      >
                        {s.status === "open" ? "Tonight" : "🔒 Coming soon"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#a8a59c]">{s.topics}</p>
                  </li>
                ))}
              </ol>
              <Back onBack={() => setPanel("main")} />
            </section>
          )}

          {panel === "controls" && (
            <section>
              <h2 className="font-game text-6xl font-bold uppercase">How to play</h2>
              <div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Row label="Move">
                  <span className="flex gap-1">
                    <Key>W</Key>
                    <Key>A</Key>
                    <Key>S</Key>
                    <Key>D</Key>
                  </span>
                  <span className="text-[#8d887f]">or</span>
                  <span className="flex gap-1">
                    <Key>↑</Key>
                    <Key>←</Key>
                    <Key>↓</Key>
                    <Key>→</Key>
                  </span>
                </Row>
                <Row label="Run">
                  <Key wide>Shift</Key>
                </Row>
                <Row label="Look around">
                  <span className="text-sm text-[#d9d4c8]">Drag the mouse, or</span>
                  <span className="flex gap-1">
                    <Key>I</Key>
                    <Key>J</Key>
                    <Key>K</Key>
                    <Key>L</Key>
                  </span>
                </Row>
                <Row label="Use / talk">
                  <Key wide>Space</Key>
                </Row>
                <Row label="Pause menu">
                  <Key wide>Esc</Key>
                </Row>
                <Row label="Next stop">
                  <span className="text-sm text-[#d9d4c8]">Follow the gold marker</span>
                </Row>
              </div>
              <p className="mt-6 max-w-md text-sm text-[#a8a59c]">
                On a phone or tablet: left thumb walks, drag the right side to look, and the round button uses.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={start}
                  className="min-h-12 border border-[#c4a574] bg-[#c4a574]/15 px-6 font-game text-xl font-semibold tracking-[0.12em] uppercase"
                >
                  Start shift
                </button>
                <Back onBack={() => setPanel("main")} inline />
              </div>
            </section>
          )}
        </main>

        <footer className="mt-8 hidden flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#a8a59c] md:flex">
          <span className="flex items-center gap-2">
            <Key>↑</Key>
            <Key>↓</Key> choose
          </span>
          <span className="flex items-center gap-2">
            <Key wide>Space</Key> select
          </span>
          <span className="flex items-center gap-2">
            <Key wide>Esc</Key> back
          </span>
        </footer>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-game text-xs font-semibold tracking-[0.24em] text-[#a8a59c] uppercase">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function Back({ onBack, inline = false }: { onBack: () => void; inline?: boolean }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className={`${inline ? "" : "mt-6"} flex min-h-11 items-center gap-2 font-game text-lg tracking-wide text-[#a8a59c] uppercase hover:text-white`}
    >
      <Key wide>Esc</Key> Back
    </button>
  );
}
