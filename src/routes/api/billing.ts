import { createFileRoute } from "@tanstack/react-router";
import { guard, requireAccess } from "@/server/auth";
import { assertOrgAdmin, Forbidden } from "@/server/db";
import { bad, json } from "@/server/http";
import { billingSummary, openPortal, startCheckout } from "@/server/stripe";

// Billing for a workspace (?org=) or an MSP (?partner=).
// GET: the plan on file. POST { action: "checkout" | "portal", orgId?, partnerId?, seats? }: a Stripe URL to send the admin to.
export const Route = createFileRoute("/api/billing")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        guard(async () => {
          const ctx = await requireAccess(request);
          if (ctx instanceof Response) return ctx;
          const q = new URL(request.url).searchParams;
          const orgId = q.get("org");
          const partnerId = q.get("partner");
          if (partnerId) {
            if (!ctx.access.memberships.some((m) => m.role === "partner_admin" && m.partner_id === partnerId)) throw new Forbidden("Not your partner workspace");
          } else if (orgId) await assertOrgAdmin(ctx.db, ctx.access, orgId);
          else return bad("org or partner required");
          return json({ billing: await billingSummary(ctx.db, { orgId, partnerId }), enabled: !!ctx.env.STRIPE_SECRET_KEY });
        }),
      POST: async ({ request }) =>
        guard(async () => {
          const ctx = await requireAccess(request);
          if (ctx instanceof Response) return ctx;
          const body = (await request.json().catch(() => ({}))) as { action?: string; orgId?: string; partnerId?: string; seats?: number };
          const origin = new URL(request.url).origin;
          if (body.action === "checkout") return json(await startCheckout(ctx.db, ctx.env, ctx.access, origin, body));
          if (body.action === "portal") return json(await openPortal(ctx.db, ctx.env, ctx.access, origin, body));
          return bad("Unknown action");
        }),
    },
  },
});
