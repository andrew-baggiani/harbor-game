import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { BADGES, RANKS } from "@/content/meta";
import { LESSONS, lessonsFor } from "@/content/curriculum";
import { DRILLS } from "@/content/drills";
import { shiftKey, todayKey } from "@/lib/dates";

export type AttemptRecord = {
  best: number;
  attempts: number;
  xpGranted: number;
  completedAt: string;
};

export type Grant = {
  xpGained: number;
  newBadges: { id: string; name: string }[];
  best: number;
  improved: boolean;
};

type Data = {
  callsign: string;
  welcomed: boolean;
  xp: number;
  streak: number;
  lastActive: string | null;
  dailyDone: string | null;
  lessons: Record<string, AttemptRecord>;
  drills: Record<string, AttemptRecord>;
  missed: string[];
  badges: string[];
  shiftBest: number;
  shiftHeld: boolean;
};

type ProgressState = Data & {
  dismissWelcome: (callsign?: string) => void;
  setCallsign: (name: string) => void;
  recordLesson: (
    lessonId: string,
    scorePct: number,
    wrongIds: string[],
    rightIds: string[],
  ) => Grant;
  recordDrill: (drillId: string, scorePct: number, isDaily: boolean) => Grant;
  clearMiss: (questionId: string) => void;
  recordShift: (score: number, held: boolean) => Grant;
  reset: () => void;
};

const initial: Data = {
  callsign: "Recruit",
  welcomed: false,
  xp: 0,
  streak: 0,
  lastActive: null,
  dailyDone: null,
  lessons: {},
  drills: {},
  missed: [],
  badges: [],
  shiftBest: 0,
  shiftHeld: false,
};

function lessonTarget(pct: number): number {
  return Math.round(40 + 60 * (pct / 100));
}

function drillTarget(pct: number): number {
  return Math.round(150 * (pct / 100));
}

function touchStreak(state: Data, today: string): { streak: number; lastActive: string; bonus: number } {
  if (state.lastActive === today) {
    return { streak: state.streak, lastActive: today, bonus: 0 };
  }
  const continued = state.lastActive === shiftKey(today, -1);
  return {
    streak: continued ? state.streak + 1 : 1,
    lastActive: today,
    bonus: 15,
  };
}

function badgeIds(state: Data): string[] {
  const ids: string[] = [];
  if (Object.keys(state.lessons).length > 0) ids.push("first-light");
  if (Object.values(state.lessons).some((lesson) => lesson.best === 100)) ids.push("clean-check");
  if (state.streak >= 3) ids.push("three-days");
  if (state.streak >= 7) ids.push("week-watch");
  const best = (id: string) => state.drills[id]?.best ?? 0;
  if (best("inbox") >= 90) ids.push("inbox-clear");
  if (best("links") >= 90) ids.push("host-reader");
  if (best("vishing") >= 80) ids.push("hung-up");
  if (best("passphrase") === 100) ids.push("vault-mind");
  if (best("datadesk") >= 80) ids.push("data-desk");
  if (best("incident") >= 80) ids.push("clocked");
  if (best("wire") >= 80) ids.push("unmoved");
  const perfect = new Set<string>();
  for (const lesson of LESSONS) {
    if (state.lessons[lesson.id]?.best === 100) perfect.add(lesson.moduleId);
  }
  for (const moduleId of new Set(LESSONS.map((lesson) => lesson.moduleId))) {
    const group = lessonsFor(moduleId);
    if (group.length > 0 && group.every((lesson) => perfect.has(moduleId) && state.lessons[lesson.id]?.best === 100)) {
      ids.push("perfect-module");
      break;
    }
  }
  if (LESSONS.every((lesson) => state.lessons[lesson.id])) ids.push("full-path");
  if (DRILLS.every((drill) => state.drills[drill.id])) ids.push("all-drills");
  if (state.shiftHeld) ids.push("held-floor");
  const warden = RANKS[RANKS.length - 1];
  if (warden && state.xp >= warden.min) ids.push("warden");
  return ids;
}

function nameBadges(ids: string[]): { id: string; name: string }[] {
  return ids.map((id) => ({
    id,
    name: BADGES.find((badge) => badge.id === id)?.name ?? id,
  }));
}

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    key: (index) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
    clear: () => {
      map.clear();
    },
  };
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initial,
      dismissWelcome: (callsign) => {
        set({
          welcomed: true,
          callsign: callsign && callsign.trim() ? callsign : get().callsign,
        });
      },
      setCallsign: (name) => set({ callsign: name, welcomed: true }),
      recordLesson: (lessonId, scorePct, wrongIds, rightIds) => {
        const prev = get();
        const today = todayKey();
        const touch = touchStreak(prev, today);
        const target = lessonTarget(scorePct);
        const prior = prev.lessons[lessonId];
        const granted = prior?.xpGranted ?? 0;
        const gain = Math.max(0, target - granted);
        const xp = prev.xp + gain + touch.bonus;
        const lessons = {
          ...prev.lessons,
          [lessonId]: {
            best: Math.max(prior?.best ?? 0, scorePct),
            attempts: (prior?.attempts ?? 0) + 1,
            xpGranted: granted + gain,
            completedAt: new Date().toISOString(),
          },
        };
        const missed = new Set(prev.missed);
        for (const id of wrongIds) missed.add(id);
        for (const id of rightIds) missed.delete(id);
        const next: Data = {
          callsign: prev.callsign,
          welcomed: prev.welcomed,
          xp,
          streak: touch.streak,
          lastActive: touch.lastActive,
          dailyDone: prev.dailyDone,
          lessons,
          drills: prev.drills,
          missed: [...missed],
          badges: prev.badges,
          shiftBest: prev.shiftBest,
          shiftHeld: prev.shiftHeld,
        };
        const fresh = badgeIds(next).filter((id) => !prev.badges.includes(id));
        set({ ...next, badges: [...prev.badges, ...fresh] });
        return {
          xpGained: gain + touch.bonus,
          newBadges: nameBadges(fresh),
          best: lessons[lessonId]!.best,
          improved: (prior?.best ?? -1) < scorePct,
        };
      },
      recordDrill: (drillId, scorePct, isDaily) => {
        const prev = get();
        const today = todayKey();
        const touch = touchStreak(prev, today);
        const target = drillTarget(scorePct);
        const prior = prev.drills[drillId];
        const granted = prior?.xpGranted ?? 0;
        const gain = Math.max(0, target - granted);
        const xp = prev.xp + gain + touch.bonus;
        const drills = {
          ...prev.drills,
          [drillId]: {
            best: Math.max(prior?.best ?? 0, scorePct),
            attempts: (prior?.attempts ?? 0) + 1,
            xpGranted: granted + gain,
            completedAt: new Date().toISOString(),
          },
        };
        const next: Data = {
          callsign: prev.callsign,
          welcomed: prev.welcomed,
          xp,
          streak: touch.streak,
          lastActive: touch.lastActive,
          dailyDone: isDaily ? today : prev.dailyDone,
          lessons: prev.lessons,
          drills,
          missed: prev.missed,
          badges: prev.badges,
          shiftBest: prev.shiftBest,
          shiftHeld: prev.shiftHeld,
        };
        const fresh = badgeIds(next).filter((id) => !prev.badges.includes(id));
        set({ ...next, badges: [...prev.badges, ...fresh] });
        return {
          xpGained: gain + touch.bonus,
          newBadges: nameBadges(fresh),
          best: drills[drillId]!.best,
          improved: (prior?.best ?? -1) < scorePct,
        };
      },
      clearMiss: (questionId) => {
        set({ missed: get().missed.filter((id) => id !== questionId) });
      },
      recordShift: (score, held) => {
        const prev = get();
        const today = todayKey();
        const touch = touchStreak(prev, today);
        const prior = Math.round((prev.shiftBest ?? 0) / 8);
        const nextValue = Math.round(score / 8);
        const gain = Math.max(0, nextValue - prior);
        const heldBonus = held && !prev.shiftHeld ? 80 : 0;
        const xp = prev.xp + gain + heldBonus + touch.bonus;
        const next: Data = {
          callsign: prev.callsign,
          welcomed: prev.welcomed,
          xp,
          streak: touch.streak,
          lastActive: touch.lastActive,
          dailyDone: prev.dailyDone,
          lessons: prev.lessons,
          drills: prev.drills,
          missed: prev.missed,
          badges: prev.badges,
          shiftBest: Math.max(prev.shiftBest ?? 0, score),
          shiftHeld: prev.shiftHeld || held,
        };
        const fresh = badgeIds(next).filter((id) => !prev.badges.includes(id));
        set({ ...next, badges: [...prev.badges, ...fresh] });
        return {
          xpGained: gain + heldBonus + touch.bonus,
          newBadges: nameBadges(fresh),
          best: next.shiftBest,
          improved: score > (prev.shiftBest ?? 0),
        };
      },
      reset: () => set({ ...initial, welcomed: true }),
    }),
    {
      name: "meridian-field-v1",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? memoryStorage() : window.localStorage,
      ),
      skipHydration: true,
      partialize: (state) => ({
        callsign: state.callsign,
        welcomed: state.welcomed,
        xp: state.xp,
        streak: state.streak,
        lastActive: state.lastActive,
        dailyDone: state.dailyDone,
        lessons: state.lessons,
        drills: state.drills,
        missed: state.missed,
        badges: state.badges,
        shiftBest: state.shiftBest,
        shiftHeld: state.shiftHeld,
      }),
    },
  ),
);

export function useHydratedProgress(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    void Promise.resolve(useProgress.persist.rehydrate()).finally(() => {
      if (live) setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);
  return ready;
}

export function lessonAverage(lessons: Record<string, AttemptRecord>): number | null {
  const rows = Object.values(lessons);
  if (rows.length === 0) return null;
  return Math.round(rows.reduce((sum, row) => sum + row.best, 0) / rows.length);
}

export function moduleMastery(moduleId: string, lessons: Record<string, AttemptRecord>): number {
  const group = lessonsFor(moduleId);
  if (group.length === 0) return 0;
  const sum = group.reduce((total, lesson) => total + (lessons[lesson.id]?.best ?? 0), 0);
  return Math.round(sum / group.length);
}

export function nextLessonId(lessons: Record<string, AttemptRecord>): string {
  const ordered = LESSONS;
  const open = ordered.find((lesson) => !lessons[lesson.id]);
  if (open) return open.id;
  const weakest = [...ordered].sort(
    (a, b) => (lessons[a.id]?.best ?? 0) - (lessons[b.id]?.best ?? 0),
  )[0];
  return weakest?.id ?? ordered[0]!.id;
}

export function cardQuery(state: Data): string {
  const params = new URLSearchParams();
  params.set("n", state.callsign);
  params.set("x", String(state.xp));
  params.set("k", String(state.streak));
  params.set("c", String(Object.keys(state.lessons).length));
  const avg = lessonAverage(state.lessons);
  if (avg != null) params.set("a", String(avg));
  const drills = DRILLS.flatMap((drill) => {
    const best = state.drills[drill.id]?.best;
    return best == null ? [] : [`${drill.id}.${best}`];
  }).join(",");
  if (drills) params.set("q", drills);
  params.set("b", String(state.badges.length));
  return params.toString();
}
