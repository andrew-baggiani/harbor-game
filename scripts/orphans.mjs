// Finds text blocks whose last line is a single word ("orphans") on the public pages.
// Run with the dev server up: node scripts/orphans.mjs http://127.0.0.1:5179
import { chromium } from "playwright";
const base = process.argv[2] ?? "http://127.0.0.1:5179";
const PAGES = ["/", "/pricing", "/partners", "/week", "/ai-security", "/coverage", "/sample-record", "/privacy", "/login"];
const SIZES = [[390, 844], [820, 1180], [1440, 900]];
const b = await chromium.launch({ executablePath: process.env.CHROME ?? "/usr/bin/google-chrome" });
let total = 0;
for (const [w, h] of SIZES) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
  const p = await ctx.newPage();
  for (const path of PAGES) {
    await p.goto(base + path, { waitUntil: "load" });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(3500);
    const hits = await p.evaluate(() => {
      const out = [];
      const els = document.querySelectorAll("main :is(p,li,dd,dt,h1,h2,h3,h4,figcaption,blockquote,label,td), footer p");
      for (const el of els) {
        if (el.closest(".fit-head,[aria-hidden=true],canvas,svg")) continue;
        if (el.querySelector("p,li,div,ul,ol")) continue; // leaf text blocks only
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const words = [];
        const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = walk.nextNode(); n; n = walk.nextNode()) {
          const re = /\S+/g; let m;
          while ((m = re.exec(n.data))) {
            const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
            const rr = rg.getClientRects()[0];
            const host = n.parentElement;
            const inFlow = host === el || getComputedStyle(host).display === "inline";
            if (rr) words.push([Math.round(rr.top), m[0], inFlow]);
          }
        }
        if (words.length < 3) continue;
        const lines = [...new Set(words.map((x) => x[0]))];
        if (lines.length < 2) continue;
        const last = words.filter((x) => Math.abs(x[0] - lines[lines.length - 1]) < 4);
        if (last.length === 1 && last[0][2]) out.push(el.innerText.replace(/\s+/g, " ").slice(0, 90) + "  …[" + last[0][1] + "]");
      }
      return out;
    });
    for (const t of hits) { total++; console.log(`${w}px ${path}  ${t}`); }
  }
  await ctx.close();
}
console.log("orphans:", total);
await b.close();
