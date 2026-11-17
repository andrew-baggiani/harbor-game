import { createFileRoute } from "@tanstack/react-router";
import { guard, requireAccess } from "@/server/auth";
import { activity } from "@/server/db";
import { bad, json } from "@/server/http";

// GET ?partner= or ?org= → the latest decisions and finished shifts (admins only).
export const Route = createFileRoute("/api/activity")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        guard(async () => {
          const ctx = await requireAccess(request);
          if (ctx instanceof Response) return ctx;
          const q = new URL(request.url).searchParams;
          const partnerId = q.get("partner");
          const orgId = q.get("org");
          if (!partnerId && !orgId) return bad("partner or org required");
          return json({ items: await activity(ctx.db, ctx.access, { partnerId, orgId }) });
        }),
    },
  },
});
