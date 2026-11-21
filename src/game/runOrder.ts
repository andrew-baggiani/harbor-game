import { currentRun } from "@/game/telemetry";

/** FNV-1a: a small, stable string hash. */
function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Answer choices in an order that holds for this run and changes on the next, so nobody learns
 *  "it's always the second one". Stable across re-renders and a resumed save of the same run. */
export function runOrder<T>(items: readonly T[], key: (item: T) => string): T[] {
  const run = currentRun() || "run";
  return [...items].sort((a, b) => hash(run + key(a)) - hash(run + key(b)));
}
