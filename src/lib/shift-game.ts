import { getSignal, WATCHES, type Call, type OrderId } from "@/content/shift";

export type LiveSignal = {
  id: string;
  age: number;
  inspected: boolean;
};

export type LogEntry = {
  id: string;
  result: "exact" | "soft" | "miss" | "detonate";
  call?: Call;
};

export type Phase = "play" | "order" | "won" | "lost";

export type Run = {
  seed: string;
  plan: string[][][];
  watch: number;
  beat: number;
  actions: number;
  pressure: number;
  score: number;
  queue: LiveSignal[];
  order: OrderId | null;
  log: LogEntry[];
  phase: Phase;
  note: string | null;
  locked: boolean;
};

const PATTERN = [2, 1, 2, 1, 1];

function hash(seed: string): number {
  let h = 2166136261;
  for (const char of seed) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items: string[], rnd: () => number): string[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    const swap = next[i]!;
    next[i] = next[j]!;
    next[j] = swap;
  }
  return next;
}

export function dealPlan(seed: string): string[][][] {
  const rnd = mulberry32(hash(seed));
  return WATCHES.map((watch) => {
    const order = shuffle(watch.pool, rnd);
    const beats: string[][] = [];
    let cursor = 0;
    for (const count of PATTERN) {
      beats.push(order.slice(cursor, cursor + count));
      cursor += count;
    }
    return beats;
  });
}

function spawn(ids: string[]): LiveSignal[] {
  return ids.map((id) => ({ id, age: 0, inspected: false }));
}

export function startRun(seed: string): Run {
  const plan = dealPlan(seed);
  return {
    seed,
    plan,
    watch: 0,
    beat: 0,
    actions: 2,
    pressure: 6,
    score: 0,
    queue: spawn(plan[0]![0]!),
    order: null,
    log: [],
    phase: "play",
    note: null,
    locked: false,
  };
}

export function fuseFor(id: string, order: OrderId | null): number {
  return getSignal(id).fuse + (order === "slack" ? 1 : 0);
}

export function blowback(
  id: string,
  call: Call,
  steady: boolean,
): { result: "exact" | "soft" | "miss"; pressure: number; points: number } {
  const signal = getSignal(id);
  let pressure = 0;
  let points = 0;
  let result: "exact" | "soft" | "miss" = "miss";
  if (call === signal.correct) {
    result = "exact";
    points = 100;
  } else if (signal.soft.includes(call)) {
    result = "soft";
    pressure = 8;
    points = 40;
  } else if (call === "clear") {
    pressure = 24;
  } else if (signal.correct === "clear") {
    pressure = 12;
  } else {
    pressure = 16;
  }
  if (steady) pressure = Math.round(pressure * 0.75);
  return { result, pressure, points };
}

function withLock(run: Run, actions: number): Pick<Run, "actions" | "locked"> {
  return { actions, locked: actions <= 0 };
}

export function inspect(run: Run, id: string): Run {
  if (run.phase !== "play" || run.locked || run.actions < 1) return run;
  const target = run.queue.find((signal) => signal.id === id);
  if (!target || target.inspected) return run;
  return {
    ...run,
    queue: run.queue.map((signal) => (signal.id === id ? { ...signal, inspected: true } : signal)),
    note: null,
    ...withLock(run, run.actions - 1),
  };
}

export function decide(run: Run, id: string, call: Call): Run {
  if (run.phase !== "play" || run.locked || run.actions < 1) return run;
  if (!run.queue.some((signal) => signal.id === id)) return run;
  const hit = blowback(id, call, run.order === "steady");
  const pressure = Math.min(100, run.pressure + hit.pressure);
  const next: Run = {
    ...run,
    queue: run.queue.filter((signal) => signal.id !== id),
    pressure,
    score: run.score + hit.points,
    log: [...run.log, { id, result: hit.result, call }],
    note:
      hit.result === "exact"
        ? "Clean call."
        : hit.result === "soft"
          ? "Close. Pressure still moved."
          : "That call cost the floor.",
    ...withLock(run, run.actions - 1),
  };
  if (pressure >= 100) return { ...next, phase: "lost", note: "Pressure broke the shift." };
  return next;
}

export function advance(run: Run): Run {
  if (run.phase !== "play") return run;
  let pressure = run.pressure;
  let score = run.score + run.actions * 5;
  const log = [...run.log];
  const queue: LiveSignal[] = [];
  for (const signal of run.queue) {
    const age = signal.age + 1;
    if (age >= fuseFor(signal.id, run.order)) {
      const spike = run.order === "steady" ? 22 : 30;
      pressure = Math.min(100, pressure + spike);
      log.push({ id: signal.id, result: "detonate" });
    } else {
      queue.push({ ...signal, age });
    }
  }
  const detonated = log.length - run.log.length;
  if (pressure >= 100) {
    return {
      ...run,
      queue,
      pressure,
      score,
      log,
      actions: 0,
      locked: true,
      phase: "lost",
      note: "Something you left on the desk went off.",
    };
  }
  const lastBeat = run.beat >= PATTERN.length - 1;
  if (lastBeat && run.watch >= WATCHES.length - 1) {
    return {
      ...run,
      queue,
      pressure,
      score: score + (100 - pressure) * 2,
      log,
      actions: 0,
      locked: true,
      phase: "won",
      note: "Three watches. The floor held.",
    };
  }
  if (lastBeat) {
    return {
      ...run,
      queue,
      pressure,
      score,
      log,
      actions: 0,
      locked: true,
      phase: "order",
      note: detonated ? "A signal you left went off." : null,
    };
  }
  const beat = run.beat + 1;
  const incoming = spawn(run.plan[run.watch]![beat]!);
  return {
    ...run,
    queue: [...queue, ...incoming],
    pressure,
    score,
    log,
    beat,
    note: detonated ? "A signal you left went off." : null,
    actions: run.order === "keen" ? 3 : 2,
    locked: false,
  };
}

export function pickOrder(run: Run, order: OrderId): Run {
  if (run.phase !== "order") return run;
  const watch = run.watch + 1;
  return {
    ...run,
    watch,
    beat: 0,
    order,
    phase: "play",
    note: null,
    queue: [...run.queue, ...spawn(run.plan[watch]![0]!)],
    actions: order === "keen" ? 3 : 2,
    locked: false,
  };
}

export function tally(run: Run): { exact: number; soft: number; miss: number; detonated: number } {
  return {
    exact: run.log.filter((entry) => entry.result === "exact").length,
    soft: run.log.filter((entry) => entry.result === "soft").length,
    miss: run.log.filter((entry) => entry.result === "miss").length,
    detonated: run.log.filter((entry) => entry.result === "detonate").length,
  };
}
