import { nightLog, type NightEntry } from "@/game/fallout";
import { useHarbor, world } from "@/game/state";
import { learnerRecord, restoreRecord, type LearnerRecord } from "@/game/records";
import { currentVariants, setVariants } from "@/game/scenarios";
import { useMondayPlay } from "@/game/mondayPlay";
import { readSave, writeSave } from "@/game/save";
import { currentRun, resumeRun } from "@/game/telemetry";

/** Monday's auto-save: the story so far, the record, and where you were standing. */

type Pose = { px: number; py: number; pz: number; face: number; camYaw: number };

export type MondaySave = {
  runId: string;
  store: {
    beat: string;
    flags: Record<string, unknown>;
    objective: string;
    minute: number;
    laptopBad: boolean;
    phoneBad: boolean;
    wireSent: boolean;
  };
  world: { minutes: number; guyGone: boolean; guyVisible: boolean; guyX: number; guyZ: number; printouts: boolean; onTask: number; exploring: number };
  pose: Pose | null;
  record: LearnerRecord;
  variants: Record<string, number>;
  found: Record<string, true>;
  night?: NightEntry[];
};

let lastPose: Pose | null = null;

/** Only remember where you are when it's a sensible place to come back to. */
function safePose(): Pose | null {
  if (world.driving || world.ride !== "idle" || world.ending) return lastPose;
  const onFloor = Math.abs(world.py) < 0.5 || Math.abs(world.py - 50.6) < 0.5;
  if (!onFloor) return lastPose;
  lastPose = { px: world.px, py: world.py, pz: world.pz, face: world.face, camYaw: world.camYaw };
  return lastPose;
}

export function saveMonday() {
  const s = useHarbor.getState();
  if (s.boot || s.report) return;
  const data: MondaySave = {
    runId: currentRun(),
    store: {
      beat: s.beat,
      flags: s.flags as Record<string, unknown>,
      objective: s.objective,
      minute: s.minute,
      laptopBad: s.laptopBad,
      phoneBad: s.phoneBad,
      wireSent: s.wireSent,
    },
    world: {
      minutes: world.minutes,
      guyGone: world.guyGone,
      guyVisible: world.guyVisible,
      guyX: world.guyX,
      guyZ: world.guyZ,
      printouts: world.printouts,
      onTask: world.time.onTask,
      exploring: world.time.exploring,
    },
    pose: safePose(),
    record: learnerRecord(),
    variants: currentVariants(),
    found: useMondayPlay.getState().found,
    night: [...nightLog],
  };
  writeSave("monday", data);
}

export function readMondaySave() {
  return readSave<MondaySave>("monday");
}

/** Call after the store's reset(): puts the saved run back. */
export function restoreMonday(save: MondaySave) {
  resumeRun(save.runId);
  setVariants(save.variants ?? {});
  restoreRecord(save.record);
  useMondayPlay.setState({ found: save.found ?? {} });
  nightLog.splice(0, nightLog.length, ...(save.night ?? []));
  useHarbor.setState({
    beat: save.store.beat as never,
    flags: save.store.flags as never,
    objective: save.store.objective,
    minute: save.store.minute,
    laptopBad: save.store.laptopBad,
    phoneBad: save.store.phoneBad,
    wireSent: save.store.wireSent,
  });
  Object.assign(world, {
    minutes: save.world.minutes,
    guyGone: save.world.guyGone,
    guyVisible: save.world.guyVisible,
    guyX: save.world.guyX,
    guyZ: save.world.guyZ,
    printouts: save.world.printouts,
  });
  world.time.onTask = save.world.onTask ?? 0;
  world.time.exploring = save.world.exploring ?? 0;
  if (save.pose) {
    world.px = save.pose.px;
    world.py = save.pose.py;
    world.pz = save.pose.pz;
    world.face = save.pose.face;
    world.camYaw = save.pose.camYaw;
    world.snap = true;
    lastPose = save.pose;
  }
}

/** Save on every story change and every 15 s while playing. Returns a cleanup. */
export function startMondaySaves(): () => void {
  let prev = "";
  const unsub = useHarbor.subscribe((s) => {
    const sig = `${s.beat}|${JSON.stringify(s.flags)}|${s.wireSent}|${s.laptopBad}|${s.phoneBad}`;
    if (sig !== prev && !s.boot) {
      prev = sig;
      saveMonday();
    }
  });
  const id = window.setInterval(saveMonday, 15000);
  return () => {
    unsub();
    window.clearInterval(id);
  };
}
