import { useState } from "react";
import { Share2 } from "lucide-react";
import { absoluteUrl, shareContent } from "@/lib/share";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export function ShareButton({
  title,
  text,
  path,
  label = "Share",
  variant = "secondary",
  className,
}: {
  title: string;
  text: string;
  path?: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  async function onShare() {
    const url = path ? absoluteUrl(path) : window.location.href;
    const result = await shareContent({ title, text, url });
    if (result === "copied") {
      setLink(url);
      setStatus("Link copied");
    } else if (result === "failed") {
      setLink(url);
      setStatus("Select the link and copy it");
    } else if (result === "shared") {
      setLink(url);
      setStatus(null);
    }
  }

  return (
    <span className={cn("flex w-full min-w-0 flex-col items-start gap-2", className)}>
      <span className="inline-flex flex-wrap items-center gap-3">
        <Button variant={variant} onClick={() => void onShare()}>
          <Share2 className="size-4" aria-hidden="true" />
          {label}
        </Button>
        {status ? (
          <span className="text-sm text-muted" role="status">
            {status}
          </span>
        ) : null}
      </span>
      {link ? (
        <label className="w-full max-w-xl text-sm text-faint">
          Link
          <input
            readOnly
            value={link}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-line bg-sunken px-3 font-mono text-xs text-fg"
          />
        </label>
      ) : null}
    </span>
  );
}
