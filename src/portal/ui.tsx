// Building blocks for the portal: readiness gauge, avatars, chips, sheet, toasts, switches.
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";

/* ------------------------------------------------------------------ formatting */

export function ago(ms: number | null | undefined): string {
  if (!ms) return "No activity yet";
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const shortDate = (ms: number | null | undefined) =>
  ms ? new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null;

export function daysUntil(ms: number | null | undefined): number | null {
  if (!ms) return null;
  return Math.ceil((ms - Date.now()) / 86_400_000);
}

export function greeting(): string {
  const h = new Date().getHours();
  return h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/** The Monday decisions, in order, with plain names. */
export const SCENARIOS: { id: string; name: string }[] = [
  { id: "MON-01-tailgate", name: "Tailgater at the door" },
  { id: "MON-02-phishing", name: "Phishing email" },
  { id: "MON-03-vishing-mfa", name: "Phone scam and MFA push" },
  { id: "MON-04-usb", name: "USB drop" },
  { id: "MON-05-wire", name: "Wire transfer request" },
  { id: "MON-06-updates", name: "Fake update prompt" },
  { id: "MON-07-signin", name: "Look-alike sign-in page" },
  { id: "MON-08-misdirect", name: "Misdirected email" },
  { id: "MON-09-cleandesk", name: "Clean desk at close" },
];
export const scenarioName = (id: string | null) => SCENARIOS.find((s) => s.id === id)?.name ?? "a decision";

/* ------------------------------------------------------------------ readiness gauge */

/** The signature piece: a glowing ring that sweeps to the value on first paint. */
export function Gauge({ value, size = 168, label = "finished", sub }: { value: number; size?: number; label?: string; sub?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return setShown(value);
    let raf = 0;
    const start = performance.now();
    const from = shown;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 1100);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(from + (value - from) * e));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const id = useId().replace(/:/g, "");
  const stroke = Math.max(8, Math.round(size / 14));
  const r = (size - stroke) / 2 - 4;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${value}% ${label}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a45cff" />
            <stop offset="100%" stopColor="#19f5a5" />
          </linearGradient>
          <filter id={`f${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={stroke / 2.2} />
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#262c3a" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#262c3a" strokeOpacity="0.5" strokeWidth={1} strokeDasharray="2 6" transform={`translate(0 0)`} />
        {shown > 0 ? (
          <>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={`url(#g${id})`}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${(c * shown) / 100} ${c}`}
              filter={`url(#f${id})`}
              opacity="0.55"
            />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#g${id})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(c * shown) / 100} ${c}`} />
          </>
        ) : null}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="num font-extrabold leading-none" style={{ fontSize: size * 0.27 }}>
            {shown}
            <span className="text-site-dim" style={{ fontSize: size * 0.13 }}>
              %
            </span>
          </div>
          <div className="mt-1 text-[13px] text-site-mist">{sub ?? label}</div>
        </div>
      </div>
    </div>
  );
}

/** Small ring for list rows and cards. */
export function MiniRing({ value, size = 44 }: { value: number; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 80 ? "#19f5a5" : value > 0 ? "#a45cff" : "#3a4152";
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#262c3a" strokeWidth={stroke} />
        {value > 0 ? <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(c * value) / 100} ${c}`} /> : null}
      </svg>
      <span className="num absolute text-[12px] font-bold">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ people */

const HUES = [268, 158, 200, 330, 32, 290, 180, 12];
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const base = name.includes("@") ? name.split("@")[0] : name;
  const parts = base.split(/[.\s_-]+/).filter(Boolean);
  const initials = ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
  let h = 0;
  for (const ch of base) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = HUES[h % HUES.length];
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full font-bold text-site-paper"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${(hue + 40) % 360} 75% 32%))`,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.12)",
      }}
    >
      {initials}
    </span>
  );
}

export function personName(email: string, displayName?: string | null) {
  if (displayName?.trim()) return displayName.trim();
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/* ------------------------------------------------------------------ chips and pills */

export type Tone = "mint" | "violet" | "dim" | "alarm" | "amber";
const TONES: Record<Tone, string> = {
  mint: "bg-site-mint/10 text-site-mint ring-site-mint/25",
  violet: "bg-site-violet/15 text-site-violet-hi ring-site-violet/30",
  dim: "bg-white/[0.04] text-site-mist ring-white/10",
  alarm: "bg-site-alarm/10 text-site-alarm ring-site-alarm/25",
  amber: "bg-[#ffb547]/10 text-[#ffc56b] ring-[#ffb547]/25",
};
export function Pill({ tone = "dim", children, dot = false }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-semibold ring-1 ring-inset ${TONES[tone]}`}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export function LiveDot({ label = "Live" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-site-mist">
      <span className="live-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ surfaces */

export function Panel({ children, className = "", as: As = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "aside" }) {
  return <As className={`panel ${className}`}>{children}</As>;
}

export function PanelHead({ title, hint, action }: { title: ReactNode; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[17px] font-bold tracking-[-0.005em]">{title}</h2>
        {hint ? <p className="mt-0.5 text-sm text-site-dim">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export const btn = {
  primary:
    "btn inline-flex items-center justify-center gap-2 rounded-xl bg-site-violet px-4 py-2.5 font-semibold text-site-paper shadow-[0_8px_30px_-8px_rgba(139,44,245,.7)] transition hover:bg-site-violet-hi disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "btn inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-semibold text-site-paper transition hover:border-white/20 hover:bg-white/[0.07] disabled:opacity-50",
  quiet: "btn inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-site-mist transition hover:bg-white/[0.06] hover:text-site-paper",
};
export const field =
  "w-full rounded-xl border border-white/10 bg-[#0d1016] px-3.5 py-2.5 text-site-paper placeholder:text-site-dim transition focus:border-site-violet focus:bg-[#10131b]";

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-6">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block font-semibold">{label}</span>
        {hint ? <span className="mt-0.5 block text-sm text-site-dim">{hint}</span> : null}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-site-violet" : "bg-white/10"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] ${checked ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ slide-over sheet */

export function Sheet({ open, onClose, title, hint, children }: { open: boolean; onClose: () => void; title: string; hint?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => ref.current?.querySelector<HTMLElement>("input, textarea, button")?.focus(), 60);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close" className="sheet-scrim absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sheet absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-3xl border border-white/10 bg-[#141823] p-6 shadow-2xl sm:inset-y-3 sm:right-3 sm:left-auto sm:max-h-none sm:w-[460px] sm:rounded-3xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="display text-2xl font-extrabold" style={{ fontStretch: "112%" }}>
              {title}
            </h2>
            {hint ? <p className="mt-1.5 text-site-mist">{hint}</p> : null}
          </div>
          <button type="button" onClick={onClose} className={btn.quiet} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ toasts */

type Toast = { id: number; text: string; tone: "ok" | "err" };
const ToastCtx = createContext<(text: string, tone?: "ok" | "err") => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastHost({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { id, text, tone }]);
    window.setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === "err" ? "alert" : "status"}
            className="toast pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1b2030]/95 px-4 py-3 text-[15px] shadow-2xl backdrop-blur"
          >
            <span className={`grid h-6 w-6 place-items-center rounded-full ${t.tone === "err" ? "bg-site-alarm/20 text-site-alarm" : "bg-site-mint/15 text-site-mint"}`}>
              {t.tone === "err" ? "!" : <Check />}
            </span>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ------------------------------------------------------------------ icons */

type IconProps = { size?: number; className?: string };
const I = ({ d, size = 18, className = "" }: IconProps & { d: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d={d} />
  </svg>
);
export const Check = (p: IconProps) => <I {...p} d="M5 12.5l4.5 4.5L19 7.5" />;
export const Plus = (p: IconProps) => <I {...p} d="M12 5v14M5 12h14" />;
export const Arrow = (p: IconProps) => <I {...p} d="M5 12h14M13 6l6 6-6 6" />;
export const Back = (p: IconProps) => <I {...p} d="M19 12H5M11 6l-6 6 6 6" />;
export const Home = (p: IconProps) => <I {...p} d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />;
export const Building = (p: IconProps) => <I {...p} d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 9h3a1 1 0 0 1 1 1v11M3 21h18M8.5 8h3M8.5 12h3M8.5 16h3" />;
export const Shield = (p: IconProps) => <I {...p} d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM9 12l2 2 4-4" />;
export const Users = (p: IconProps) => <I {...p} d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.15a3.5 3.5 0 0 1 0 6.7" />;
export const Trophy = (p: IconProps) => <I {...p} d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />;
export const Calendar = (p: IconProps) => <I {...p} d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 3v4M16 3v4" />;
export const Gear = (p: IconProps) => <I {...p} d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />;
export const Download = (p: IconProps) => <I {...p} d="M12 4v11M7 10l5 5 5-5M5 20h14" />;
export const Mail = (p: IconProps) => <I {...p} d="M4 6h16v12H4zM4 7l8 6 8-6" />;
export const Search = (p: IconProps) => <I {...p} d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" />;
export const Bolt = (p: IconProps) => <I {...p} d="M13 3L5 13h6l-1 8 8-10h-6z" />;
export const Play = (p: IconProps) => <I {...p} d="M8 5v14l11-7z" />;
export const Menu = (p: IconProps) => <I {...p} d="M4 7h16M4 12h16M4 17h16" />;
export const Out = (p: IconProps) => <I {...p} d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" />;
export const Lock = (p: IconProps) => <I {...p} d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />;
export const Copy = (p: IconProps) => <I {...p} d="M9 9h10v10H9zM5 15V5h10" />;
