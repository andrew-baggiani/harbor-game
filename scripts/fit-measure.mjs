// Measures headline lines for <FitType>: prints each line's width at font-size 1 in the hero type
// (Archivo 800, width 125, uppercase, -0.02em). Run with the dev server up:
//   node scripts/fit-measure.mjs http://127.0.0.1:5179 "Run it" "before it" "runs you."
import { chromium } from "playwright";
const [base, ...lines] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.CHROME ?? "/usr/bin/google-chrome" });
const p = await b.newPage();
await p.goto(`${base}/pricing`, { waitUntil: "load" });
const out = await p.evaluate(async (ls) => {
  await document.fonts.ready;
  return ls.map((t) => {
    const s = document.createElement("span");
    s.className = "display";
    s.style.cssText = "position:absolute;white-space:nowrap;font-size:100px;letter-spacing:-0.02em;text-transform:uppercase;font-stretch:125%;font-weight:800";
    s.textContent = t;
    document.querySelector(".site").appendChild(s);
    const w = +(s.getBoundingClientRect().width / 100).toFixed(4);
    s.remove();
    return [t, w];
  });
}, lines);
for (const [t, w] of out) console.log(`  [${JSON.stringify(t)}, ${w}],  // ${(100 / w).toFixed(1)}cqw`);
await b.close();
