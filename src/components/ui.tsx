import { cva, type VariantProps } from "class-variance-authority";
import * as Progress from "@radix-ui/react-progress";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-md px-4 font-medium transition-opacity duration-150 ease-smooth disabled:pointer-events-none disabled:opacity-40 min-h-11",
  {
    variants: {
      variant: {
        primary: "bg-paper text-ink hover:opacity-90",
        secondary: "border border-line bg-transparent text-fg hover:bg-sunken",
        ghost: "bg-transparent text-muted hover:bg-sunken hover:text-fg",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export function buttonClass(options?: VariantProps<typeof buttonStyles>) {
  return buttonStyles(options);
}

export function Button({
  variant,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>) {
  return <button type={type} className={cn(buttonStyles({ variant }), className)} {...props} />;
}

export function Meter({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <Progress.Root
      value={clamped}
      aria-label={label}
      className="relative h-1 overflow-hidden rounded-full bg-sunken"
    >
      <Progress.Indicator
        className="h-full w-full bg-paper motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-smooth"
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </Progress.Root>
  );
}

export function Missing({ what }: { what: string }) {
  return (
    <div className="mx-auto max-w-prose">
      <p className="text-sm text-faint">Meridian</p>
      <h1 className="mt-2 font-display text-4xl text-balance">Not on this floor</h1>
      <p className="mt-3 text-pretty text-muted">That {what} is not in this edition.</p>
    </div>
  );
}
