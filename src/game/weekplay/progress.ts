/** Per-browser progress through the week. Signed-in learners also get server records via telemetry. */
export type WeekRecord = { best: number; passed: boolean; at: number };

const KEY = "drc-week-progress";

export function readWeek(): Record<string, WeekRecord> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Record<string, WeekRecord>;
  } catch {
    return {};
  }
}

export function saveWeek(id: string, score: number, passed: boolean) {
  try {
    const all = readWeek();
    const prev = all[id];
    all[id] = { best: Math.max(prev?.best ?? 0, score), passed: passed || !!prev?.passed, at: Date.now() };
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage can be unavailable; the run still counts on the server */
  }
}

const FINDS_KEY = "drc-week-finds";

/** Security finds spotted per shift, across runs, so the week page can say how many are left. */
export function readFinds(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(FINDS_KEY) ?? "{}") as Record<string, string[]>;
  } catch {
    return {};
  }
}

export function saveFinds(id: string, ids: string[]) {
  try {
    const all = readFinds();
    all[id] = [...new Set([...(all[id] ?? []), ...ids])];
    window.localStorage.setItem(FINDS_KEY, JSON.stringify(all));
  } catch {
    /* optional */
  }
}
