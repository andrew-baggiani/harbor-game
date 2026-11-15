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

export function say(id: string) {
  if (typeof window === "undefined") return;
  const line = voiceFor(id);
  if (!line) return;
  unlockAudio();
  caption.who = speaker[id] ?? "Harbor";
  caption.text = line.text;
  caption.t = Math.min(16, 5 + line.text.length / 18);
  const audio = context();
  if (!audio) {
    speak(line);
    return;
  }
  void playLine(audio, id, line);
}

async function playLine(audio: AudioContext, id: string, line: { text: string; kind: VoiceKind }) {
  try {
    if (audio.state === "suspended") await audio.resume();
    let buffer = clips.get(id);
    if (!buffer) {
      const response = await fetch(`/voice/${id}.mp3`);
      if (!response.ok) throw new Error("missing");
      buffer = await audio.decodeAudioData(await response.arrayBuffer());
      clips.set(id, buffer);
    }
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
    voice = source;
  } catch {
    speak(line);
  }
}

function speak(line: { text: string; kind: VoiceKind }) {
  if (!window.speechSynthesis) return;
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
  mail: "Elena Voss · email, not Harbor",
  phone: "Caller · says he is Harbor IT",
  usb: "Narrator · break counter",
  maya: "Maya Ruiz · Finance",
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
