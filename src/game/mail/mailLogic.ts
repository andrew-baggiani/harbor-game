// Pure state + scoring for the inbox version of the Monday mail beat.
// No React, no three.js: easy to unit-test and to reuse in drills.

export type BodyPart =
  | { text: string; tell?: string; why?: string }
  | { link: string; shown: string; href: string; tell?: string; why?: string };

export type HeaderTell = { field: "from" | "reply_to" | "external"; tell: string; why: string };

export type Message = {
  id: string;
  variant: number;
  kind: "phish" | "legit";
  unread: boolean;
  time: string;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  external: boolean;
  subject: string;
  preview: string;
  body: BodyPart[];
  header_tells: HeaderTell[];
  verify?: { who: string; result: string };
  reply_draft?: string;
  fail_on_send?: string;
  fake_login?: { title: string; domain: string; fail: string };
};

export type DirectoryEntry = { name: string; title: string; email: string; ext: string; note: string };

export type InboxContent = {
  id: string;
  version: string;
  clock: string;
  mailbox: string;
  internal_domain: string;
  report_label: string;
  directory: DirectoryEntry[];
  messages: Message[];
  scoring: {
    report_phish: number;
    ignore_phish: number;
    fall_for_phish: number;
    investigation_bonus_max: number;
    verified_bonus: number;
  };
};

/** What the beat hands back to the game when it ends. */
export type MailResult = {
  /** v1 choice id, so story.ts, records.ts and the debrief audio keep working. */
  choiceId: "mail-report" | "mail-codes" | "mail-ignore";
  variant: number;
  phishId: string;
  /** Tells the player actually found (header hovers, link hovers, marked lines). */
  evidence: string[];
  tellsTotal: number;
  verified: boolean;
  openedLink: boolean;
  enteredCreds: boolean;
  repliedToPhish: boolean;
  /** Legit mails the player reported. Not penalised: reporting when unsure is the habit we want. */
  reportedLegit: string[];
  /** v1-scale decision score (0 / 40 / 100). */
  score: number;
  /** Optional extra, 0..investigation_bonus_max + verified_bonus. */
  bonus: number;
  ms: number;
};

export function inboxFor(content: InboxContent, variant: number): Message[] {
  return content.messages
    .filter((m) => m.variant === -1 || m.variant === variant)
    .sort((a, b) => toMinutes(b.time) - toMinutes(a.time));
}

export function phishVariants(content: InboxContent): number[] {
  return [...new Set(content.messages.filter((m) => m.kind === "phish").map((m) => m.variant))].sort();
}

export function allTells(msg: Message): { tell: string; why: string }[] {
  const out: { tell: string; why: string }[] = [];
  for (const h of msg.header_tells) out.push({ tell: h.tell, why: h.why });
  for (const p of msg.body) if (p.tell && p.why) out.push({ tell: p.tell, why: p.why });
  return out;
}

export function isInternal(content: InboxContent, email: string): boolean {
  return email.toLowerCase().endsWith(`@${content.internal_domain}`);
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function toMinutes(t: string): number {
  const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(t);
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + Number(m[2]);
}

export type Tracker = {
  found: Set<string>;
  verified: boolean;
  openedLink: boolean;
  enteredCreds: boolean;
  repliedToPhish: boolean;
  reportedPhish: boolean;
  reportedLegit: Set<string>;
  started: number;
};

export function newTracker(now = Date.now()): Tracker {
  return {
    found: new Set(),
    verified: false,
    openedLink: false,
    enteredCreds: false,
    repliedToPhish: false,
    reportedPhish: false,
    reportedLegit: new Set(),
    started: now,
  };
}

export function finish(content: InboxContent, variant: number, t: Tracker, now = Date.now()): MailResult {
  const phish = content.messages.find((m) => m.kind === "phish" && m.variant === variant);
  if (!phish) throw new Error(`No phish for variant ${variant}`);
  const tells = allTells(phish);
  const fell = t.enteredCreds || t.repliedToPhish;
  const choiceId: MailResult["choiceId"] = fell ? "mail-codes" : t.reportedPhish ? "mail-report" : "mail-ignore";
  const s = content.scoring;
  const score = fell ? s.fall_for_phish : t.reportedPhish ? s.report_phish : s.ignore_phish;
  const evidence = tells.map((x) => x.tell).filter((x) => t.found.has(x));
  const bonus = fell
    ? 0
    : Math.round((evidence.length / Math.max(1, tells.length)) * s.investigation_bonus_max) +
      (t.verified ? s.verified_bonus : 0);
  return {
    choiceId,
    variant,
    phishId: phish.id,
    evidence,
    tellsTotal: tells.length,
    verified: t.verified,
    openedLink: t.openedLink,
    enteredCreds: t.enteredCreds,
    repliedToPhish: t.repliedToPhish,
    reportedLegit: [...t.reportedLegit],
    score,
    bonus,
    ms: now - t.started,
  };
}
