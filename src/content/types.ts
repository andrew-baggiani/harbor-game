export type Section = {
  heading: string;
  paragraphs: string[];
};

export type Question = {
  id: string;
  prompt: string;
  choices: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  why: string;
};

export type Lesson = {
  id: string;
  moduleId: string;
  title: string;
  minutes: number;
  fieldRule: string;
  sections: Section[];
  questions: Question[];
};

export type Module = {
  id: string;
  num: string;
  title: string;
  summary: string;
};

export type Verdict = "trust" | "verify" | "report";

export type Mail = {
  id: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  time: string;
  body: string[];
  attachment?: string;
  link?: { text: string; href: string };
  verdict: Verdict;
  /** Other calls that earn partial credit. */
  partial: Verdict[];
  why: string;
};

export type LinkVerdict = "safe" | "lookalike" | "mismatch";

export type LinkItem = {
  id: string;
  context: string;
  display: string;
  href: string;
  verdict: LinkVerdict;
  why: string;
};

export type BeatChoice = {
  id: string;
  label: string;
  /** 0 to 10 */
  score: number;
  why: string;
};

export type Beat = {
  id: string;
  kicker: string;
  prompt: string;
  detail?: string;
  choices: BeatChoice[];
};

export type SecretItem = {
  id: string;
  secret: string;
  ok: boolean;
  why: string;
};

export type DrillKind = "inbox" | "links" | "beats" | "passphrase";

export type DrillMeta = {
  id: string;
  kind: DrillKind;
  title: string;
  minutes: number;
  summary: string;
  brief: string;
  scoring: string;
};

export type DrillRow = {
  id: string;
  label: string;
  picked: string;
  right: string;
  tone: "exact" | "partial" | "miss";
  why: string;
  earned: number;
  max: number;
};

export type DrillResult = {
  earned: number;
  max: number;
  pct: number;
  rows: DrillRow[];
};
