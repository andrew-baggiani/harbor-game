/**
 * Music, room ambience and sound effects, recorded with ElevenLabs by tools/voice/generate.ps1 into
 * public/audio/<id>.mp3. Until a file exists the game stays quiet for beds and falls back to its small
 * synthesized blips for effects, so nothing breaks while recordings are missing.
 *
 * kind "music" → POST /v1/music (instrumental); "loop" and "sfx" → POST /v1/sound-generation.
 */

export type AudioKind = "music" | "loop" | "sfx";
export type AudioEntry = { id: string; kind: AudioKind; prompt: string; seconds: number; influence?: number };

export const AUDIO: AudioEntry[] = [
  // Music beds. Kept short and calm: they sit under voices and loop with a crossfade.
  {
    id: "music-elevator",
    kind: "music",
    seconds: 60,
    prompt:
      "Classic elevator muzak: breezy bossa nova lounge, soft electric piano, vibraphone melody, light brushed drums, upright bass. Cheerful, polite, a little cheesy. Instrumental, no vocals, steady from start to finish.",
  },
  {
    id: "music-office",
    kind: "music",
    seconds: 90,
    prompt:
      "Unobtrusive modern office background music: soft lo-fi electronic, warm Rhodes chords, gentle muted pulse, low energy, made for focus. Instrumental, no vocals, no build-ups or drops, even level throughout.",
  },
  {
    id: "music-lobby",
    kind: "music",
    seconds: 75,
    prompt:
      "Corporate building lobby music at night: airy ambient pads, sparse soft piano, polished and calm, slightly cinematic. Instrumental, no vocals, no drums, even level throughout.",
  },
  {
    id: "music-cafe",
    kind: "music",
    seconds: 90,
    prompt:
      "Quiet evening cafe jazz trio: piano, upright bass, brushed drums, relaxed and warm, low volume background. Instrumental, no vocals, steady tempo throughout.",
  },
  {
    id: "music-home",
    kind: "music",
    seconds: 75,
    prompt:
      "Calm late-night lo-fi hip hop for a quiet apartment: mellow chords, soft kick and snare, light vinyl crackle. Instrumental, no vocals, even level throughout.",
  },

  // Room tone, made to loop seamlessly.
  {
    id: "amb-office",
    kind: "loop",
    seconds: 22,
    prompt: "Quiet open-plan office at night: steady air conditioning hum, faint distant keyboard typing, an occasional chair creak. No voices.",
  },
  {
    id: "amb-lobby",
    kind: "loop",
    seconds: 22,
    prompt: "Large marble building lobby at night: soft ventilation, quiet reverberant room tone, very faint distant footsteps. No voices.",
  },
  {
    id: "amb-cafe",
    kind: "loop",
    seconds: 22,
    prompt: "Small cafe ambience: low indistinct murmur of conversation, cups and saucers clinking, espresso machine hissing in the distance.",
  },
  {
    id: "amb-home",
    kind: "loop",
    seconds: 22,
    prompt: "Quiet apartment at night: refrigerator hum, faint city traffic outside the window, a clock ticking softly.",
  },
  { id: "amb-server", kind: "loop", seconds: 18, prompt: "Server room: loud steady cooling fans, electrical hum, occasional relay click." },
  {
    id: "amb-harbor",
    kind: "loop",
    seconds: 22,
    prompt: "Waterfront at night: gentle waves lapping against a wooden dock, light wind, a distant ship horn once, faint city hum.",
  },

  // One-shots.
  { id: "sfx-printer", kind: "sfx", seconds: 3, prompt: "Office laser printer waking up and printing one page, rollers and paper feed." },
  { id: "sfx-printer-jam", kind: "sfx", seconds: 2.5, prompt: "Office printer jamming: grinding rollers, then three short error beeps." },
  {
    id: "sfx-printer-spew",
    kind: "sfx",
    seconds: 4,
    prompt: "Office printer rapidly printing many pages in a row, pages sliding out, then a pile of papers sliding off and scattering on the floor.",
  },
  { id: "sfx-coffee", kind: "sfx", seconds: 4, prompt: "Office coffee machine roaring and gurgling loudly, then sputtering out a few drops." },
  { id: "sfx-shred", kind: "sfx", seconds: 2.5, prompt: "Paper shredder briefly shredding a few sheets inside a locked bin." },
  { id: "sfx-bin", kind: "sfx", seconds: 1.5, prompt: "Rummaging through a recycling bin full of paper cups." },
  { id: "sfx-metal-tap", kind: "sfx", seconds: 1, prompt: "Knuckle tapping on a metal fire extinguisher, hollow ring." },
  { id: "sfx-button", kind: "sfx", seconds: 1.5, prompt: "Pressing an elevator call button, soft click, then a gentle chime." },
  { id: "sfx-elevator-ding", kind: "sfx", seconds: 2, prompt: "Elevator arrival bell, one clean ding, followed by doors sliding open." },
  { id: "sfx-camera", kind: "sfx", seconds: 1.5, prompt: "Security camera motor whirring as it pans, then a small electronic beep." },
  { id: "sfx-tv", kind: "sfx", seconds: 1.5, prompt: "TV remote click and a television switching inputs with a soft pop." },
  { id: "sfx-cloth", kind: "sfx", seconds: 1, prompt: "Rustling a wool coat hanging on a hook." },
  { id: "sfx-chair", kind: "sfx", seconds: 2, prompt: "Office chair spinning around with a squeaky wheel." },
  { id: "sfx-monitors", kind: "sfx", seconds: 1.5, prompt: "Security monitor bank buzzing, a small click as the feed switches." },
  { id: "sfx-glass-tap", kind: "sfx", seconds: 1, prompt: "Fingertip tapping twice on a glass sign." },
  { id: "sfx-paper", kind: "sfx", seconds: 1, prompt: "Flipping through a few sheets of paper." },
  { id: "sfx-bell", kind: "sfx", seconds: 1.5, prompt: "Ringing a small metal service bell on a counter, one clear ding." },
  { id: "sfx-chalk", kind: "sfx", seconds: 1, prompt: "Chalk tapping on a chalkboard menu." },
  { id: "sfx-fridge", kind: "sfx", seconds: 2, prompt: "Refrigerator door opening, jars rattling in the door, fridge hum." },
  { id: "sfx-curtain", kind: "sfx", seconds: 1.5, prompt: "Pulling a curtain aside on a rail." },
  { id: "sfx-door", kind: "sfx", seconds: 1.5, prompt: "Peephole cover sliding on an apartment front door, a soft creak." },
  { id: "sfx-find", kind: "sfx", seconds: 1, influence: 0.6, prompt: "Bright short positive discovery chime, two rising notes, clean, game UI." },
  { id: "sfx-alarm", kind: "sfx", seconds: 1.2, influence: 0.6, prompt: "Short urgent two-tone warning alert, game UI, not too loud." },
  { id: "sfx-buzz", kind: "sfx", seconds: 1.2, prompt: "Smartphone vibrating on a wooden desk, two short buzzes." },
  { id: "sfx-poke", kind: "sfx", seconds: 0.6, influence: 0.6, prompt: "Very short soft wooden tap, game UI interaction." },
];

export const audioFile = (id: string) => `/audio/${id}.mp3`;
