import { useEffect, useState } from "react";
import { isMusicOn, toggleMusic } from "@/game/sound";

/**
 * Three short cards before someone's first shift: what's scored, what isn't, and the controls.
 * Shown once per person (per browser); every card can be skipped.
 */

const KEY = "drc-briefed-v1";

export function needsBriefing(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== "yes";
  } catch {
    return false;
  }
}

function markBriefed() {
  try {
    window.localStorage.setItem(KEY, "yes");
  } catch {
    /* fine */
  }
}

type Card = { title: string; body: React.ReactNode };

export function Briefing({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const [music, setMusic] = useState(isMusicOn);

  const cards: Card[] = [
    {
      title: "What counts",
      body: (
        <ul className="space-y-3">
          <li>Only the moments under the gold light are scored. Walk up, press Space, make the call.</li>
          <li>Wrong answers aren't a dead end. They play out in the room so you see what would have happened.</li>
          <li>You can replay any shift as many times as you like.</li>
        </ul>
      ),
    },
    {
      title: "What doesn't count",
      body: (
        <ul className="space-y-3">
          <li>Poking the printers, plants and coffee machines never touches your score. Mess around.</li>
          <li>Each room hides a few security slip-ups. Spotting one earns a Sharp eye bonus. Missing them costs nothing.</li>
          <li>Time spent exploring is recorded separately from time on the decisions, so being curious never makes you look slow.</li>
        </ul>
      ),
    },
    {
      title: "Controls",
      body: (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5">
            <dt className="font-game text-[#c4a574]">WASD</dt>
            <dd>Walk (arrow keys work too)</dd>
            <dt className="font-game text-[#c4a574]">Drag</dt>
            <dd>Look around</dd>
            <dt className="font-game text-[#c4a574]">Space</dt>
            <dd>Talk, look or poke</dd>
            <dt className="font-game text-[#c4a574]">Phone</dt>
            <dd>Left thumb walks, drag the right side to look</dd>
          </dl>
          <button
            type="button"
            onClick={() => setMusic(toggleMusic())}
            aria-pressed={music}
            className="mt-5 rounded-full border border-white/15 px-4 py-2 text-sm text-[#d8d2c4] hover:border-white/30"
          >
            Music: {music ? "on" : "off"}
          </button>
        </>
      ),
    },
  ];

  const last = i === cards.length - 1;
  const finish = () => {
    markBriefed();
    onDone();
  };
  const next = () => (last ? finish() : setI(i + 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopImmediatePropagation();
      if (e.code === "Escape") {
        e.preventDefault();
        finish();
      } else if (e.code === "Enter" || e.code === "NumpadEnter" || e.code === "Space" || e.code === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.code === "ArrowLeft" && i > 0) {
        e.preventDefault();
        setI(i - 1);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  const card = cards[i];
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#07090e]/85 p-5 font-ui text-[#f4f0e6] backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="briefing-title"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#10141b] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5" aria-label={`Card ${i + 1} of ${cards.length}`}>
            {cards.map((c, k) => (
              <span key={c.title} className={`h-1.5 w-6 rounded-full ${k <= i ? "bg-[#c4a574]" : "bg-white/15"}`} />
            ))}
          </div>
          <button type="button" onClick={finish} className="text-sm text-[#a8a59c] underline-offset-4 hover:text-[#f4f0e6] hover:underline">
            Skip
          </button>
        </div>
        <h2 id="briefing-title" className="mt-5 font-display text-3xl">
          {card.title}
        </h2>
        <div className="mt-4 text-[15px] leading-relaxed text-[#d8d2c4]">{card.body}</div>
        <div className="mt-7 flex items-center justify-between">
          {i > 0 ? (
            <button type="button" onClick={() => setI(i - 1)} className="text-sm text-[#a8a59c] hover:text-[#f4f0e6]">
              Back
            </button>
          ) : (
            <span />
          )}
          <button type="button" autoFocus onClick={next} className="rounded-full bg-[#c4a574] px-6 py-3 font-game tracking-[0.12em] text-[#14110c]">
            {last ? "START THE SHIFT" : "NEXT"}
          </button>
        </div>
      </div>
    </div>
  );
}
