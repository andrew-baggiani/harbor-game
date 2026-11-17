// Sends the learner's scored choices to the org's decision log. Only runs for signed-in learners;
// anonymous play never leaves the browser. The server scores the choice from scenario content.
let learner: Promise<boolean> | null = null;
let runId = newRun();

function newRun() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Call once when the game mounts. Caches whether a learner session exists. */
export function checkLearner(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  learner ??= fetch("/api/me", { credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : null))
    .then((me: { learnerOrg?: string | null } | null) => !!me?.learnerOrg)
    .catch(() => false);
  return learner;
}

function send(body: Record<string, unknown>) {
  if (!learner) return;
  void learner.then((ok) => {
    if (!ok) return;
    fetch("/api/events", {
      method: "POST",
      keepalive: true,
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId, ...body }),
    }).catch(() => {});
  });
}

export function logDecision(choiceId: string) {
  send({ choiceId });
}

export function logShiftComplete() {
  send({ complete: true });
}

/** A replay is a new run: its score stands on its own and the best run counts. */
export function newShiftRun() {
  runId = newRun();
}
