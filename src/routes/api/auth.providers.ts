import { createFileRoute } from "@tanstack/react-router";
import { getEnv } from "@/server/env";
import { enabledProviders } from "@/server/oauth";

// Which sign-in buttons to show: only providers with credentials set.
export const Route = createFileRoute("/api/auth/providers")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify(enabledProviders(await getEnv())), { headers: { "content-type": "application/json", "cache-control": "no-store" } }),
    },
  },
});
