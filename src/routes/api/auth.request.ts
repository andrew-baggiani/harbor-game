import { createFileRoute } from "@tanstack/react-router";
import { context } from "@/server/auth";
import { createMagicLink, findOrCreateUser, normEmail } from "@/server/db";
import { sendMagicLink } from "@/server/email";
import { bad, isLocal, json, readJson, safeNext } from "@/server/http";

// POST { email, next? } → emails a one-time sign-in link (15 minutes). Anyone can request a link;
// what they can see after signing in depends on their memberships.
export const Route = createFileRoute("/api/auth/request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ctx = await context(request);
        if (ctx instanceof Response) return ctx;
        const body = await readJson<{ email?: string; next?: string }>(request);
        const email = normEmail(body?.email ?? "");
        if (!email) return bad("Enter a valid work email.");
        const user = await findOrCreateUser(ctx.db, email);
        const recent = await ctx.db
          .prepare("SELECT COUNT(*) AS n FROM magic_links WHERE user_id = ? AND expires_at > ?")
          .bind(user.id, Date.now())
          .first<{ n: number }>();
        if ((recent?.n ?? 0) >= 5) return bad("Too many sign-in links. Use the latest email or wait 15 minutes.", 429);
        const token = await createMagicLink(ctx.db, user.id, safeNext(body?.next));
        const link = `${new URL(request.url).origin}/api/auth/verify?token=${encodeURIComponent(token)}`;
        const sent = await sendMagicLink(ctx.env, email, link, "signin");
        return json({ ok: true, provider: sent.provider, ...(sent.provider === "log" && isLocal(request) ? { devLink: link } : {}) });
      },
    },
  },
});
