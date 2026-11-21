import { createFileRoute } from "@tanstack/react-router";
import { guard, requireAccess } from "@/server/auth";
import { evidencePack } from "@/server/evidence";
import { bad, json } from "@/server/http";

// GET ?org= → the client's evidence pack as JSON (client admins and their MSP only).
export const Route = createFileRoute("/api/evidence")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        guard(async () => {
          const ctx = await requireAccess(request);
          if (ctx instanceof Response) return ctx;
          const orgId = new URL(request.url).searchParams.get("org");
          if (!orgId) return bad("org required");
          return json(await evidencePack(ctx.db, ctx.access, orgId));
        }),
    },
  },
});
