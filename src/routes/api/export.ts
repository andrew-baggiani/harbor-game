import { createFileRoute } from "@tanstack/react-router";
import { guard, requireAccess } from "@/server/auth";
import { exportEvents } from "@/server/db";
import { bad } from "@/server/http";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// GET ?org= → CSV of every recorded decision for the org (admins only).
export const Route = createFileRoute("/api/export")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        guard(async () => {
          const ctx = await requireAccess(request);
          if (ctx instanceof Response) return ctx;
          const orgId = new URL(request.url).searchParams.get("org");
          if (!orgId) return bad("org required");
          const rows = await exportEvents(ctx.db, ctx.access, orgId);
          const head = ["timestamp", "email", "shift", "kind", "scenario", "choice", "good", "points", "controls", "run"];
          const lines = rows.map((r) =>
            [new Date(r.ts).toISOString(), r.email, r.shift, r.kind, r.scenario_id, r.choice_id, r.good === null ? "" : r.good ? "yes" : "no", r.points, r.controls, r.run_id]
              .map(cell)
              .join(","),
          );
          return new Response([head.join(","), ...lines].join("\n") + "\n", {
            headers: {
              "content-type": "text/csv; charset=utf-8",
              "content-disposition": `attachment; filename="dryrun-decisions-${orgId}.csv"`,
              "cache-control": "no-store",
            },
          });
        }),
    },
  },
});
