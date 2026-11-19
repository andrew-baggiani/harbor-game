import { createFileRoute } from "@tanstack/react-router";
import { context, sessionCookie } from "@/server/auth";
import { consumeMagicLink, createSession } from "@/server/db";
import { safeNext } from "@/server/http";

// GET ?token= → sets the session cookie and redirects to where the link was headed.
export const Route = createFileRoute("/api/auth/verify")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ctx = await context(request);
        if (ctx instanceof Response) return ctx;
        const token = new URL(request.url).searchParams.get("token") ?? "";
        const found = token ? await consumeMagicLink(ctx.db, token) : null;
        if (!found) return new Response(null, { status: 302, headers: { location: "/login?error=expired" } });
        const session = await createSession(ctx.db, found.userId);
        return new Response(null, {
          status: 302,
          headers: { location: safeNext(found.next), "set-cookie": sessionCookie(request, session.token, session.maxAge), "cache-control": "no-store" },
        });
      },
    },
  },
});
