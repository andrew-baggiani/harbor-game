import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toPct(earned: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((earned / max) * 100);
}

export function cleanCallsign(raw: string): string | null {
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 18) return null;
  if (!/^[\p{L}\p{N}][\p{L}\p{N} '\-]*$/u.test(name)) return null;
  return name;
}
