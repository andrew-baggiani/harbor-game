import { useEffect } from "react";

const BLOCKS = "main :is(p, li, dd, dt, figcaption, blockquote, td)"; // headings balance their own lines

/** Typesetting helpers for the public site: no lone last words, headings that shrink rather than strand a
 *  word, and section headings that rise in on scroll.
 *
 * Glues the last two words of every text block with a no-break space, so no line ends with one word alone.
 *  Every browser respects it, unlike text-wrap: pretty. Skips pairs too long to share a phone-width line. */
function glue(el: Element) {
  if (el.closest(".fit-head, [data-no-glue]")) return;
  const nodes: Text[] = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) if (n.nodeValue) nodes.push(n as Text);
  // Skip blocks whose final word sits in a badge or block child rather than the text flow.
  const tail = [...nodes].reverse().find((n) => n.nodeValue?.trim());
  if (!tail) return;
  const host = tail.parentElement;
  if (host && host !== el && !["inline", "contents"].includes(getComputedStyle(host).display)) return;
  // Walk back from the end: past the last word, then replace the first ordinary space before it.
  let seenWord = false;
  let chars = 0;
  for (let k = nodes.length - 1; k >= 0; k--) {
    const v = nodes[k].nodeValue ?? "";
    for (let i = v.length - 1; i >= 0; i--) {
      const c = v[i];
      if (c === " " || c === "\n") {
        if (!seenWord) continue;
        if (chars > 22) return;
        nodes[k].nodeValue = `${v.slice(0, i)}\u00a0${v.slice(i + 1)}`;
        // A hyphen inside the glued pair is still a break point ("lock-" / "in."); make those non-breaking too.
        for (let j = k; j < nodes.length; j++) {
          const from = j === k ? Math.max(0, v.lastIndexOf(" ", i - 1) + 1) : 0;
          const t = nodes[j].nodeValue ?? "";
          nodes[j].nodeValue = t.slice(0, from) + t.slice(from).replace(/(\w)-(\w)/g, "$1\u2011$2");
        }
        return;
      }
      if (c === "\u00a0") return; // already glued
      seenWord = true;
      chars++;
    }
  }
}

const HEADS = "main :is(h1, h2, h3):not(.fit-head)";

/** Word lines of an element, as arrays of words per rendered line. */
function wordLines(el: Element) {
  const rows = new Map<number, number>();
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const re = /[^\s\u00a0]+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(n.nodeValue ?? ""))) {
      const r = document.createRange();
      r.setStart(n, m.index);
      r.setEnd(n, m.index + m[0].length);
      const top = r.getClientRects()[0]?.top;
      if (top === undefined) continue;
      const key = [...rows.keys()].find((k) => Math.abs(k - top) < 4) ?? Math.round(top);
      rows.set(key, (rows.get(key) ?? 0) + 1);
    }
  }
  return [...rows.values()];
}

/** Steps a heading's size down (to 70% at most) until no line holds a single word. */
function fitHeading(el: HTMLElement) {
  el.style.fontSize = "";
  const base = parseFloat(getComputedStyle(el).fontSize);
  const lone = () => {
    const rows = wordLines(el);
    return rows.length > 1 && rows.some((c) => c === 1);
  };
  for (let size = base; size >= base * 0.7 && lone(); size -= 1) el.style.fontSize = `${size - 1}px`;
  if (lone()) el.style.fontSize = ""; // couldn't fix it by size; keep the designed size
}

export function NoWidows() {
  useEffect(() => {
    const fit = () => document.querySelectorAll<HTMLElement>(HEADS).forEach(fitHeading);
    const run = () => {
      document.querySelectorAll(BLOCKS).forEach(glue);
      fit();
    };
    run();
    void document.fonts?.ready.then(fit);
    let r = 0;
    const onResize = () => {
      window.clearTimeout(r);
      r = window.setTimeout(fit, 150);
    };
    window.addEventListener("resize", onResize);
    // Section headings rise in once, as they reach the screen.
    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (es) =>
              es.forEach((e) => {
                if (!e.isIntersecting) return;
                e.target.classList.add("is-in");
                io?.unobserve(e.target);
              }),
            { rootMargin: "0px 0px -12% 0px" },
          )
        : null;
    if (io) {
      document.documentElement.classList.add("reveal-on");
      document.querySelectorAll(".section-head").forEach((h) => io.observe(h));
    }
    // Content that appears later (tabs, demos, routes) gets the same treatment.
    let t = 0;
    const mo = new MutationObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(run, 120);
    });
    mo.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener("resize", onResize);
      io?.disconnect();
      document.documentElement.classList.remove("reveal-on");
      window.clearTimeout(r);
      mo.disconnect();
      window.clearTimeout(t);
    };
  }, []);
  return null;
}
