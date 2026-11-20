import type { SetKind } from "@/content/week/types";

/**
 * Optional play in the week shifts: things to poke (toys), security slip-ups to spot (finds), and the
 * coworker who never stops talking. None of it gates a beat or the debrief. See docs/FUN.md.
 *
 * Coordinates are world coordinates of the modeled rooms (floor 14 sits at y = 50.6). Toys hang off
 * objects already in the models; finds are small props this file places.
 */

/** The modeled place a set is drawn in. Floor 14's three sets share one floor, so they share its toys and finds. */
export type Place = "f14" | "lobby" | "cafe" | "home";

export const PLACE_OF: Record<SetKind, Place> = {
  floor: "f14",
  helpdesk: "f14",
  server: "f14",
  lobby: "lobby",
  cafe: "cafe",
  home: "home",
};

export type Toy = {
  id: string;
  place: Place;
  /** Object centre; the player interacts within `r` metres of (x, z). */
  x: number;
  y: number;
  z: number;
  r?: number;
  label: string;
  /** Who the reaction comes from. Defaults to the object's label. */
  who?: string;
  /** One line per press, in order; the last one repeats. */
  lines: string[];
  /** Press numbers (0-based) on which paper flies out of it. */
  papers?: number[];
  /** Sound per press (an array is read by press number, the last one repeats). */
  sfx?: string | string[];
};

export type FindKind = "sticky" | "badge" | "paper" | "usb" | "tablet" | "flyer" | "board";

export type Find = {
  id: string;
  place: Place;
  kind: FindKind;
  x: number;
  y: number;
  z: number;
  /** Radians about Y the prop faces (0 = +Z). Flat props lie on the surface. */
  face?: number;
  flat?: boolean;
  /** What's written on it. */
  text: string;
  r?: number;
  label: string;
  /** What the player hears when they spot it. */
  line: string;
  /** One sentence for the debrief: why it matters. */
  why: string;
  /** False where Monday already has a beat about the same thing nearby. */
  monday?: boolean;
};

const F = 50.6;

export const TOYS: Toy[] = [
  // Floor 14
  {
    id: "f14-printer",
    sfx: ["sfx-printer", "sfx-printer-jam", "sfx-printer-spew"],
    place: "f14",
    x: 7.86,
    y: F + 0.55,
    z: -16.0,
    r: 1.5,
    label: "Printer",
    lines: [
      "It wakes up, thinks about it, and prints a test page that just says HELP.",
      "Paper jam in tray 2. There is no tray 2.",
      "It's printing someone's 40-page fantasy football draft. In color. All of it. Right now.",
    ],
    papers: [2],
  },
  {
    id: "f14-coffee",
    sfx: "sfx-coffee",
    place: "f14",
    x: 6.9,
    y: F + 1.1,
    z: -12.3,
    r: 1.6,
    label: "Coffee machine",
    lines: [
      "A sign on it says FIXED! Under that, a second sign: NOT FIXED.",
      "It makes a noise like a jet engine and produces four drops.",
      "Decaf. Someone put decaf in the office machine. On purpose.",
    ],
  },
  {
    id: "f14-shred",
    sfx: "sfx-shred",
    place: "f14",
    x: 5.85,
    y: F + 0.5,
    z: -16.32,
    label: "Shred bin",
    lines: ["Locked, with a slot. That's the whole point of it, and it knows.", "You hear something inside it being destroyed properly. Lovely."],
  },
  {
    id: "f14-recycle",
    sfx: "sfx-bin",
    place: "f14",
    x: 6.5,
    y: F + 0.36,
    z: -16.34,
    label: "Recycling",
    lines: ["Mostly coffee cups. Someone recycled a stapler.", "Paper goes in here. Paper with customer names goes in the locked one next to it."],
  },
  {
    id: "f14-extinguisher",
    sfx: "sfx-metal-tap",
    place: "f14",
    x: 4.6,
    y: F + 0.6,
    z: -16.51,
    label: "Fire extinguisher",
    lines: ["Last inspected in 2019. Probably fine.", "You decide not to test it."],
  },
  {
    id: "f14-elevator",
    sfx: "sfx-button",
    place: "f14",
    x: 2.65,
    y: F + 1.1,
    z: -16.52,
    label: "Elevator button",
    lines: ["You press it. It lights up. The elevator considers your request.", "Pressing it again does not make it faster. You press it again."],
  },
  {
    id: "f14-camera",
    sfx: "sfx-camera",
    place: "f14",
    x: 0.4,
    y: F + 2.9,
    z: -13.2,
    r: 1.6,
    label: "Camera",
    lines: ["The camera's light blinks. It sees you. It is not impressed.", "You wave. Somewhere in the lobby, a guard does not wave back."],
  },
  {
    id: "f14-tv",
    sfx: "sfx-tv",
    place: "f14",
    x: -8.2,
    y: F + 1.35,
    z: -15.8,
    r: 1.8,
    label: "Meeting room TV",
    lines: ["The TV is on the input menu. It has always been on the input menu.", "HDMI 1. HDMI 2. HDMI 3. Nothing has ever been plugged into any of them."],
  },
  {
    id: "f14-coats",
    sfx: "sfx-cloth",
    place: "f14",
    x: -9.9,
    y: F + 1.3,
    z: -3.1,
    label: "Coat hooks",
    lines: ["One coat. It's been here since the holiday party.", "There's a badge in the pocket. You leave the coat alone and tell yourself to mention it."],
  },
  {
    id: "f14-chair",
    sfx: "sfx-chair",
    place: "f14",
    x: -5.83,
    y: F + 0.5,
    z: -2.7,
    r: 0.9,
    label: "Your chair",
    who: "Next desk",
    lines: ['You spin the chair. "Saw that."', 'Second spin. "Still saw that."'],
  },
  // Lobby
  {
    id: "lob-monitors",
    sfx: "sfx-monitors",
    place: "lobby",
    x: -4.4,
    y: 1.0,
    z: -9.7,
    r: 1.8,
    label: "Security monitors",
    lines: ["Twelve camera feeds. One of them is pointed at the guard's lunch.", "Feed 7 shows you looking at feed 7."],
  },
  {
    id: "lob-directory",
    sfx: "sfx-glass-tap",
    place: "lobby",
    x: 4.55,
    y: 1.0,
    z: -10.55,
    label: "Directory",
    lines: ['Floor 14: Harbor & Co. Floor 15: "Coming soon" since 2021.', "Someone has added a sticker: FLOOR 13 (ASK)."],
  },
  {
    id: "lob-art",
    place: "lobby",
    x: 10.3,
    y: 1.8,
    z: -6.0,
    r: 1.8,
    label: "Lobby art",
    lines: ["Abstract art. The little plaque says it's called Synergy.", "The longer you look at Synergy, the less you understand it."],
  },
  {
    id: "lob-mail",
    sfx: "sfx-paper",
    place: "lobby",
    x: -10.0,
    y: 0.9,
    z: -10.4,
    r: 1.6,
    label: "Mail shelf",
    lines: ['A parcel addressed to "The IT Guy". No name. You don\'t open it.', "Three catalogs for a company that moved out in 2022."],
  },
  // Cafe
  {
    id: "cafe-bell",
    sfx: "sfx-bell",
    place: "cafe",
    x: 4.2,
    y: 1.1,
    z: -1.3,
    r: 1.6,
    label: "Counter bell",
    who: "Barista",
    lines: ['Ding. "One sec." They do not come back.', 'Ding. "Still one sec."', "Ding. A long, tired look."],
  },
  {
    id: "cafe-menu",
    sfx: "sfx-chalk",
    place: "cafe",
    x: 4.6,
    y: 2.0,
    z: -2.4,
    r: 1.8,
    label: "Menu board",
    lines: ["Today's special: the Phishing Trip latte. It's a regular latte.", 'Oat, almond, soy, and something called "cloud milk". You don\'t ask.'],
  },
  {
    id: "cafe-specials",
    sfx: "sfx-chalk",
    place: "cafe",
    x: -0.5,
    y: 1.0,
    z: 4.4,
    r: 1.4,
    label: "Chalkboard",
    lines: ['"Ask about our Wi-Fi!" Please don\'t. They will tell you.', "Someone has drawn a very good cat."],
  },
  {
    id: "cafe-art",
    place: "cafe",
    x: -2.6,
    y: 1.75,
    z: 4.8,
    r: 1.4,
    label: "A painting",
    lines: ["A boat. The price tag says $4,000. It's a nice boat.", "On closer look, the boat is also for sale."],
  },
  // Home
  {
    id: "home-fridge",
    sfx: "sfx-fridge",
    place: "home",
    x: -5.57,
    y: 1.45,
    z: -4.0,
    r: 1.4,
    label: "Fridge",
    lines: ["A magnet says LIVE LAUGH LOG OUT.", "Leftovers, a single olive, and a lot of hot sauce."],
  },
  {
    id: "home-curtains",
    sfx: "sfx-curtain",
    place: "home",
    x: 3.0,
    y: 1.3,
    z: -4.6,
    r: 1.8,
    label: "Window",
    lines: ["From the street, you'd see your second monitor clearly. Worth knowing.", "A neighbor waves. You wave. Neither of you will mention this."],
  },
  {
    id: "home-door",
    sfx: "sfx-door",
    place: "home",
    x: -4.05,
    y: 1.0,
    z: 4.3,
    r: 1.5,
    label: "Front door",
    lines: ["Through the peephole: a delivery driver taking a selfie with your package.", "Nobody. A leaf."],
  },
  {
    id: "home-photo",
    place: "home",
    x: -5.9,
    y: 1.6,
    z: 1.0,
    r: 1.4,
    label: "Family photo",
    lines: ["Everyone's blinking except the dog. The dog is perfect.", "It's also the answer to every one of your security questions. Hm."],
  },
];

export const FINDS: Find[] = [
  // Floor 14
  {
    id: "f14-sticky",
    place: "f14",
    kind: "sticky",
    x: 4.36,
    y: F + 0.98,
    z: -7.16,
    face: 0,
    text: "WiFi + VPN: Harbor2026!",
    label: "Sticky note",
    line: "A sticky note on a monitor: the Wi-Fi and VPN password, for anyone walking past.",
    why: "A password on a sticky note is a password for everyone who walks by, cleaners and visitors included.",
  },
  {
    id: "f14-badge",
    place: "f14",
    kind: "badge",
    x: 7.55,
    y: F + 1.03,
    z: -10.15,
    flat: true,
    face: 1.2,
    text: "HARBOR · STAFF · Floor 14",
    label: "Badge",
    r: 1.6,
    line: "A staff badge left on the break counter. Its owner is somewhere without it.",
    why: "A loose badge opens doors for whoever picks it up. Hand it to security, not back to the counter.",
    monday: false,
  },
  {
    id: "f14-print",
    place: "f14",
    kind: "paper",
    x: 7.86,
    y: F + 1.07,
    z: -15.84,
    flat: true,
    face: 0,
    text: "HR_Comp_Review_FINAL · Page 1 of 9 · CONFIDENTIAL",
    label: "Printout",
    line: "Page one of the salary review, sitting in the printer tray since this afternoon.",
    why: "Printouts left in the tray are the most common data leak in an office. Pick up what you print.",
    monday: false,
  },
  {
    id: "f14-usb",
    place: "f14",
    kind: "usb",
    x: -6.05,
    y: F + 0.765,
    z: -8.4,
    flat: true,
    face: 0.4,
    text: "BONUS LIST",
    label: "USB stick",
    line: "A USB stick on an empty desk, labeled BONUS LIST. Of course it is.",
    why: "A found USB stick goes to IT unplugged. A tempting label is how they get plugged in.",
    monday: false,
  },
  {
    id: "f14-board",
    place: "f14",
    kind: "board",
    x: -9.955,
    y: F + 1.08,
    z: -14.95,
    face: Math.PI / 2,
    text: "Guest WiFi: Welcome1   Admin portal: admin / Harbor!14",
    label: "Whiteboard",
    r: 1.8,
    line: "On the meeting room whiteboard, under the sprint plan: the admin portal login.",
    why: "Whiteboards get photographed in every video call. Credentials never go on one.",
  },
  // Lobby
  {
    id: "lob-monitor-note",
    place: "lobby",
    kind: "sticky",
    x: -3.9,
    y: 1.22,
    z: -9.605,
    face: 0,
    text: "CCTV login: guard / guard",
    label: "Note on the monitors",
    r: 1.6,
    line: "A sticky note on the security monitors: the camera system login. It's guard, guard.",
    why: "The login for the cameras is the login for watching the whole building. It doesn't go on the screen.",
  },
  {
    id: "lob-stair-note",
    place: "lobby",
    kind: "paper",
    x: 8.58,
    y: 1.05,
    z: -15.25,
    face: -Math.PI / 2,
    text: "ALARM OFF. Propped for deliveries. Back in 5. (Tues)",
    label: "Note on the stair door",
    r: 1.6,
    line: "Taped to the stair door: the alarm's off and it's propped for deliveries. The note is from Tuesday.",
    why: "A propped door with the alarm off skips every badge reader in the building. Report it; don't just close it.",
  },
  // Cafe
  {
    id: "cafe-qr",
    place: "cafe",
    kind: "flyer",
    x: 1.6,
    y: 1.55,
    z: 4.96,
    face: Math.PI,
    text: "FREE WIFI UPGRADE · Scan to connect faster",
    label: "QR flyer",
    r: 1.5,
    line: "A flyer taped to the wall: scan this QR code for faster Wi-Fi. The cafe didn't put it there.",
    why: "QR codes in public places get swapped for phishing ones. Check where it takes you before you sign in to anything.",
  },
  {
    id: "cafe-badge",
    place: "cafe",
    kind: "badge",
    x: -1.4,
    y: 0.006,
    z: 0.6,
    flat: true,
    face: 2.1,
    text: "MERIDIAN HEALTH · STAFF",
    label: "Dropped badge",
    r: 1.3,
    line: "Someone's work badge on the floor under a table. Name, photo, company, all on it.",
    why: "A badge in public tells a stranger where you work and what you look like. Keep it out of sight off-site.",
  },
  // Home
  {
    id: "home-fridge-note",
    place: "home",
    kind: "sticky",
    x: -5.4,
    y: 1.55,
    z: -4.26,
    face: 0,
    text: "ALL passwords: Biscuit2024",
    label: "Fridge note",
    r: 1.4,
    line: "On the fridge, in your own handwriting: one password for everything. It's the dog's name.",
    why: "One password everywhere means one leak opens all of it. A password manager fixes this in an afternoon.",
  },
  {
    id: "home-tablet",
    place: "home",
    kind: "tablet",
    x: 0.6,
    y: 0.006,
    z: 2.7,
    flat: true,
    face: 0.7,
    text: "Signed in: you@work · Outlook",
    label: "Tablet",
    r: 1.3,
    line: "The kids' tablet on the rug, still signed in to your work email.",
    why: "A shared family device signed in to work means your mailbox goes wherever the tablet goes. Sign out, or use a work profile.",
  },
];

/** The coworker at the next desk on floor 14. Name-free, so the company-name swap keeps working. */
export const COWORKER = {
  who: "Next desk",
  hello: [
    "Oh good, you're here. Did I tell you about the kayak? I'll tell you later.",
    "Back again. The kayak thing has developed.",
    "You won't believe what the kayak guy said. Later. Go, go.",
  ],
  nudge: [
    "Not to rush you, but there's a gold light over there with your name on it.",
    "The thing at the light is still waiting. I'm just saying.",
    "I can see you exploring. I respect it. The light, though.",
  ],
  onFind: ["Ooh. Good eye.", "Yikes. Bag it and tell someone.", "That's going in my story about this place.", "How did you even see that."],
  allFound: "You found every one on this floor. I'm going to need you to do my desk next.",
};

/** Away from the beat this long (ms, while walking) before the nudge. */
export const NUDGE_AFTER = 45_000;

export function placeOf(kind: SetKind): Place {
  return PLACE_OF[kind];
}

/* ------------------------------------------------------------------ voice ids (files at /voice/v2/<id>.mp3) */

export const toyLineId = (toy: Toy, n: number) => `play-${toy.id}-${n}`;
export const findLineId = (find: Find) => `play-find-${find.id}`;
export const cwLineId = (kind: "hello" | "nudge" | "find", n: number) => `play-cw-${kind}-${n}`;
export const CW_ALL_ID = "play-cw-all";
export const PHONE_NUDGE = {
  id: "play-phone-nudge",
  text: "Your phone buzzes: the thing you came here for is still waiting.",
};

/** Speakers in this file who have their own voice. Everything else is read by the narrator. */
export const PLAY_VOICES: Record<string, "man" | "woman"> = {
  "Next desk": "man",
  Barista: "woman",
};

/** Every voiced optional line, for the recording sheet. */
export function playLines(): { id: string; text: string; who: string }[] {
  const out: { id: string; text: string; who: string }[] = [];
  for (const t of [...TOYS, CAB_TOY]) t.lines.forEach((text, n) => out.push({ id: toyLineId(t, n), text, who: t.who ?? "Narrator" }));
  for (const f of FINDS) out.push({ id: findLineId(f), text: f.line, who: "Narrator" });
  COWORKER.hello.forEach((text, n) => out.push({ id: cwLineId("hello", n), text, who: COWORKER.who }));
  COWORKER.nudge.forEach((text, n) => out.push({ id: cwLineId("nudge", n), text, who: COWORKER.who }));
  COWORKER.onFind.forEach((text, n) => out.push({ id: cwLineId("find", n), text, who: COWORKER.who }));
  out.push({ id: CW_ALL_ID, text: COWORKER.allFound, who: COWORKER.who });
  out.push({ id: PHONE_NUDGE.id, text: PHONE_NUDGE.text, who: "Narrator" });
  return out;
}

/** Finds that Monday shows: floor 14 and the lobby, minus the ones Monday already teaches as a beat. */
export const MONDAY_FINDS = FINDS.filter((f) => (f.place === "f14" || f.place === "lobby") && f.monday !== false);
export const MONDAY_TOYS = TOYS.filter((t) => t.place === "f14" || t.place === "lobby");

/** The panel inside Monday's elevator cab. Pressed during the ride; the cab moves, so it has no fixed spot. */
export const CAB_TOY: Toy = {
  id: "cab-panel",
  place: "lobby",
  x: 0,
  y: 0,
  z: 0,
  label: "Floor buttons",
  sfx: "sfx-button",
  lines: [
    "You press 9. It lights up. The elevator is going to 14 and does not care about 9.",
    "You press 10, 11 and 12. Somewhere in facilities, a log file fills up.",
    "Door Close. It has not been wired to anything since 1998. You press it anyway.",
    "The emergency call button looks at you. You leave it alone. Good call.",
  ],
};

/** The sound for a toy's nth press. Falls back to a soft tap. */
export function toySfx(toy: Toy, n: number): string {
  if (!toy.sfx) return "sfx-poke";
  if (typeof toy.sfx === "string") return toy.sfx;
  return toy.sfx[Math.min(n, toy.sfx.length - 1)];
}
