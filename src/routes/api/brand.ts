import { createFileRoute } from "@tanstack/react-router";
import { guard, requireAccess } from "@/server/auth";
import { brandForPartner, setBrand } from "@/server/brand";
import { bad, json } from "@/server/http";

// An MSP's own name and logo. GET ?partner= (that partner's admins), POST { partnerId, name, logo? }.
export const Route = createFileRoute("/api/brand")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        guard(async () => {
          const ctx = await requireAccess(request);
          if (ctx instanceof Response) return ctx;
          const partnerId = new URL(request.url).searchParams.get("partner");
          if (!partnerId) return bad("partner required");
          if (!ctx.access.memberships.some((m) => m.role === "partner_admin" && m.partner_id === partnerId)) return bad("Not your partner workspace");
          return json({ brand: await brandForPartner(ctx.db, partnerId) });
        }),
      POST: async ({ request }) =>
        guard(async () => {
          const ctx = await requireAccess(request);
          if (ctx instanceof Response) return ctx;
          const body = (await request.json().catch(() => ({}))) as { partnerId?: string; name?: string; logo?: string | null };
          if (!body.partnerId) return bad("partnerId required");
          return json({ brand: await setBrand(ctx.db, ctx.access, body.partnerId, { name: body.name, logo: body.logo }) });
        }),
    },
  },
});
