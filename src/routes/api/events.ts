import { createFileRoute } from "@tanstack/react-router";
import { guard, requireAccess } from "@/server/auth";
import { recordEvent } from "@/server/db";
import { bad, json, readJson } from "@/server/http";
import { worldChoice } from "@/server/world";

// POST { runId, choiceId } or { runId, complete: true }. Good/missed, points and controls are
// looked up from the scenario content on the server.
export const Route = createFileRoute("/api/events")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        guard(async () => {
          const ctx = await requireAccess(request);
          if (ctx instanceof Response) return ctx;
          const body = await readJson<{ runId?: string; choiceId?: string; complete?: boolean; shift?: string; timing?: unknown }>(request);
          if (!body?.runId || (!body.choiceId && !body.complete)) return bad("runId and choiceId (or complete) required");
          const out = await recordEvent(ctx.db, ctx.access, {
            runId: body.runId,
            choiceId: body.choiceId,
            complete: !!body.complete,
            shift: typeof body.shift === "string" ? body.shift : undefined,
            timing: body.timing,
          });
          // Monday choices can plant (or start over) the learner's week. Never blocks the record.
          if (body.choiceId && out.recorded) await worldChoice(ctx.db, ctx.access.user.id, body.choiceId, body.runId).catch(() => {});
          return json({ ok: true, points: out.points, recorded: out.recorded });
        }),
    },
  },
});
