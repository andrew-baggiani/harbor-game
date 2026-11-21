import { createFileRoute } from "@tanstack/react-router";
import { context } from "@/server/auth";
import { homeOrg } from "@/server/db";
import { canPlay, isOwner } from "@/server/billing";
import { json } from "@/server/http";
import { brandForOrg } from "@/server/brand";

// Who is signed in, and where they belong. { user: null } for anonymous visitors.
export const Route = createFileRoute("/api/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ctx = await context(request);
        if (ctx instanceof Response || !ctx.access) return json({ user: null });
        const { user, memberships } = ctx.access;
        const learnerOrg = memberships.some((m) => m.role === "learner") ? homeOrg(ctx.access) : null;
        return json({
          user: { id: user.id, email: user.email },
          canPlay: await canPlay(ctx.db, ctx.env, ctx.access),
          owner: isOwner(ctx.env, ctx.access),
          learnerOrg,
          // The MSP's own name and logo, for the learner's screens.
          brand: await brandForOrg(ctx.db, learnerOrg),
          memberships: memberships.map((m) => ({
            role: m.role,
            orgId: m.org_id,
            orgName: m.org_name,
            partnerId: m.partner_id,
            partnerName: m.partner_name,
            displayName: m.display_name,
          })),
        });
      },
    },
  },
});
