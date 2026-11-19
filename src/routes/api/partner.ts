import { createFileRoute } from "@tanstack/react-router";
import { guard, requireAccess } from "@/server/auth";
import { createOrg, createPartner, partnerOverview } from "@/server/db";
import { bad, json, readJson } from "@/server/http";

// GET ?partner= → client orgs with completion. POST { action: "create" | "createOrg", ... }.
export const Route = createFileRoute("/api/partner")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        guard(async () => {
          const ctx = await requireAccess(request);
          if (ctx instanceof Response) return ctx;
          const partnerId = new URL(request.url).searchParams.get("partner");
          if (!partnerId) return bad("partner required");
          return json({ orgs: await partnerOverview(ctx.db, ctx.access, partnerId) });
        }),
      POST: async ({ request }) =>
        guard(async () => {
          const ctx = await requireAccess(request);
          if (ctx instanceof Response) return ctx;
          const body = await readJson<{ action?: string; name?: string; partnerId?: string; domain?: string }>(request);
          const name = body?.name?.trim().slice(0, 120);
          if (!name) return bad("Name required");
          if (body?.action === "create") return json(await createPartner(ctx.db, ctx.access, name));
          if (body?.action === "createOrg" && body.partnerId)
            return json(await createOrg(ctx.db, ctx.access, { name, partnerId: body.partnerId, domain: body.domain?.trim() || null }));
          return bad("Unknown action");
        }),
    },
  },
});
