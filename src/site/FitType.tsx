import type React from "react";

/** A headline set as one solid block: every line is sized from its measured width (Archivo 800, width 125,
 *  uppercase) so all lines end on the same edge at any width, with CSS container units and no script.
 *  Measure new lines with scripts/fit-measure.mjs. `bigFirst` tightens spacing when the first line is the big one. */
export function FitType({
  as: Tag,
  id,
  label,
  lines,
  bigFirst = false,
  animate = true,
  className = "",
}: {
  as: "h1" | "h2";
  id: string;
  label: string;
  lines: readonly (readonly [string, number])[];
  bigFirst?: boolean;
  animate?: boolean;
  className?: string;
}) {
  return (
    <Tag id={id} aria-label={label} className={`fit-head ${bigFirst ? "fit-close" : ""} ${animate ? "" : "fit-still"} ${className}`}>
      {lines.map(([t, w], i) => (
        <span key={t} aria-hidden="true" style={{ "--w": w, "--i": i } as React.CSSProperties}>
          {t}
        </span>
      ))}
    </Tag>
  );
}
