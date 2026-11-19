import { createFileRoute } from "@tanstack/react-router";
import { clearCookie, context } from "@/server/auth";
import { deleteSession } from "@/server/db";
import { json } from "@/server/http";

export const Route = createFileRoute("/api/auth/signout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ctx = await context(request);
        if (!(ctx instanceof Response) && ctx.token) await deleteSession(ctx.db, ctx.token);
        return json({ ok: true }, 200, { "set-cookie": clearCookie(request) });
      },
    },
  },
});
