import { createFileRoute } from "@tanstack/react-router";
import { getEnv } from "@/server/env";
import { safeNext } from "@/server/http";
import { PROVIDERS, startSignIn, type Provider } from "@/server/oauth";

// GET ?provider=microsoft|google&next=/portal → off to the provider's sign-in page.
export const Route = createFileRoute("/api/auth/oauth/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const q = new URL(request.url).searchParams;
        const p = q.get("provider") as Provider;
        if (!PROVIDERS.includes(p)) return new Response(null, { status: 302, headers: { location: "/login?error=sso" } });
        const out = await startSignIn(await getEnv(), request, p, safeNext(q.get("next") ?? "/portal"));
        if (!out) return new Response(null, { status: 302, headers: { location: "/login?error=sso_off" } });
        return new Response(null, { status: 302, headers: { location: out.location, "set-cookie": out.setCookie, "cache-control": "no-store" } });
      },
    },
  },
});
