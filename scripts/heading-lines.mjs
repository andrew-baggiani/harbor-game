// Lists headings that leave a single word alone on any line, at phone, tablet and desktop widths.
// Run with the dev server up on :5179: node scripts/heading-lines.mjs
import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/usr/bin/google-chrome" });
const res = [];
for (const W of [390, 820, 1440]) {
const ctx = await b.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: W === 390 ? 2 : 1, isMobile: W === 390, hasTouch: W === 390 });
const p = await ctx.newPage();
for (const path of ["/", "/pricing", "/partners", "/week", "/ai-security", "/coverage"]) {
  await p.goto("http://127.0.0.1:5179" + path, { waitUntil: "load" });
  await p.waitForTimeout(3000);
  if (path === "/") await p.screenshot({ path: `/tmp/t-top-${W}.png` });
  res.push(...(await p.evaluate((path) => [...document.querySelectorAll("main :is(h1,h2,h3)")].filter((h) => !h.closest(".fit-head") && !h.classList.contains("fit-head")).map((h) => {
    const words = []; const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { const re = /[^\s ]+/g; let m; while ((m = re.exec(n.data))) { const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); const rr = r.getClientRects()[0]; if (rr) words.push([Math.round(rr.top), m[0]]); } }
    const lines = {}; for (const [t, x] of words) (lines[t] ??= []).push(x);
    const L = Object.values(lines).map((a) => a.join(" "));
    return L.length > 1 && L.some((l) => !l.includes(" ")) ? `${path}  ${L.join(" / ")}` : null;
  }).filter(Boolean), path).then((x) => x.map((t) => `${W}px ${t}`))));
}
await ctx.close();
}
console.log(res.join("\n") || "no single-word heading lines");
await b.close();
