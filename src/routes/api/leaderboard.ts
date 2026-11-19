import { createFileRoute } from "@tanstack/react-router";
import { guard, requireAccess } from "@/server/auth";
import { homeOrg, leaderboard } from "@/server/db";
import { bad, json } from "@/server/http";

// GET ?org= (defaults to the caller's own org). Polled every 15s by the portal and the game report.
export const Route = createFileRoute("/api/leaderboard")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        guard(async () => {
          const ctx = await requireAccess(request);
          if (ctx instanceof Response) return ctx;
          const orgId = new URL(request.url).searchParams.get("org") || homeOrg(ctx.access);
          if (!orgId) return bad("No org", 404);
          return json(await leaderboard(ctx.db, ctx.access, orgId));
        }),
    },
  },
});
