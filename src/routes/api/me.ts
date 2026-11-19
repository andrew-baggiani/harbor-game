import { createFileRoute } from "@tanstack/react-router";
import { context } from "@/server/auth";
import { homeOrg } from "@/server/db";
import { json } from "@/server/http";

// Who is signed in, and where they belong. { user: null } for anonymous visitors.
export const Route = createFileRoute("/api/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ctx = await context(request);
        if (ctx instanceof Response || !ctx.access) return json({ user: null });
        const { user, memberships } = ctx.access;
        return json({
          user: { id: user.id, email: user.email },
          learnerOrg: memberships.some((m) => m.role === "learner") ? homeOrg(ctx.access) : null,
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
