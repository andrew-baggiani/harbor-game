import { createFileRoute } from "@tanstack/react-router";
import { guard, requireAccess } from "@/server/auth";
import { bad, json, readJson } from "@/server/http";
import { getWorld, worldReport } from "@/server/world";
import { WEEK_DAYS } from "@/content/week/world";

// GET: the signed-in learner's week so far. POST { day, via }: they called IT about it.
export const Route = createFileRoute("/api/world")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        guard(async () => {
          const ctx = await requireAccess(request);
          if (ctx instanceof Response) return ctx;
          return json({ world: await getWorld(ctx.db, ctx.access.user.id) });
        }),
      POST: async ({ request }) =>
        guard(async () => {
          const ctx = await requireAccess(request);
          if (ctx instanceof Response) return ctx;
          const body = await readJson<{ day?: string; via?: string }>(request);
          const day = String(body?.day ?? "");
          if (!(WEEK_DAYS as readonly string[]).includes(day)) return bad("Which day?");
          const via = body?.via === "card" ? "card" : "hotline";
          return json({ world: await worldReport(ctx.db, ctx.access.user.id, day, via) });
        }),
    },
  },
});
