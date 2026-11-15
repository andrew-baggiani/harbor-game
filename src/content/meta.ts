export type Rank = {
  id: string;
  name: string;
  min: number;
  line: string;
};

export const RANKS: Rank[] = [
  {
    id: "observer",
    name: "Observer",
    min: 0,
    line: "You can see the pattern once someone points at it.",
  },
  {
    id: "recruit",
    name: "Recruit",
    min: 250,
    line: "You pause when the request is hard to undo.",
  },
  {
    id: "analyst",
    name: "Analyst",
    min: 700,
    line: "You separate the channel from the identity.",
  },
  {
    id: "operator",
    name: "Operator",
    min: 1400,
    line: "Money, access, and secrets go out of band.",
  },
  {
    id: "sentinel",
    name: "Sentinel",
    min: 2200,
    line: "Other people ask you before they click.",
  },
  {
    id: "warden",
    name: "Warden",
    min: 3200,
    line: "You keep the organization boring. That is the job.",
  },
];

export type BadgeDef = {
  id: string;
  name: string;
  detail: string;
};

export const BADGES: BadgeDef[] = [
  { id: "first-light", name: "First light", detail: "Finish any lesson check." },
  { id: "clean-check", name: "Clean check", detail: "Score 100 on any lesson." },
  { id: "three-days", name: "Three days", detail: "Hold a 3-day streak." },
  { id: "week-watch", name: "Week watch", detail: "Hold a 7-day streak." },
  { id: "inbox-clear", name: "Inbox clear", detail: "Score 90 or better on Inbox triage." },
  { id: "host-reader", name: "Host reader", detail: "Score 90 or better on Link lab." },
  { id: "hung-up", name: "Hung up", detail: "Score 80 or better on The call." },
  { id: "vault-mind", name: "Vault mind", detail: "Score 100 on Passphrase forge." },
  { id: "data-desk", name: "Data desk", detail: "Score 80 or better on Data desk." },
  { id: "clocked", name: "Clocked", detail: "Score 80 or better on Incident clock." },
  { id: "unmoved", name: "Unmoved", detail: "Score 80 or better on The wire." },
  { id: "perfect-module", name: "Clean module", detail: "Score 100 on every lesson in one module." },
  { id: "full-path", name: "Full path", detail: "Finish every lesson check." },
  { id: "all-drills", name: "All drills", detail: "File a run of every drill." },
  { id: "held-floor", name: "Held the floor", detail: "Finish three watches before pressure breaks." },
  { id: "warden", name: "Warden", detail: "Reach the Warden rank." },
];

export function rankFor(xp: number): { current: Rank; next: Rank | null } {
  let current = RANKS[0]!;
  for (const rank of RANKS) {
    if (xp >= rank.min) current = rank;
  }
  const index = RANKS.findIndex((rank) => rank.id === current.id);
  return { current, next: RANKS[index + 1] ?? null };
}
