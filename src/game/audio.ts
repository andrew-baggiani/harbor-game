import { voiceFor, type VoiceKind } from "@/game/story";

let ctx: AudioContext | null = null;
let engine: { sub: OscillatorNode; tone: OscillatorNode; gain: GainNode; filter: BiquadFilterNode } | null = null;
let ringTimer = 0;
let ringOn = false;
let walking = false;
let walkSpeed = 0;
let stepTimer = 0;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

/** The shared AudioContext, created on first use. Null during SSR. */
export function audioContext(): AudioContext | null {
  return context();
}

export function unlockAudio() {
  const audio = context();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume();
  if (engine) return;

  const sub = audio.createOscillator();
  const tone = audio.createOscillator();
  sub.type = "sine";
  tone.type = "sine";
  sub.frequency.value = 48;
  tone.frequency.value = 72;
  const egain = audio.createGain();
  egain.gain.value = 0;
  const efilter = audio.createBiquadFilter();
  efilter.type = "lowpass";
  efilter.frequency.value = 180;
  sub.connect(efilter);
  tone.connect(efilter);
  efilter.connect(egain);
  egain.connect(audio.destination);
  sub.start();
  tone.start();
  engine = { sub, tone, gain: egain, filter: efilter };
}

export function setEngine(speed: number, on: boolean) {
  if (!engine || !ctx) return;
  const now = ctx.currentTime;
  const gain = on ? Math.min(0.09, 0.02 + Math.abs(speed) * 0.004) : 0;
  engine.gain.gain.setTargetAtTime(gain, now, 0.12);
  engine.sub.frequency.setTargetAtTime(42 + Math.abs(speed) * 3.2, now, 0.1);
  engine.tone.frequency.setTargetAtTime(68 + Math.abs(speed) * 5.5, now, 0.1);
  engine.filter.frequency.setTargetAtTime(160 + Math.abs(speed) * 22, now, 0.1);
}

export function setWalking(on: boolean, speed: number) {
  walking = on;
  walkSpeed = speed;
}

export function setRing(on: boolean) {
  ringOn = on;
}

function thud(freq: number, gainValue: number, seconds: number) {
  if (!ctx) return;
  const audio = ctx;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.7), audio.currentTime + seconds);
  gain.gain.setValueAtTime(gainValue, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + seconds);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + seconds + 0.02);
}

export function tickAudio(dt: number) {
  if (caption.t > 0) caption.t -= dt;
  if (!ctx) return;
  if (walking) {
    stepTimer -= dt;
    const gap = Math.max(0.34, 0.62 - walkSpeed * 0.08);
    if (stepTimer <= 0) {
      stepTimer = gap;
      thud(70 + Math.random() * 18, 0.035, 0.05);
    }
  } else {
    stepTimer = 0;
  }

  if (!ringOn) return;
  ringTimer -= dt;
  if (ringTimer > 0) return;
  ringTimer = 1.35;
  const oscA = ctx.createOscillator();
  const oscB = ctx.createOscillator();
  const gain = ctx.createGain();
  oscA.frequency.value = 486;
  oscB.frequency.value = 612;
  oscA.type = "sine";
  oscB.type = "triangle";
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.42);
  oscA.connect(gain);
  oscB.connect(gain);
  gain.connect(ctx.destination);
  oscA.start();
  oscB.start();
  oscA.stop(ctx.currentTime + 0.46);
  oscB.stop(ctx.currentTime + 0.46);
}

export function blip(freq = 520) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.25, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.18);
}

let voice: AudioBufferSourceNode | null = null;
const clips = new Map<string, AudioBuffer>();
let queued: string | null = null;

/**
 * Line ranks, so fast players never lose the lines that matter:
 * - story: outcomes, debriefs, fallout, beat prompts on Monday. Never cut off; a new story line waits its turn.
 * - dialog: conversation and prompt lines the player clicks through. Replace each other, wait behind story.
 * - chatter: toys, finds, the coworker. Cut by anything, and skipped while a story line is talking.
 */
export type LineRank = "story" | "dialog" | "chatter";
type Waiting = { id: string; rank: LineRank; at: number };
/** Lines that wait for the current one to finish instead of cutting it off. */
let waiting: Waiting[] = [];
let queueTimer: number | null = null;
let voiceGen = 0;
/** What is talking right now (set as soon as a line starts loading, so a slow fetch can't be trampled). */
let current: { rank: LineRank; gen: number } | null = null;
const MAX_WAITING = 5;
/** A line that has waited this long is out of date; skip it rather than play it over a later scene. */
const STALE_MS = 60_000;

function enqueue(id: string, rank: LineRank, front = false) {
  if (waiting.some((w) => w.id === id)) return;
  if (rank === "dialog") waiting = waiting.filter((w) => w.rank !== "dialog");
  const item = { id, rank, at: performance.now() };
  if (front) {
    // Behind any story lines already waiting, ahead of the rest.
    const k = waiting.findIndex((w) => w.rank !== "story");
    if (k < 0) waiting.push(item);
    else waiting.splice(k, 0, item);
  } else waiting.push(item);
  while (waiting.length > MAX_WAITING) {
    const drop = waiting.findIndex((w) => w.rank === "chatter");
    waiting.splice(drop >= 0 ? drop : waiting.findIndex((w) => w.rank === "dialog") >= 0 ? waiting.findIndex((w) => w.rank === "dialog") : 0, 1);
  }
}

/** Stop every voice line and forget the queue (leaving the game, replaying a shift). */
export function stopVoices() {
  voiceGen += 1;
  clearQueue();
  waiting = [];
  current = null;
  playing = false;
  if (voice) {
    try {
      voice.stop();
    } catch {
      /* already stopped */
    }
    voice = null;
  }
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

function lineDone(gen: number) {
  if (gen !== voiceGen) return; // a line that was cut off or stopped
  current = null;
  playing = false;
  queueNext(gen, 400);
}

function clearQueue() {
  queued = null;
  if (queueTimer != null) {
    window.clearTimeout(queueTimer);
    queueTimer = null;
  }
}

function queueNext(gen: number, delayMs: number) {
  if (gen !== voiceGen) return;
  let next: Waiting | null = queued ? { id: queued, rank: "story", at: performance.now() } : null;
  queued = null;
  const now = performance.now();
  while (!next && waiting.length) {
    const w = waiting.shift()!;
    if (now - w.at < STALE_MS) next = w;
  }
  if (!next) return;
  const pick = next;
  queueTimer = window.setTimeout(() => {
    queueTimer = null;
    if (gen !== voiceGen) return;
    start(pick.id, pick.rank);
  }, delayMs);
}

let playing = false;

export function voiceBusy() {
  return playing || current != null || queueTimer != null;
}

// v2 lines (conversations, follow-up calls) register here at runtime instead of
// living in story.ts. Same playback: /voice/v2/<id>.mp3, browser voice if missing.
const extraLines = new Map<string, { text: string; kind: VoiceKind; who: string }>();

export function registerLine(id: string, text: string, kind: VoiceKind, who: string) {
  extraLines.set(id, { text, kind, who });
}

/** Register and play a v2 line in one go. */
export function sayLine(id: string, text: string, kind: VoiceKind, who: string, rank: LineRank = "story") {
  registerLine(id, text, kind, who);
  say(id, undefined, rank);
}

/** Play after whatever is talking now finishes (or right away if nothing is). */
export function sayNext(id: string, rank: LineRank = "story") {
  if (typeof window === "undefined") return;
  if (current || queueTimer != null) {
    if (rank === "chatter" && current?.rank === "story") return;
    enqueue(id, rank);
    return;
  }
  start(id, rank);
}

export function sayLineNext(id: string, text: string, kind: VoiceKind, who: string, rank: LineRank = "story") {
  registerLine(id, text, kind, who);
  sayNext(id, rank);
}

/**
 * Play a line now, unless a story line is talking: then a story or dialog line waits its turn
 * (next in line) and chatter is skipped. Captions on screen still show either way.
 */
export function say(id: string, thenId?: string, rank: LineRank = "story") {
  if (typeof window === "undefined") return;
  if (current?.rank === "story") {
    if (rank === "chatter") return;
    enqueue(id, rank, true);
    if (thenId) enqueue(thenId, "story", true);
    return;
  }
  start(id, rank, thenId);
}

function start(id: string, rank: LineRank, thenId?: string) {
  const extra = extraLines.get(id);
  const line = extra ?? voiceFor(id);
  if (!line) return;
  clearQueue();
  waiting = waiting.filter((w) => w.id !== id);
  const gen = ++voiceGen;
  current = { rank, gen };
  queued = thenId ?? null;
  unlockAudio();
  caption.who = extra?.who ?? speaker[id] ?? (id.startsWith("debrief-") ? "Narrator · debrief" : "Harbor");
  caption.text = line.text;
  caption.t = Math.min(16, 5 + line.text.length / 18);
  const audio = context();
  if (!audio) {
    speak(line, gen);
    return;
  }
  void playLine(audio, id, line, gen, rank);
}

async function playLine(audio: AudioContext, id: string, line: { text: string; kind: VoiceKind }, gen: number, rank: LineRank = "story") {
  try {
    if (audio.state === "suspended") await audio.resume();
    let buffer = clips.get(id);
    if (!buffer) {
      const response = await fetch(`/voice/v2/${id}.mp3`);
      if (!response.ok) throw new Error("missing");
      buffer = await audio.decodeAudioData(await response.arrayBuffer());
      clips.set(id, buffer);
    }
    if (gen !== voiceGen) return; // replaced or stopped while loading
    if (voice) {
      try {
        voice.stop();
      } catch {
        /* already stopped */
      }
    }
    const source = audio.createBufferSource();
    source.buffer = buffer;
    const gain = audio.createGain();
    gain.gain.value = 0.95;
    source.connect(gain);
    gain.connect(audio.destination);
    source.start();
    playing = true;
    voice = source;
    source.onended = () => {
      if (voice === source) {
        voice = null;
        lineDone(gen);
      }
    };
  } catch {
    // Not recorded yet. Story lines fall back to the browser voice; chatter just stays on screen,
    // since a robot reading a joke kills the joke.
    if (rank === "chatter") window.setTimeout(() => lineDone(gen), Math.min(9000, 1500 + line.text.length * 55));
    else speak(line, gen);
  }
}


function speak(line: { text: string; kind: VoiceKind }, gen: number) {
  if (gen !== voiceGen) return;
  if (!window.speechSynthesis) {
    // No voice at all: hold the slot about as long as the caption, so the queue still paces.
    window.setTimeout(() => lineDone(gen), Math.min(9000, 1500 + line.text.length * 55));
    return;
  }
  const synth = window.speechSynthesis;
  const run = () => {
    synth.cancel();
    const uttered = new SpeechSynthesisUtterance(line.text);
    uttered.rate = 1;
    uttered.pitch = line.kind === "woman" ? 1.14 : line.kind === "man" ? 0.82 : 0.98;
    const voices = synth.getVoices().filter((item) => item.lang.toLowerCase().startsWith("en"));
    const match = (kind: VoiceKind) =>
      voices.find((item) =>
        kind === "woman"
          ? /female|samantha|victoria|zira|aria|karen|moira|serena/i.test(item.name)
          : kind === "man"
            ? /male|daniel|david|alex|fred|rishi|aaron/i.test(item.name)
            : /samantha|daniel|google/i.test(item.name),
      );
    const picked = match(line.kind) ?? voices[0];
    if (picked) uttered.voice = picked;
    uttered.onend = () => lineDone(gen);
    playing = true;
    synth.speak(uttered);
  };
  if (synth.getVoices().length === 0) {
    synth.onvoiceschanged = () => run();
    return;
  }
  run();
}

export const caption = { who: "", text: "", t: 0 };

const speaker: Record<string, string> = {
  brief: "Narrator",
  door: "Courier · no badge",
  reception: "June Park · Reception",
  "reception-ok": "June Park · Reception",
  mail: "Narrator · mail from \"Elena Voss\"",
  phone: "Caller · says he's Dan, Harbor IT",
  usb: "Narrator · break counter",
  maya: "Maya Ruiz · Finance",
  updates: "Narrator",
  signin: "Narrator",
  misdirect: "Maya Ruiz · chat",
  cleandesk: "Narrator",
  "door-hold": "Narrator",
  "door-shut": "Narrator",
  "mail-codes": "Narrator",
  "mail-report": "Narrator",
  "mail-ignore": "Narrator",
  "phone-code": "Narrator",
  "phone-hangup": "Narrator",
  "usb-plug": "Narrator",
  "usb-it": "Narrator",
  "usb-leave": "Narrator",
  "wire-send": "Narrator",
  "wire-call": "Narrator",
  "wire-refuse": "Narrator",
};
