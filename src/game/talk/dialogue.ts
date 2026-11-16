// Generic in-world conversation: nodes the NPC says, choices the player picks,
// "look" choices that inspect something without moving the conversation on.
// Ends map to v1 choice ids so story/records/debrief keep working.

export type TalkContent = {
  id: string;
  speaker: { who: string; role: string };
  start: string;
  nodes: Record<string, { say: string; options: string[]; pressure?: boolean }>;
  choices: Record<string, { label: string; next?: string; end?: string; look?: string; evidence?: string }>;
  tells: { tell: string; why: string }[];
  outcomes: Record<string, number>;
  headlines?: Record<string, string>;
};

export type TalkLine = { who: "npc" | "you" | "look"; text: string };

export type TalkResult = {
  choiceId: string;
  score: number;
  evidence: string[];
  tellsTotal: number;
  turns: number;
  ms: number;
};

export class Dialogue {
  node: string;
  lines: TalkLine[] = [];
  evidence = new Set<string>();
  looked = new Set<string>();
  ended: string | null = null;
  turns = 0;
  started = Date.now();

  constructor(readonly c: TalkContent) {
    this.node = c.start;
    this.lines.push({ who: "npc", text: c.nodes[c.start].say });
  }

  /** Current line from the NPC (last thing they said). */
  get say(): string {
    for (let i = this.lines.length - 1; i >= 0; i--) if (this.lines[i].who === "npc") return this.lines[i].text;
    return "";
  }

  options() {
    if (this.ended) return [];
    return this.c.nodes[this.node].options
      .filter((id) => !this.looked.has(id))
      .map((id) => ({ id, label: this.c.choices[id].label, look: !!this.c.choices[id].look }));
  }

  pick(id: string) {
    const ch = this.c.choices[id];
    if (!ch || this.ended) return;
    if (ch.evidence) this.evidence.add(ch.evidence);
    if (ch.look) {
      this.looked.add(id);
      this.lines.push({ who: "look", text: ch.look });
      return;
    }
    this.turns++;
    this.lines.push({ who: "you", text: ch.label });
    if (ch.end) {
      this.ended = ch.end;
      return;
    }
    if (ch.next) {
      this.node = ch.next;
      this.lines.push({ who: "npc", text: this.c.nodes[ch.next].say });
    }
  }

  result(now = Date.now()): TalkResult {
    const id = this.ended ?? Object.keys(this.c.outcomes)[0];
    return {
      choiceId: id,
      score: this.c.outcomes[id] ?? 0,
      evidence: [...this.evidence],
      tellsTotal: this.c.tells.length,
      turns: this.turns,
      ms: now - this.started,
    };
  }
}
