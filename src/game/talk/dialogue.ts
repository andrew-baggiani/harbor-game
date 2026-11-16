// Generic in-world conversation: nodes the NPC says, choices the player picks,
// "look" choices that inspect something without moving the conversation on,
// "act" choices that do something (shred, lock) and stay done, and "finish"
// choices that end the beat with an outcome picked from what you did.
// Ends map to v1 choice ids so story/records/debrief keep working.

import type { VoiceKind } from "@/game/story";

export type TalkChoice = {
  label: string;
  next?: string;
  end?: string;
  look?: string;
  /** One-time action: shows `act` as a line, records `does`, stays in this node. */
  act?: string;
  does?: string;
  /** Ends the beat: first rule whose `need` you've all done (and `not` none) wins. */
  finish?: { need?: string[]; not?: string[]; id: string }[];
  evidence?: string;
};

export type TalkContent = {
  id: string;
  speaker: { who: string; role: string; kind?: VoiceKind };
  /** Voice ids are `${voice}-${node}`; the start node is voiced by the beat's v1 clip. */
  voice?: string;
  start: string;
  nodes: Record<string, { say: string; options: string[]; pressure?: boolean; who?: string; kind?: VoiceKind }>;
  choices: Record<string, TalkChoice>;
  tells: { tell: string; why: string }[];
  outcomes: Record<string, number>;
  headlines?: Record<string, string>;
  /** The "speaker" is a thing, not a person: show its lines as plain narration. */
  narration?: boolean;
};

export type TalkLine = { who: "npc" | "you" | "look" | "act"; text: string; by?: string };

export type TalkResult = {
  choiceId: string;
  score: number;
  evidence: string[];
  done: string[];
  tellsTotal: number;
  turns: number;
  ms: number;
};

export class Dialogue {
  node: string;
  lines: TalkLine[] = [];
  evidence = new Set<string>();
  used = new Set<string>();
  done = new Set<string>();
  ended: string | null = null;
  turns = 0;
  started = Date.now();

  constructor(readonly c: TalkContent) {
    this.node = c.start;
    this.lines.push({ who: "npc", text: c.nodes[c.start].say, by: c.nodes[c.start].who });
  }

  /** Last thing the NPC (or narrator) said, and who said it. */
  get last(): TalkLine {
    for (let i = this.lines.length - 1; i >= 0; i--) if (this.lines[i].who === "npc") return this.lines[i];
    return { who: "npc", text: "" };
  }

  options() {
    if (this.ended) return [];
    return this.c.nodes[this.node].options
      .filter((id) => !this.used.has(id))
      .map((id) => {
        const ch = this.c.choices[id];
        return { id, label: ch.label, kind: ch.look ? "look" : ch.act ? "act" : ch.finish || ch.end ? "end" : "say" };
      });
  }

  pick(id: string) {
    const ch = this.c.choices[id];
    if (!ch || this.ended) return;
    if (ch.evidence) this.evidence.add(ch.evidence);
    if (ch.look) {
      this.used.add(id);
      this.lines.push({ who: "look", text: ch.look });
      return;
    }
    if (ch.act) {
      this.used.add(id);
      if (ch.does) this.done.add(ch.does);
      this.lines.push({ who: "act", text: ch.act });
      return;
    }
    this.turns++;
    this.lines.push({ who: "you", text: ch.label });
    if (ch.finish) {
      const rule = ch.finish.find(
        (r) => (r.need ?? []).every((d) => this.done.has(d)) && !(r.not ?? []).some((d) => this.done.has(d)),
      );
      this.ended = rule?.id ?? ch.finish[ch.finish.length - 1].id;
      return;
    }
    if (ch.end) {
      this.ended = ch.end;
      return;
    }
    if (ch.next) {
      this.node = ch.next;
      const n = this.c.nodes[ch.next];
      this.lines.push({ who: "npc", text: n.say, by: n.who });
    }
  }

  result(now = Date.now()): TalkResult {
    const id = this.ended ?? Object.keys(this.c.outcomes)[0];
    return {
      choiceId: id,
      score: this.c.outcomes[id] ?? 0,
      evidence: [...this.evidence],
      done: [...this.done],
      tellsTotal: this.c.tells.length,
      turns: this.turns,
      ms: now - this.started,
    };
  }
}
