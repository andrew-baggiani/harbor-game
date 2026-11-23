import { createFileRoute } from "@tanstack/react-router";
import { getDb, getEnv } from "@/server/env";
import { handleWebhook } from "@/server/stripe";

// Stripe calls this for subscription, invoice and dispute events. The signature is verified before anything is read.
export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const db = await getDb();
        if (!db) return new Response("Database not bound", { status: 503 });
        try {
          return await handleWebhook(db, await getEnv(), request);
        } catch (err) {
          console.error("[stripe webhook]", err);
          // A 500 makes Stripe retry later, which is what we want for a transient failure.
          return new Response("Webhook handler failed", { status: 500 });
        }
      },
    },
  },
});
