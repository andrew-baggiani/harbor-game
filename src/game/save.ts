/**
 * Auto-save. Training happens between other work: tabs get closed, laptops sleep, browsers crash. Every
 * decision (and, on Monday, your position every few seconds) is saved in this browser, and the next visit
 * offers to pick up where you left off. The server keeps the same run, so the record stays one attempt.
 * Saves expire after 14 days.
 */

const TTL = 14 * 24 * 3600 * 1000;
const VERSION = 1;

type Envelope<T> = { v: number; at: number; data: T };

function key(id: string) {
  return `drc-save-${id}`;
}

export function writeSave<T>(id: string, data: T) {
  try {
    const env: Envelope<T> = { v: VERSION, at: Date.now(), data };
    window.localStorage.setItem(key(id), JSON.stringify(env));
  } catch {
    /* private mode or full: no save, the game still works */
  }
}

export function readSave<T>(id: string): (T & { savedAt: number }) | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(id));
    if (!raw) return null;
    const env = JSON.parse(raw) as Envelope<T>;
    if (env.v !== VERSION || Date.now() - env.at > TTL) {
      window.localStorage.removeItem(key(id));
      return null;
    }
    return { ...env.data, savedAt: env.at };
  } catch {
    return null;
  }
}

export function clearSave(id: string) {
  try {
    window.localStorage.removeItem(key(id));
  } catch {
    /* fine */
  }
}

/** "2 hours ago", "yesterday": for the resume prompt. */
export function ago(at: number) {
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 2) return "just now";
  if (m < 60) return `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? "an hour ago" : `${h} hours ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

/* ---------------------------------------------------------------- stepping away */

const IDLE_MS = 4 * 60 * 1000;

/**
 * Calls `onAway` when the player switches tabs or windows, or stops touching anything for 4 minutes.
 * Returns a cleanup function. The game decides what pausing means.
 */
export function watchAway(onAway: (why: "tab" | "idle") => void): () => void {
  let last = Date.now();
  const touch = () => {
    last = Date.now();
  };
  const hidden = () => {
    if (document.hidden) onAway("tab");
  };
  const blur = () => onAway("tab");
  const events = ["keydown", "pointerdown", "pointermove", "wheel", "touchstart"] as const;
  for (const e of events) window.addEventListener(e, touch, { passive: true });
  document.addEventListener("visibilitychange", hidden);
  window.addEventListener("blur", blur);
  const id = window.setInterval(() => {
    if (Date.now() - last > IDLE_MS) {
      last = Date.now();
      onAway("idle");
    }
  }, 15000);
  return () => {
    for (const e of events) window.removeEventListener(e, touch);
    document.removeEventListener("visibilitychange", hidden);
    window.removeEventListener("blur", blur);
    window.clearInterval(id);
  };
}
