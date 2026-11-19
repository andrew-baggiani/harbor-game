import { AUDIO, audioFile } from "@/content/audio";
import { audioContext, voiceBusy } from "@/game/audio";

/**
 * Recorded music, room tone and effects from public/audio. Missing files are simply silent (effects can pass
 * a fallback, usually a synthesized blip), so the game sounds the same as before until recordings land.
 */

const buffers = new Map<string, Promise<AudioBuffer | null>>();

function load(id: string): Promise<AudioBuffer | null> {
  let p = buffers.get(id);
  if (!p) {
    const ctx = audioContext();
    p = !ctx
      ? Promise.resolve(null)
      : fetch(audioFile(id))
          .then((r) => (r.ok ? r.arrayBuffer() : null))
          .then((b) => (b ? ctx.decodeAudioData(b) : null))
          .catch(() => null);
    buffers.set(id, p);
  }
  return p;
}

const ready = new Map<string, AudioBuffer | null>();
function warm(id: string) {
  if (ready.has(id)) return;
  ready.set(id, null);
  void load(id).then((b) => ready.set(id, b));
}

/** Start fetching every effect so the first press isn't silent. Call after a user gesture. */
let warmed = false;
export function warmSounds() {
  if (warmed || !audioContext()) return;
  warmed = true;
  for (const a of AUDIO) if (a.kind === "sfx") warm(a.id);
}

/** Play a one-shot. If it isn't recorded (or not loaded yet), run the fallback instead. */
export function playSfx(id: string, volume = 0.7, fallback?: () => void) {
  const ctx = audioContext();
  const buf = ready.get(id);
  if (!ctx || !buf) {
    warm(id);
    fallback?.();
    return;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = 0.96 + Math.random() * 0.08;
  const g = ctx.createGain();
  g.gain.value = volume;
  src.connect(g).connect(ctx.destination);
  src.start();
}

/* --------------------------------------------------------------------------------------------- beds */

type Layer = { id: string | null; out: GainNode | null; stop: (() => void) | null };
const music: Layer = { id: null, out: null, stop: null };
const room: Layer = { id: null, out: null, stop: null };
const MUSIC_VOL = 0.16;
const ROOM_VOL = 0.24;
let duckTimer = 0;

function musicOn(): boolean {
  try {
    return window.localStorage.getItem("drc-music") !== "off";
  } catch {
    return true;
  }
}

export function isMusicOn() {
  return typeof window !== "undefined" && musicOn();
}

export function toggleMusic(): boolean {
  const on = !musicOn();
  try {
    window.localStorage.setItem("drc-music", on ? "on" : "off");
  } catch {
    /* fine */
  }
  const ctx = audioContext();
  if (ctx && music.out) music.out.gain.setTargetAtTime(on ? MUSIC_VOL : 0, ctx.currentTime, 0.3);
  return on;
}

function layerOut(layer: Layer, vol: number): GainNode | null {
  const ctx = audioContext();
  if (!ctx) return null;
  if (!layer.out) {
    layer.out = ctx.createGain();
    layer.out.gain.value = vol;
    layer.out.connect(ctx.destination);
  }
  return layer.out;
}

/** Loop a buffer into `out`. Music crossfades into itself near the end; room tone loops seamlessly. */
function loopInto(ctx: AudioContext, buf: AudioBuffer, out: GainNode, crossfade: boolean): () => void {
  let alive = true;
  let timer = 0;
  const playing: { src: AudioBufferSourceNode; g: GainNode }[] = [];
  const startOne = (fadeIn: number) => {
    if (!alive) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(1, now + fadeIn);
    src.connect(g).connect(out);
    if (!crossfade) src.loop = true;
    src.start();
    playing.push({ src, g });
    if (crossfade) {
      const XF = Math.min(4, buf.duration / 4);
      g.gain.setValueAtTime(1, now + buf.duration - XF);
      g.gain.linearRampToValueAtTime(0.0001, now + buf.duration);
      timer = window.setTimeout(() => startOne(XF), (buf.duration - XF) * 1000);
      src.onended = () => {
        const i = playing.findIndex((p) => p.src === src);
        if (i >= 0) playing.splice(i, 1);
      };
    }
  };
  startOne(2);
  return () => {
    alive = false;
    window.clearTimeout(timer);
    const now = ctx.currentTime;
    for (const p of playing) {
      p.g.gain.cancelScheduledValues(now);
      p.g.gain.setTargetAtTime(0.0001, now, 0.5);
      p.src.stop(now + 2.5);
    }
  };
}

function setLayer(layer: Layer, id: string | null, vol: number, crossfade: boolean) {
  if (layer.id === id) return;
  layer.stop?.();
  layer.stop = null;
  layer.id = id;
  if (!id) return;
  const ctx = audioContext();
  const out = layerOut(layer, vol);
  if (!ctx || !out) return;
  void load(id).then((buf) => {
    if (!buf || layer.id !== id) return;
    layer.stop = loopInto(ctx, buf, out, crossfade);
  });
}

/** Choose what plays under the scene. Pass null to fade a layer out. */
export function setBed(musicId: string | null, roomId: string | null) {
  setLayer(music, musicId, musicOn() ? MUSIC_VOL : 0, true);
  setLayer(room, roomId, ROOM_VOL, false);
  if (!duckTimer && typeof window !== "undefined") {
    // Music dips while someone is speaking.
    duckTimer = window.setInterval(() => {
      const ctx = audioContext();
      if (!ctx || !music.out) return;
      const target = musicOn() ? (voiceBusy() ? MUSIC_VOL * 0.4 : MUSIC_VOL) : 0;
      music.out.gain.setTargetAtTime(target, ctx.currentTime, 0.25);
    }, 250);
  }
}

/** The bed for each kind of room. */
export const BEDS: Record<string, [string | null, string | null]> = {
  f14: ["music-office", "amb-office"],
  server: [null, "amb-server"],
  lobby: ["music-lobby", "amb-lobby"],
  cafe: ["music-cafe", "amb-cafe"],
  home: ["music-home", "amb-home"],
  harbor: [null, "amb-harbor"],
  elevator: ["music-elevator", null],
};

export function setBedFor(where: keyof typeof BEDS | string) {
  const bed = BEDS[where] ?? [null, null];
  setBed(bed[0], bed[1]);
}
