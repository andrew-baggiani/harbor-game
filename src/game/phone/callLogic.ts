// Pure logic for the phone beat as a conversation. No React.

export type CallContent = {
  id: string;
  caller_id: { name: string; number: string };
  sms: { from: string; text: string; tell: string; why: string };
  idle_seconds: number;
  idle_line: string;
  start: string;
  nodes: Record<string, { say: string; options: string[] }>;
  choices: Record<string, { label: string; next?: string; end?: "code" | "hangup"; evidence?: string }>;
  directory_tells: Record<string, { tell: string; why: string }>;
  callback: { number: string; say: string; evidence: string };
  tells: { tell: string; why: string }[];
  outcomes: Record<"code" | "hangup", { choiceId: "phone-code" | "phone-hangup"; score: number }>;
};

export type CallResult = {
  choiceId: "phone-code" | "phone-hangup";
  score: number;
  /** Things the player did or noticed: asked_name, asked_ext, sms_warning, spoofed_ext, pressure, called_back... */
  evidence: string[];
  tellsTotal: number;
  verified: boolean;
  turns: number;
  ms: number;
};

export type Line = { who: "caller" | "you" | "desk" | "system"; text: string };

export class Call {
  node: string;
  lines: Line[] = [];
  evidence = new Set<string>();
  turns = 0;
  ended: "code" | "hangup" | null = null;
  started = Date.now();
  sawPressure = false;

  constructor(readonly c: CallContent) {
    this.node = c.start;
    this.lines.push({ who: "caller", text: c.nodes[c.start].say });
  }

  options(): { id: string; label: string }[] {
    if (this.ended) return [];
    return this.c.nodes[this.node].options.map((id) => ({ id, label: this.c.choices[id].label }));
  }

  pick(id: string) {
    const ch = this.c.choices[id];
    if (!ch || this.ended) return;
    this.turns++;
    this.lines.push({ who: "you", text: ch.label });
    if (ch.evidence) this.evidence.add(ch.evidence);
    if (ch.end) {
      this.end(ch.end);
      return;
    }
    if (ch.next) {
      this.node = ch.next;
      if (ch.next === "callback" || ch.next === "push") this.sawPressure = true;
      this.lines.push({ who: "caller", text: this.c.nodes[ch.next].say });
    }
  }

  idle() {
    if (this.ended) return;
    this.sawPressure = true;
    this.lines.push({ who: "caller", text: this.c.idle_line });
  }

  readSms() {
    this.evidence.add(this.c.sms.tell);
  }

  lookedUp(name: string): { tell: string; why: string } | null {
    const t = this.c.directory_tells[name];
    if (t) this.evidence.add(t.tell);
    return t ?? null;
  }

  hangUp() {
    if (this.ended) return;
    this.lines.push({ who: "system", text: "You hang up." });
    this.end("hangup");
  }

  callBack() {
    this.evidence.add(this.c.callback.evidence);
    this.lines.push({ who: "system", text: `You dial ${this.c.callback.number}.` });
    this.lines.push({ who: "desk", text: this.c.callback.say });
  }

  private end(kind: "code" | "hangup") {
    this.ended = kind;
    if (kind === "hangup" && this.sawPressure) this.evidence.add("pressure");
    if (kind === "code") this.lines.push({ who: "system", text: "The line goes dead. Your phone buzzes: new sign-in approved." });
  }

  result(now = Date.now()): CallResult {
    const kind = this.ended ?? "hangup";
    const o = this.c.outcomes[kind];
    const known = new Set(this.c.tells.map((t) => t.tell));
    return {
      choiceId: o.choiceId,
      score: o.score,
      evidence: [...this.evidence],
      tellsTotal: known.size,
      verified: this.evidence.has(this.c.callback.evidence),
      turns: this.turns,
      ms: now - this.started,
    };
  }
}
