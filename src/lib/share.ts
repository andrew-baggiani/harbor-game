import { previewPathPrefix } from "@/lib/preview-path-prefix";

export function absoluteUrl(path: string): string {
  const current = new URL(window.location.href);
  const prefix = previewPathPrefix(current.hostname, current.pathname) ?? "";
  const qIndex = path.indexOf("?");
  const pathname = qIndex === -1 ? path : path.slice(0, qIndex);
  const search = qIndex === -1 ? "" : path.slice(qIndex);
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  current.pathname = `${prefix}${normalized}`;
  current.search = search;
  current.hash = "";
  return current.toString();
}

function copyWithTextarea(value: string): boolean {
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.focus();
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
}

export async function shareContent(input: {
  title: string;
  text: string;
  url: string;
}): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  const payload = { title: input.title, text: `${input.text}\n${input.url}`.trim(), url: input.url };
  if (typeof navigator.share === "function") {
    try {
      const allowed = typeof navigator.canShare !== "function" || navigator.canShare(payload);
      if (allowed) {
        await navigator.share(payload);
        return "shared";
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    }
  }
  const line = `${input.text}\n${input.url}`.trim();
  try {
    await navigator.clipboard.writeText(line);
    return "copied";
  } catch {
    if (copyWithTextarea(line)) return "copied";
    return "failed";
  }
}
