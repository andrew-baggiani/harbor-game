import { createFileRoute } from "@tanstack/react-router";
import { context, guard } from "@/server/auth";
import { isOwner } from "@/server/billing";
import { normEmail } from "@/server/db";
import { addLead, approvePartner, listLeads, setLeadStatus, startLeadTrial, startSelfTrial, type LeadKind } from "@/server/leads";
import { bad, json, readJson } from "@/server/http";

const KINDS: LeadKind[] = ["waitlist", "demo", "partner", "trial"];

// POST (public): { kind, email, name, company, role, seats, message, website } starts a free trial, joins the
// waitlist, asks for a demo, or applies to the partner program. `website` is a honeypot: people never fill it in.
// GET (owner): every lead. POST { action } (owner): approvePartner, startTrial, status.
export const Route = createFileRoute("/api/leads")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        guard(async () => {
          const ctx = await context(request);
          if (ctx instanceof Response) return ctx;
          if (!isOwner(ctx.env, ctx.access)) return bad("Not allowed.", 403);
          return json({ leads: await listLeads(ctx.db) });
        }),
      POST: async ({ request }) =>
        guard(async () => {
          const ctx = await context(request);
          if (ctx instanceof Response) return ctx;
          const body = await readJson<Record<string, unknown>>(request);
          if (!body) return bad("Send JSON.");
          const origin = new URL(request.url).origin;
          if (typeof body.action === "string") {
            if (!isOwner(ctx.env, ctx.access)) return bad("Not allowed.", 403);
            const id = String(body.leadId ?? "");
            if (body.action === "approvePartner") return json(await approvePartner(ctx.db, ctx.env, origin, id));
            if (body.action === "startTrial") return json(await startLeadTrial(ctx.db, ctx.env, origin, id));
            if (body.action === "status" && typeof body.status === "string") {
              await setLeadStatus(ctx.db, id, body.status);
              return json({ ok: true });
            }
            return bad("Unknown action.");
          }
          if (typeof body.website === "string" && body.website) return json({ ok: true });
          const kind = body.kind as LeadKind;
          if (!KINDS.includes(kind)) return bad("Pick waitlist, demo or partner.");
          const email = normEmail(String(body.email ?? ""));
          if (!email) return bad("Enter a valid work email.");
          const out = await addLead(ctx.db, ctx.env, request, { ...body, kind, email });
          if ("error" in out) return bad(out.error, out.status);
          if (kind === "trial" && out.leadId) {
            const trial = await startSelfTrial(ctx.db, ctx.env, origin, out.leadId, email);
            if ("error" in trial) return bad(String(trial.error), 500);
            return json({ ok: true, emailed: trial.emailed, existing: trial.existing });
          }
          return json({ ok: true });
        }),
    },
  },
});
