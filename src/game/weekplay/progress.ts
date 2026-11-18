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
