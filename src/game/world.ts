// The browser side of the week's world state. Signed-in learners use the server's copy (the record);
// everyone else keeps one in this browser. Both apply the same rules (src/content/week/world.ts).
import { applyChoice, applyReport, parseWorld, type Via, type WorldState } from "@/content/week/world";
import { checkLearner } from "@/game/telemetry";

const KEY = "drc-week-world";

function readLocal(): WorldState {
  if (typeof window === "undefined") return parseWorld(null);
  try {
    return parseWorld(JSON.parse(window.localStorage.getItem(KEY) ?? "null"));
  } catch {
    return parseWorld(null);
  }
}

function writeLocal(w: WorldState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(w));
  } catch {
    /* storage can be unavailable; the week just won't carry over in this browser */
  }
}

/** The week so far: the server's copy for learners, this browser's otherwise. */
export async function loadWorld(): Promise<WorldState> {
  if (await checkLearner()) {
    try {
      const res = await fetch("/api/world", { credentials: "same-origin" });
      if (res.ok) {
        const w = parseWorld(((await res.json()) as { world?: unknown }).world);
        writeLocal(w);
        return w;
      }
    } catch {
      /* fall back to this browser's copy */
    }
  }
  return readLocal();
}

/** Every scored choice passes through here; the server applies the same rule from the event log. */
export function noteChoice(choiceId: string, runId: string) {
  writeLocal(applyChoice(readLocal(), choiceId, runId, Date.now()));
}

/** The player calls IT. Returns the world as it stands afterwards. */
export async function reportToIt(day: string, via: Via): Promise<WorldState> {
  const local = applyReport(readLocal(), day, via, Date.now());
  writeLocal(local);
  if (await checkLearner()) {
    try {
      const res = await fetch("/api/world", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ day, via }),
      });
      if (res.ok) {
        const w = parseWorld(((await res.json()) as { world?: unknown }).world);
        writeLocal(w);
        return w;
      }
    } catch {
      /* the local copy stands */
    }
  }
  return local;
}
