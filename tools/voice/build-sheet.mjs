// Builds docs/voice-all.json (every week, AI-shift and optional-play line, with its ElevenLabs voice) and
// docs/audio-all.json (music, room tone and sound effects from src/content/audio.ts).
// Run: node tools/voice/build-sheet.mjs
import { createJiti } from "jiti";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });
const { SHIFTS } = await jiti.import(join(root, "src/content/week/index.ts"));
const { allLines } = await jiti.import(join(root, "src/content/week/voices.ts"));
const { playLines } = await jiti.import(join(root, "src/content/week/play.ts"));
const { AUDIO } = await jiti.import(join(root, "src/content/audio.ts"));

const V = {
  narrator: ["Benjamin (Monday narrator)", "rBBV1yn6Ib1hDeOTrn08"],
  "desk-coworker": ["Tasha (Monday's Maya)", "az2Mp58wQOuqO5SHlCwL"],
  "Next desk": ["Will, coworker", "bIHbv24MWmeRgasZH58o"],
  Barista: ["Hope, natural", "OYTbf65OHHFELVut7v2H"],
};
// Earlier casting decisions win: keep the voice already chosen for any line id.
const prior = new Map(JSON.parse(readFileSync(join(root, "docs/voice-week-script.json"), "utf8")).map((l) => [l.id, l]));

const out = [];
for (const l of allLines(SHIFTS)) {
  const p = prior.get(l.id);
  const [voice, voice_id] = p ? [p.voice, p.voice_id] : (V[l.cast] ?? V[l.who] ?? V.narrator);
  out.push({ id: l.id, text: l.text, who: l.who, shift: l.shift, voice, voice_id });
}
for (const l of playLines()) {
  const [voice, voice_id] = V[l.who] ?? V.narrator;
  out.push({ id: l.id, text: l.text, who: l.who, shift: "play", voice, voice_id });
}
writeFileSync(join(root, "docs/voice-all.json"), JSON.stringify(out, null, 1) + "\n");
const chars = out.reduce((n, l) => n + l.text.length, 0);
console.log(`${out.length} lines, ${chars} characters -> docs/voice-all.json`);

writeFileSync(join(root, "docs/audio-all.json"), JSON.stringify(AUDIO, null, 1) + "\n");
const secs = (k) => AUDIO.filter((a) => a.kind === k).reduce((n, a) => n + a.seconds, 0);
console.log(`${AUDIO.length} music/sound entries (${secs("music")} s music, ${secs("loop")} s room tone, ${secs("sfx")} s effects) -> docs/audio-all.json`);
