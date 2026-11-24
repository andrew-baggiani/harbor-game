import { createFileRoute } from "@tanstack/react-router";
import { context, sessionCookie } from "@/server/auth";
import { createSession, findOrCreateUser } from "@/server/db";
import { safeNext } from "@/server/http";
import { SignInError, clearPending, finishSignIn } from "@/server/oauth";

// Microsoft and Google send the browser back here. Same session as a magic link once the email is verified.
export const Route = createFileRoute("/api/auth/oauth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ctx = await context(request);
        if (ctx instanceof Response) return ctx;
        const headers = new Headers({ "cache-control": "no-store" });
        headers.append("set-cookie", clearPending(request));
        try {
          const { email, next } = await finishSignIn(ctx.env, request);
          const user = await findOrCreateUser(ctx.db, email);
          const session = await createSession(ctx.db, user.id);
          headers.append("set-cookie", sessionCookie(request, session.token, session.maxAge));
          headers.set("location", safeNext(next));
        } catch (err) {
          const code = err instanceof SignInError ? err.code : "failed";
          if (!(err instanceof SignInError)) console.error("[oauth]", err);
          headers.set("location", `/login?error=sso_${code}`);
        }
        return new Response(null, { status: 302, headers });
      },
    },
  },
});
