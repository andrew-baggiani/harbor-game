// `npm run build` picks the target: Cloudflare Workers Builds sets WORKERS_CI=1,
// so its default build command produces the Worker; everywhere else keeps the old build.
import { execSync } from "node:child_process";

const cloudflare = process.env.WORKERS_CI === "1" || process.env.DEPLOY_TARGET === "cloudflare";
const cmd = cloudflare ? "npm run build:cloudflare" : "npm run build:grok";
console.log(`[build] ${cloudflare ? "Cloudflare Worker" : "Grok/Vercel"} build`);
execSync(cmd, { stdio: "inherit" });
