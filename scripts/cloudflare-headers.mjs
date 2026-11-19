// After a Cloudflare build: the game's own files in public/assets/{models,ui} are not
// content-hashed, so they must not inherit the year-long immutable cache Nitro gives
// /assets/* (that is what kept a stale 404 alive on the old host). One hour instead.
import { appendFileSync, existsSync } from "node:fs";

const file = ".output/public/_headers";
if (!existsSync(file)) {
  console.error(`[cloudflare-headers] ${file} not found; run the Cloudflare build first.`);
  process.exit(1);
}
const rule = (path) => `\n${path}\n  ! cache-control\n  cache-control: public, max-age=3600\n`;
appendFileSync(file, ["/assets/models/*", "/assets/ui/*"].map(rule).join(""));
console.log("[cloudflare-headers] game assets: 1 hour cache");
