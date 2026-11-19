import { create } from "zustand";
import { CAR_SPAWN, SPAWN } from "@/game/layout";
import { applyFlag, barkFor, emptyFlags, nextBeat, objectiveFor, panelFor, scoreOf, talkFor, type Beat, type Flags, type Talk, type VoiceKind } from "@/game/story";
import { recordDecision, resetRecord, sealShift, noteVariants } from "@/game/records";
import { choiceOf, currentVariants, pickVariants, variantOf } from "@/game/scenarios";
import { say, sayLineNext } from "@/game/audio";
import { resetFocus } from "@/game/focus";
import { FALLOUT_FROM_CHOICE, addFallout, after, resetFallout, flushFallout } from "@/game/fallout";
import { logDecision, logShiftComplete, newShiftRun } from "@/game/telemetry";
import { mondayFindCount } from "@/game/mondayPlay";

export type Bark = { who: string; text: string };

type Data = {
  beat: Beat;
  talk: Talk | null;
  bark: Bark | null;
  objective: string;
  prompt: string | null;
  flags: Flags;
  driving: boolean;
  paused: boolean;
  boot: boolean;
  hint: boolean;
  minute: number;
  report: boolean;
  laptopBad: boolean;
  phoneBad: boolean;
  wireSent: boolean;
};

type HarborStore = Data & {
  choose: (id: string) => void;
  setPrompt: (prompt: string | null) => void;
  setDriving: (driving: boolean) => void;
  setPaused: (paused: boolean) => void;
  setBoot: (boot: boolean) => void;
  setHint: (hint: boolean) => void;
  setMinute: (minute: number) => void;
  setBark: (bark: Bark | null) => void;
  openPanel: (id: string) => void;
  finish: () => void;
  reset: () => void;
};

export const world = {
  px: SPAWN.x,
  py: 0,
  pz: SPAWN.z,
  face: SPAWN.yaw,
  camYaw: SPAWN.yaw,
  camPitch: 0.08,
  driving: false,
  carX: CAR_SPAWN.x,
  carZ: CAR_SPAWN.z,
  carYaw: CAR_SPAWN.yaw,
  carSpeed: 0,
  brake: false,
  wheelSteer: 0,
  carRoll: 0,
  doorOpen: 0,
  reader: "off" as "off" | "red" | "green",
  badgeOut: 0,
  moving: false,
  /** Seconds on the main path vs. exploring this run (see sim stepTiming). */
  time: { onTask: 0, exploring: 0, lastDist: Infinity },
  speed: 0,
  walk: 0,
  guyX: 1.55,
  guyZ: 1.05,
  guyVisible: true,
  guyGone: false,
  fade: 0,
  fadingIn: true,
  bootT: 0,
  transition: null as null | "up" | "down",
  cabShown: false,
  cabY: 0,
  cabZ: -17.36,
  elevDoor: 0,
  ride: "idle" as "idle" | "open" | "board" | "hold" | "shut" | "ride" | "arrive" | "out",
  rideT: 0,
  rideDir: "up" as "up" | "down",
  rideMoved: false,
  rideBob: 0,
  callLit: false,
  cabButton: "" as "" | "L" | "14",
  indicator: "L",
  arrow: "" as "" | "up" | "down",
  laneOpen: [0, 0, 0, 0] as number[],
  laneT: [0, 0, 0, 0] as number[],
  laneHold: [0, 0, 0, 0] as number[],
  gatePoints: [] as { lane: number; x: number; z: number }[],
  /** The player's right hand reaching for something: weight 0..1 and the world point. */
  reach: { w: 0, x: 0, y: 0, z: 0, t: 0, dur: 0 },
  /** A car the player is opening the door of; they get in when the reach lands. -1 = none. */
  entering: -1,
  callX: 1.5,
  callZ: -16.4,
  pending: "" as "" | "misdirect" | "signin" | "cleandesk",
  quiet: 0,
  buzz: 0,
  updatesScreen: "normal" as "normal" | "warn" | "ticket",
  signinScreen: "dark" as "dark" | "alert" | "secured",
  misdirectScreen: "off" as "off" | "compose" | "sent",
  printouts: false,
  playerSticky: variantOf("MON-09-cleandesk")?.sticky_node === "Beat_CleanDesk_Sticky_Player",
  desk07Note: true,
  lockScreen: false,
  greeted: false,
  ending: false,
  endT: 0,
  interactCd: 0,
  barkT: 0,
  minutes: 8 * 60 + 41,
  camX: SPAWN.x,
  camY: 2.4,
  camZ: SPAWN.z + 6,
  lookX: 0,
  lookY: 0,
  stickX: 0,
  stickY: 0,
  touchRun: false,
  wantInteract: false,
  use: "" as string,
  snap: false,
  choice: 0,
  markerSx: 0.5,
  markerSy: 0.35,
  markerDist: 0,
  markerBehind: false,
  markerOn: false,
  captionWho: "",
  captionText: "",
  captionT: 0,
};

export type FleetCar = { x: number; z: number; yaw: number; color: string; kind: "sedan" | "van" };

const fleetHome: FleetCar[] = [
  { x: CAR_SPAWN.x, z: CAR_SPAWN.z, yaw: CAR_SPAWN.yaw, color: "#1e4a86", kind: "sedan" },
  { x: -43.5, z: -12.8, yaw: -0.55, color: "#6a3024", kind: "van" },
  { x: -9.2, z: -13.4, yaw: 0.18, color: "#1a2420", kind: "sedan" },
  { x: 16.4, z: -6.8, yaw: -0.72, color: "#3a3428", kind: "van" },
  { x: 39.5, z: -12.1, yaw: 0.4, color: "#24161c", kind: "sedan" },
];

export const fleet: FleetCar[] = fleetHome.map((car) => ({ ...car }));

function parkCars() {
  fleetHome.forEach((car, index) => Object.assign(fleet[index], car));
}

export const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  left: false,
  right: false,
  up: false,
  down: false,
  run: false,
};

const initial: Data = {
  beat: "tower",
  talk: null,
  bark: null,
  objective: objectiveFor("tower"),
  prompt: null,
  flags: emptyFlags(),
  driving: false,
  paused: false,
  boot: true,
  hint: true,
  minute: 8 * 60 + 41,
  report: false,
  laptopBad: false,
  phoneBad: false,
  wireSent: false,
};

export const useHarbor = create<HarborStore>((set, get) => ({
  ...initial,
  choose: (id) => {
    const fallout = FALLOUT_FROM_CHOICE[id];
    if (fallout) addFallout(fallout);
    // Some mistakes come back later in the shift (docs/MONDAY_V2.md section 5).
    const later = (voice: string, kind: VoiceKind, who: string, text: string, seconds: number) =>
      after(seconds, () => {
        world.barkT = 9;
        get().setBark({ who, text });
        sayLineNext(voice, text, kind, who);
      });
    if (fallout === "usb_plugged") {
      later("v2-fallout-printer", "narrator", "Printer · Floor 14", "The printer by the hot desks wakes up on its own and starts spitting out pages of garbage.", 75);
      later("v2-fallout-it", "woman", "IT Service Desk · ext 4100", "We're seeing strange traffic from fourteen. Did anyone plug anything into a laptop up there tonight?", 85);
    }
    if (fallout === "misdirect_sent") {
      later("v2-fallout-misdirect", "man", "Desk phone · outside caller", "Hi, I think someone at your company just emailed me a manifest full of customer names and addresses. I don't work for you. Thought you should know.", 60);
    }
    if (id === "reception-ok") {
      world.barkT = 6;
      world.captionWho = "June Park · Reception";
      world.captionText = "Straight back, gold doors. Badge in, floor fourteen. Have a good first night.";
      world.captionT = 7;
      say("reception-ok");
      set({
        talk: null,
        bark: { who: "June Park · Reception", text: "Straight back, gold doors. Badge in, floor fourteen." },
        objective: "June Park: elevator at the back. Floor fourteen.",
      });
      return;
    }
    const found = choiceOf(id);
    const flags = applyFlag(get().flags, id);
    recordDecision(id);
    if (found) logDecision(id);
    const bark = barkFor(id);
    if (found?.choice.then?.length) {
      world.misdirectScreen = "sent";
      world.barkT = 4.5;
      world.minutes += 6;
      say(found.choice.voice ?? id);
      set({
        flags,
        talk: panelFor("misdirect", 2),
        bark,
        minute: Math.floor(world.minutes),
      });
      return;
    }
    const beat = nextBeat(id);
    world.barkT = 5.5;
    world.minutes += 11;
    // One narrator line per decision: the debrief. (The short "You did X" consequence line
    // played first sounded like the narrator answering for the player.)
    say(found?.choice.debrief_voice ?? `debrief-${id}`);
    if (beat === "misdirect") world.pending = "misdirect";
    if (beat === "signin") world.pending = "signin";
    if (beat === "cleandesk") world.pending = "cleandesk";
    if (beat === "updates") world.updatesScreen = "warn";
    if (id === "updates-report") world.updatesScreen = "ticket";
    if (id === "signin-yes" || id === "signin-ignore") world.signinScreen = "dark";
    if (id === "signin-report") world.signinScreen = "secured";
    if (id === "misdirect-check" || id === "misdirect-hide" || id === "misdirect-report") {
      world.misdirectScreen = "off";
      world.printouts = true;
    }
    if (id === "cleandesk-home") world.printouts = false;
    if (id === "cleandesk-lock") world.lockScreen = true;
    if (id === "cleandesk-shred") {
      world.printouts = false;
      world.playerSticky = false;
      world.desk07Note = false;
      world.lockScreen = true;
    }
    set({
      flags,
      beat,
      talk: beat === "door" ? talkFor("door") : null,
      bark,
      objective: objectiveFor(beat),
      laptopBad: id === "usb-plug" || get().laptopBad,
      phoneBad: id === "phone-code" || get().phoneBad,
      wireSent: id === "wire-send" || get().wireSent,
      minute: Math.floor(world.minutes),
    });
    if (id === "door-hold") {
      world.guyGone = false;
      world.doorOpen = 1;
      world.reader = "red";
      world.badgeOut = 1;
    }
    if (id === "door-shut") {
      world.guyGone = false;
      world.doorOpen = 0;
      world.reader = "red";
      world.badgeOut = 0;
    }
  },
  setPrompt: (prompt) => {
    if (get().prompt !== prompt) set({ prompt });
  },
  setDriving: (driving) => {
    if (get().driving !== driving) set({ driving });
  },
  setPaused: (paused) => set({ paused }),
  setBoot: (boot) => set({ boot }),
  setHint: (hint) => {
    if (get().hint !== hint) set({ hint });
  },
  setMinute: (minute) => {
    if (get().minute !== minute) set({ minute });
  },
  setBark: (bark) => set({ bark }),
  openPanel: (id) => {
    const talk = panelFor(id);
    if (talk) set({ talk });
  },
  finish: () => {
    if (get().report) return;
    flushFallout();
    sealShift(get().flags);
    const finds = mondayFindCount();
    logShiftComplete("monday", { onTask: world.time.onTask, exploring: world.time.exploring, finds: finds.found, findsTotal: finds.total });
    set({ beat: "done", report: true, objective: objectiveFor("done"), prompt: null, talk: null });
    world.ending = true;
  },
  reset: () => {
    resetRecord();
    newShiftRun();
    resetFocus();
    resetFallout();
    world.px = SPAWN.x;
    world.py = 0;
    world.pz = SPAWN.z;
    world.face = SPAWN.yaw;
    world.camYaw = SPAWN.yaw;
    world.camPitch = 0.08;
    world.driving = false;
    world.carX = CAR_SPAWN.x;
    world.carZ = CAR_SPAWN.z;
    world.carYaw = CAR_SPAWN.yaw;
    world.carSpeed = 0;
    world.brake = false;
    world.wheelSteer = 0;
    world.carRoll = 0;
    world.doorOpen = 0;
    world.reader = "off";
    world.badgeOut = 0;
    world.moving = false;
    world.time = { onTask: 0, exploring: 0, lastDist: Infinity };
    world.walk = 0;
    world.guyX = 1.55;
    world.guyZ = 1.05;
    world.guyVisible = true;
    world.guyGone = false;
    world.fade = 0;
    world.fadingIn = true;
    world.bootT = 0;
    world.transition = null;
    world.cabShown = false;
    world.cabY = 0;
    world.cabZ = -17.36;
    world.elevDoor = 0;
    world.ride = "idle";
    world.rideT = 0;
    world.rideDir = "up";
    world.rideMoved = false;
    world.rideBob = 0;
    world.callLit = false;
    world.cabButton = "";
    world.indicator = "L";
    world.arrow = "";
    world.laneOpen = [0, 0, 0, 0];
    world.laneT = [0, 0, 0, 0];
    world.laneHold = [0, 0, 0, 0];
    world.gatePoints = [];
    world.reach.w = 0;
    world.reach.dur = 0;
    world.entering = -1;
    world.pending = "";
    world.quiet = 0;
    world.buzz = 0;
    world.updatesScreen = "normal";
    world.signinScreen = "dark";
    world.misdirectScreen = "off";
    world.printouts = false;
    noteVariants(pickVariants());
    world.playerSticky = variantOf("MON-09-cleandesk")?.sticky_node === "Beat_CleanDesk_Sticky_Player";
    world.desk07Note = true;
    world.lockScreen = false;
    world.greeted = false;
    world.ending = false;
    world.endT = 0;
    world.interactCd = 0;
    world.barkT = 0;
    world.minutes = 8 * 60 + 41;
    world.wantInteract = false;
    world.use = "";
    world.choice = 0;
    world.stickX = 0;
    world.stickY = 0;
    world.touchRun = false;
    parkCars();
    set({ ...initial, flags: emptyFlags() });
  },
}));

export function resultOf() {
  return scoreOf(useHarbor.getState().flags);
}

noteVariants(currentVariants());
