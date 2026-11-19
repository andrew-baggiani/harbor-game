import type { CheckItem, Scenario, ScenarioChoice } from "@/game/scenarios";

/** The greybox rooms the shift player can build. Each has fixed spots (see src/game/week/sets.ts). */
export type SetKind = "floor" | "lobby" | "cafe" | "home" | "helpdesk" | "server";

/**
 * Who stands at a beat. Greybox figures today; MetaHumans later, keyed by the same slot.
 * Slots follow docs/cast-sheet.md. Voice-only roles never get a body.
 */
export type CastSlot =
  | "dock-runner"
  | "desk-coworker"
  | "contractor"
  | "last-day"
  | "at-home"
  | "night-desk"
  | "admin-peer"
  | "caller";

export type PropKind = "screen" | "phone" | "badge" | "paper" | "laptop" | "drive";

/** A prop with a calm texture (a) and a gone-wrong texture (b). Paths under /assets/textures/. */
export type Prop = { kind: PropKind; a?: string; b?: string; text?: string; textB?: string; /** Opening the prop shows B straight away. */ reveal?: boolean };

/** What the room shows after a choice. `at` is seconds from the choice; the player sees it at 0.4x. */
/** fx: what the room does at this step. Default: an alarm pulse on a flip, a buzz otherwise. "papers" throws sheets out of the prop. */
export type FalloutFx = "alarm" | "buzz" | "papers" | "none";
export type FalloutStep = { at: number; who: string; text: string; flip?: boolean; fx?: FalloutFx };

export type WeekChoice = ScenarioChoice & { voice_line?: string; fallout?: { when: string; text: string } };

export type WeekScenario = Omit<Scenario, "choices" | "next" | "flagKey"> & {
  choices: WeekChoice[];
  next: string;
  flagKey: string;
};

export type WeekBeat = {
  scenario: WeekScenario;
  set: SetKind;
  spot: string;
  cast?: CastSlot;
  /** A voice with no face (phone). The figure is not drawn. */
  voiceOnly?: boolean;
  prop?: Prop;
  /** The waypoint line in the HUD. */
  objective: string;
  /** Delayed fallout per choice id. Missing choices fall back to the choice's debrief. */
  timeline?: Record<string, FalloutStep[]>;
};

export type ShiftKind = "day" | "weekend" | "track" | "ai";
export type Track = "admin" | "finance" | "helpdesk";

export type ShiftDef = {
  id: string;
  kind: ShiftKind;
  /** Short label: Tuesday, Saturday, Finance. */
  day: string;
  title: string;
  topics: string;
  intro: string;
  track?: Track;
  /** Who should take it, in plain words. Tracks and the AI shift. */
  audience?: string;
  beats: WeekBeat[];
  check: CheckItem[];
};
