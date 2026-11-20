import { useEffect, type ReactNode } from "react";

/**
 * Close-ups for the 👁 options in Monday's conversations. Picking "Look at his lanyard" pulls up the thing
 * itself so you spot what's off with your own eyes; the written note only appears once you're done looking.
 * Keyed by `${scenarioId}:${choiceId}`. Drawn as SVG (640 x 400), no text that gives the answer away.
 */

const INK = "#1b1d22";
const PAPER = "#f4f1ea";
const MARKER = "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', cursive";
const UI = "system-ui, -apple-system, 'Segoe UI', sans-serif";

function Frame({ children, bg = "#0f1318" }: { children: ReactNode; bg?: string }) {
  return (
    <svg viewBox="0 0 640 400" className="mx-auto block h-auto max-h-[calc(92dvh-150px)] w-full" role="img" aria-hidden="true">
      <rect width="640" height="400" fill={bg} />
      {children}
    </svg>
  );
}

function Rain({ n = 40 }: { n?: number }) {
  return (
    <g stroke="#c9d4e2" strokeOpacity="0.25" strokeWidth="1.2">
      {Array.from({ length: n }, (_, i) => {
        const x = (i * 97) % 640;
        const y = (i * 53) % 400;
        return <line key={i} x1={x} y1={y} x2={x - 4} y2={y + 18} />;
      })}
    </g>
  );
}

/* --------------------------------------------------------------- the courier at the door */

function CourierChest() {
  return (
    <Frame bg="#141a22">
      {/* hoodie */}
      <path d="M120 400 L150 150 Q320 90 490 150 L520 400 Z" fill="#2b2f36" />
      <path d="M262 112 Q320 150 378 112 L372 160 Q320 190 268 160 Z" fill="#23272d" />
      {/* hi-vis vest */}
      <path d="M150 160 L262 130 L282 400 L130 400 Z" fill="#c8e82c" />
      <path d="M490 160 L378 130 L358 400 L510 400 Z" fill="#c8e82c" />
      {[250, 320].map((y) => (
        <g key={y}>
          <rect x="138" y={y} width="140" height="22" fill="#d9dde2" />
          <rect x="362" y={y} width="142" height="22" fill="#d9dde2" />
          <rect x="138" y={y + 8} width="140" height="5" fill="#ffffff" opacity="0.6" />
          <rect x="362" y={y + 8} width="142" height="5" fill="#ffffff" opacity="0.6" />
        </g>
      ))}
      {/* iron-on print, a little crooked */}
      <text x="388" y="206" fontFamily={UI} fontWeight="800" fontSize="19" fill={INK} transform="rotate(-3 430 200)">
        SWIFTLINE
      </text>
      {/* vest pocket with a pen */}
      <rect x="180" y="190" width="62" height="44" rx="4" fill="#b3d127" stroke="#9fbb1f" />
      <rect x="196" y="176" width="6" height="30" fill="#1f3f8a" />
      {/* the zip, the neck: nothing hanging, no clip */}
      <line x1="320" y1="170" x2="320" y2="400" stroke="#15181c" strokeWidth="3" />
      {/* arms full: the parcel's top edge */}
      <rect x="170" y="352" width="300" height="60" fill="#b98d5c" />
      <rect x="170" y="352" width="300" height="8" fill="#a37a4b" />
      <path d="M150 400 Q170 352 200 356 L210 400 Z" fill="#c9a07c" />
      <path d="M490 400 Q470 352 440 356 L430 400 Z" fill="#c9a07c" />
      <Rain />
    </Frame>
  );
}

function ParcelLabel() {
  return (
    <Frame bg="#b98d5c">
      {/* cardboard */}
      <g opacity="0.18" stroke="#6b4a2e">
        {Array.from({ length: 22 }, (_, i) => (
          <line key={i} x1="0" y1={i * 19} x2="640" y2={i * 19 + 6} />
        ))}
      </g>
      <rect x="0" y="0" width="640" height="56" fill="#d6c7a8" opacity="0.7" />
      <rect x="0" y="344" width="640" height="56" fill="#d6c7a8" opacity="0.7" />
      {/* the shipping label */}
      <g transform="rotate(-2 320 200)">
        <rect x="150" y="80" width="340" height="250" fill={PAPER} stroke="#d9d4c7" />
        <text x="166" y="106" fontFamily={UI} fontSize="12" fill="#6c6a64" letterSpacing="1">
          FROM
        </text>
        <line x1="166" y1="124" x2="474" y2="124" stroke="#d9d4c7" />
        <text x="166" y="146" fontFamily={UI} fontSize="12" fill="#6c6a64" letterSpacing="1">
          SHIP TO
        </text>
        <text x="176" y="178" fontFamily={MARKER} fontSize="24" fill={INK}>
          HARBOR &amp; CO
        </text>
        <text x="176" y="208" fontFamily={MARKER} fontSize="24" fill={INK}>
          FINANCE · FL 14
        </text>
        <line x1="166" y1="226" x2="474" y2="226" stroke="#d9d4c7" />
        <text x="166" y="246" fontFamily={UI} fontSize="12" fill="#6c6a64" letterSpacing="1">
          TRACKING #
        </text>
        <rect x="176" y="258" width="288" height="56" fill="none" stroke="#c9c4b7" strokeDasharray="6 5" />
      </g>
      {/* tape */}
      <rect x="0" y="186" width="130" height="34" fill="#e8d9b4" opacity="0.65" />
      <rect x="510" y="186" width="130" height="34" fill="#e8d9b4" opacity="0.65" />
    </Frame>
  );
}

function ReceptionGlass() {
  return (
    <Frame bg="#0b0f14">
      {/* the lit lobby through the glass */}
      <rect x="60" y="40" width="520" height="340" fill="#2b2a26" />
      <rect x="60" y="40" width="520" height="120" fill="#3a372f" />
      <ellipse cx="320" cy="110" rx="160" ry="40" fill="#ffe3bf" opacity="0.25" />
      <text x="230" y="96" fontFamily={UI} fontSize="15" fontWeight="600" fill="#e9dcc0" letterSpacing="2">
        RECEPTION · VISITORS
      </text>
      {/* the receptionist, looking right at you */}
      <circle cx="320" cy="214" r="30" fill="#c9a07c" />
      <path d="M290 206 Q320 170 350 206 Q350 186 320 182 Q290 186 290 206 Z" fill="#2b2219" />
      <circle cx="309" cy="214" r="3.5" fill={INK} />
      <circle cx="331" cy="214" r="3.5" fill={INK} />
      <path d="M312 230 Q320 234 328 230" stroke={INK} strokeWidth="2" fill="none" />
      <path d="M262 300 Q320 236 378 300 Z" fill="#3d6fa8" />
      {/* desk with its lamp on */}
      <rect x="150" y="280" width="340" height="100" fill="#5c4632" />
      <rect x="150" y="276" width="340" height="10" fill="#3a2c20" />
      <path d="M430 276 L444 236 L470 236 L484 276 Z" fill="#efe2c6" />
      <ellipse cx="457" cy="280" rx="44" ry="10" fill="#ffe3bf" opacity="0.5" />
      <rect x="200" y="262" width="80" height="14" fill={PAPER} />
      {/* door frame and the wet glass */}
      <rect x="40" y="20" width="560" height="380" fill="none" stroke="#1b1d22" strokeWidth="40" />
      <rect x="60" y="40" width="520" height="340" fill="#9fb6c8" opacity="0.08" />
      <Rain n={70} />
      <rect x="560" y="190" width="10" height="70" rx="5" fill="#9aa0a6" />
    </Frame>
  );
}

/* --------------------------------------------------------------- the USB stick */

function UsbLabel() {
  return (
    <Frame bg="#6b4a2e">
      <g opacity="0.15" stroke="#3a2c20">
        {Array.from({ length: 14 }, (_, i) => (
          <path key={i} d={`M0 ${i * 30} Q320 ${i * 30 + 12} 640 ${i * 30}`} fill="none" />
        ))}
      </g>
      <g transform="rotate(-8 320 200)">
        <rect x="150" y="150" width="300" height="100" rx="14" fill="#141619" />
        <rect x="450" y="168" width="90" height="64" fill="#c9ccd0" />
        <rect x="470" y="182" width="16" height="12" fill="#6b7076" />
        <rect x="502" y="182" width="16" height="12" fill="#6b7076" />
        <circle cx="178" cy="200" r="9" fill="none" stroke="#2a2d33" strokeWidth="5" />
        {/* masking tape, marker */}
        <rect x="200" y="166" width="230" height="68" fill="#e9dcb2" />
        <text x="214" y="196" fontFamily={MARKER} fontSize="22" fill={INK}>
          SALARY REVIEW
        </text>
        <text x="214" y="224" fontFamily={MARKER} fontSize="22" fill={INK}>
          Q4
        </text>
      </g>
    </Frame>
  );
}

function LoanerUnlocked() {
  return (
    <Frame bg="#1b1d22">
      <rect x="70" y="30" width="500" height="310" rx="10" fill="#0d0f12" />
      <rect x="84" y="44" width="472" height="282" fill="#1f5f8f" />
      <rect x="84" y="44" width="472" height="282" fill="url(#wall)" opacity="0.4" />
      <defs>
        <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fd6a8" />
          <stop offset="1" stopColor="#1f3f8a" />
        </linearGradient>
      </defs>
      {/* open windows: signed in, working */}
      <rect x="120" y="70" width="250" height="160" fill={PAPER} />
      <rect x="120" y="70" width="250" height="20" fill="#2b5797" />
      <text x="128" y="84" fontFamily={UI} fontSize="10" fill="#fff">
        Outlook · loaner14-08@harborco.com
      </text>
      {[104, 124, 144, 164, 184].map((y) => (
        <rect key={y} x="130" y={y} width={200 - (y % 3) * 30} height="8" fill="#c9ccd0" />
      ))}
      <rect x="300" y="140" width="220" height="140" fill={PAPER} />
      <rect x="300" y="140" width="220" height="20" fill="#217346" />
      <text x="308" y="154" fontFamily={UI} fontSize="10" fill="#fff">
        Payroll_2026.xlsx
      </text>
      {[0, 1, 2, 3, 4].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={310 + c * 68} y={170 + r * 20} width="62" height="14" fill="#e3e7ea" />))}
      {/* taskbar with the clock */}
      <rect x="84" y="306" width="472" height="20" fill="#0d1117" />
      <rect x="96" y="310" width="12" height="12" fill="#3d9be0" />
      <text x="508" y="320" fontFamily={UI} fontSize="10" fill="#fff">
        9:52 PM
      </text>
      {/* the base, with its loaner sticker */}
      <path d="M40 340 L600 340 L620 370 L20 370 Z" fill="#9aa0a6" />
      <rect x="276" y="348" width="88" height="14" fill="#f2c230" />
      <text x="284" y="359" fontFamily={UI} fontSize="10" fontWeight="700" fill={INK}>
        LOANER 14-08
      </text>
    </Frame>
  );
}

/* --------------------------------------------------------------- the wire */

function WireText() {
  return (
    <Frame bg="#151a20">
      <rect x="200" y="10" width="240" height="390" rx="30" fill="#0d0f12" />
      <rect x="212" y="22" width="216" height="378" rx="22" fill="#f2f2f5" />
      <rect x="212" y="22" width="216" height="74" rx="22" fill="#f8f8fa" />
      <circle cx="320" cy="50" r="16" fill="#b9bcc4" />
      <text x="320" y="56" textAnchor="middle" fontFamily={UI} fontSize="14" fill="#fff">
        ?
      </text>
      <text x="320" y="82" textAnchor="middle" fontFamily={UI} fontSize="12" fill={INK}>
        +1 (347) 555-0198 ›
      </text>
      <rect x="236" y="104" width="168" height="24" rx="8" fill="#e6e7eb" />
      <text x="320" y="120" textAnchor="middle" fontFamily={UI} fontSize="10" fill="#3478f6">
        Unknown sender · Add to contacts
      </text>
      <text x="320" y="150" textAnchor="middle" fontFamily={UI} fontSize="9" fill="#8a8d94">
        Today 9:41 PM
      </text>
      <rect x="224" y="160" width="178" height="132" rx="14" fill="#e5e5ea" />
      {["Need the Calder wire out", "tonight, form's broken, have", "the new hire release it.", "Don't call, I'm in a board", "dinner. -E"].map((t, i) => (
        <text key={t} x="236" y={182 + i * 22} fontFamily={UI} fontSize="12" fill={INK}>
          {t}
        </text>
      ))}
      <rect x="224" y="356" width="192" height="28" rx="14" fill="#fff" stroke="#d1d2d6" />
      <text x="238" y="374" fontFamily={UI} fontSize="11" fill="#a3a5ab">
        Text Message
      </text>
    </Frame>
  );
}

function PortalUp() {
  return (
    <Frame bg="#1b1d22">
      <rect x="40" y="30" width="560" height="340" rx="8" fill="#f6f7f9" />
      <rect x="40" y="30" width="560" height="40" rx="8" fill="#e3e6ea" />
      {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
        <circle key={c} cx={62 + i * 18} cy="50" r="6" fill={c} />
      ))}
      <rect x="130" y="40" width="380" height="20" rx="10" fill="#fff" />
      <text x="146" y="54" fontFamily={UI} fontSize="11" fill="#3c4043">
        🔒 payments.harborco.com/wires/approve
      </text>
      <text x="70" y="104" fontFamily={UI} fontSize="20" fontWeight="700" fill={INK}>
        Wire approval
      </text>
      <rect x="430" y="88" width="140" height="24" rx="12" fill="#e6f4ea" />
      <circle cx="446" cy="100" r="5" fill="#1e8e3e" />
      <text x="456" y="104" fontFamily={UI} fontSize="11" fill="#1e8e3e">
        All systems normal
      </text>
      {[
        ["Beneficiary", "Calder Logistics Ltd"],
        ["Amount", "$2,400,000.00"],
        ["Requested by", ""],
        ["Approver (dual control)", ""],
      ].map(([k, v], i) => (
        <g key={k}>
          <text x="70" y={146 + i * 52} fontFamily={UI} fontSize="11" fill="#5f6368">
            {k}
          </text>
          <rect x="70" y={152 + i * 52} width="500" height="28" rx="4" fill="#fff" stroke="#c9ccd0" />
          <text x="80" y={171 + i * 52} fontFamily={UI} fontSize="12" fill={INK}>
            {v}
          </text>
        </g>
      ))}
      <rect x="430" y="340" width="140" height="22" rx="4" fill="#1a73e8" />
      <text x="500" y="355" textAnchor="middle" fontFamily={UI} fontSize="11" fill="#fff">
        Submit for approval
      </text>
    </Frame>
  );
}

/* --------------------------------------------------------------- the loaner's updates */

function UpdatesPanel() {
  return (
    <Frame bg="#1b1d22">
      <rect x="40" y="30" width="560" height="340" fill="#f3f3f3" />
      <rect x="40" y="30" width="560" height="32" fill="#e6e6e6" />
      <text x="56" y="51" fontFamily={UI} fontSize="12" fill={INK}>
        Settings › Windows Update
      </text>
      <circle cx="94" cy="110" r="26" fill="#fbe9e7" />
      <text x="94" y="119" textAnchor="middle" fontFamily={UI} fontSize="26" fill="#c42b1c">
        !
      </text>
      <text x="136" y="104" fontFamily={UI} fontSize="18" fontWeight="600" fill={INK}>
        There were problems installing some updates
      </text>
      <text x="136" y="126" fontFamily={UI} fontSize="12" fill="#5f6368">
        Last successful update: 23 days ago
      </text>
      {["2026-11 Cumulative Update (Security)", "2026-10 Cumulative Update (Security)", "Security Intelligence Update"].map((t, i) => (
        <g key={t}>
          <rect x="70" y={160 + i * 56} width="500" height="46" fill="#fff" stroke="#e1e1e1" />
          <text x="86" y={180 + i * 56} fontFamily={UI} fontSize="12" fill={INK}>
            {t}
          </text>
          <text x="86" y={196 + i * 56} fontFamily={UI} fontSize="11" fill="#c42b1c">
            Install error · 0x80070643
          </text>
          <rect x="492" y={170 + i * 56} width="64" height="24" rx="4" fill="#fff" stroke="#c9ccd0" />
          <text x="508" y={186 + i * 56} fontFamily={UI} fontSize="11" fill={INK}>
            Retry
          </text>
        </g>
      ))}
    </Frame>
  );
}

function ShieldTray() {
  return (
    <Frame bg="#1f5f8f">
      <rect x="0" y="310" width="640" height="90" fill="#0d1117" />
      {/* tooltip */}
      <rect x="250" y="190" width="300" height="92" rx="6" fill="#2b2f36" stroke="#3d434b" />
      <text x="268" y="218" fontFamily={UI} fontSize="15" fontWeight="600" fill="#f0ece2">
        Harbor Shield
      </text>
      <text x="268" y="244" fontFamily={UI} fontSize="14" fill="#f0ece2">
        Protection off. Contact IT.
      </text>
      <text x="268" y="266" fontFamily={UI} fontSize="11" fill="#a8a59c">
        Real-time scanning: disabled
      </text>
      {/* tray icons: the shield, grey */}
      <path d="M400 332 L424 340 L424 360 Q424 376 400 384 Q376 376 376 360 L376 340 Z" fill="#6b7076" />
      <path d="M400 340 L416 346 L416 360 Q416 370 400 376 Z" fill="#8a8f95" />
      {/* wifi, volume, battery, clock */}
      <path d="M452 362 Q468 344 484 362" stroke="#fff" strokeWidth="3" fill="none" />
      <path d="M458 368 Q468 358 478 368" stroke="#fff" strokeWidth="3" fill="none" />
      <path d="M500 352 L508 352 L518 344 L518 376 L508 368 L500 368 Z" fill="#fff" />
      <rect x="532" y="350" width="30" height="18" rx="3" fill="none" stroke="#fff" strokeWidth="2" />
      <rect x="535" y="353" width="18" height="12" fill="#fff" />
      <text x="580" y="356" fontFamily={UI} fontSize="12" fill="#fff">
        9:58
      </text>
      <text x="572" y="374" fontFamily={UI} fontSize="11" fill="#fff">
        PM
      </text>
    </Frame>
  );
}

function BadgeBack() {
  return (
    <Frame bg="#2a2d33">
      <rect x="180" y="40" width="280" height="330" rx="18" fill={PAPER} />
      <rect x="290" y="56" width="60" height="12" rx="6" fill="#2a2d33" />
      <rect x="180" y="96" width="280" height="40" fill="#1b1d22" />
      <text x="204" y="170" fontFamily={UI} fontSize="13" fontWeight="700" fill={INK}>
        HARBOR &amp; CO.
      </text>
      <text x="204" y="190" fontFamily={UI} fontSize="11" fill="#5f6368">
        If found, return to 400 Harbor Way
      </text>
      <line x1="204" y1="206" x2="436" y2="206" stroke="#d9d4c7" />
      {[
        ["IT help desk", "ext 4100"],
        ["Security desk", "ext 4000"],
        ["Facilities", "ext 4200"],
      ].map(([k, v], i) => (
        <g key={k}>
          <text x="204" y={236 + i * 30} fontFamily={UI} fontSize="14" fill={INK}>
            {k}
          </text>
          <text x="436" y={236 + i * 30} textAnchor="end" fontFamily={UI} fontSize="14" fontWeight="700" fill={INK}>
            {v}
          </text>
        </g>
      ))}
      <text x="204" y="340" fontFamily={UI} fontSize="10" fill="#8a8d94">
        Badge in at every door. Do not lend this card.
      </text>
    </Frame>
  );
}

/* --------------------------------------------------------------- end of shift */

function EmptyLock() {
  return (
    <Frame bg="#2b2f36">
      {/* two desks side by side */}
      <rect x="0" y="230" width="640" height="24" fill="#d9d4c7" />
      <rect x="0" y="254" width="640" height="146" fill="#3a3f47" />
      <line x1="320" y1="230" x2="320" y2="400" stroke="#2b2f36" strokeWidth="6" />
      {/* desk 07: the courier's parcel */}
      <rect x="70" y="150" width="170" height="84" fill="#b98d5c" />
      <rect x="70" y="150" width="170" height="10" fill="#a37a4b" />
      <rect x="110" y="176" width="90" height="40" fill={PAPER} />
      <text x="118" y="198" fontFamily={MARKER} fontSize="11" fill={INK}>
        FINANCE · FL 14
      </text>
      <rect x="40" y="86" width="70" height="26" fill={PAPER} />
      <text x="50" y="104" fontFamily={UI} fontSize="12" fontWeight="700" fill={INK}>
        14-07
      </text>
      {/* desk 08: the dock, the lock, and no laptop */}
      <rect x="350" y="86" width="70" height="26" fill="#f2c230" />
      <text x="358" y="104" fontFamily={UI} fontSize="12" fontWeight="700" fill={INK}>
        14-08
      </text>
      <rect x="420" y="206" width="120" height="24" rx="4" fill="#1b1d22" />
      <rect x="430" y="212" width="20" height="8" fill="#3d9be0" />
      <rect x="400" y="140" width="180" height="90" fill="none" stroke="#9aa0a6" strokeDasharray="6 6" opacity="0.35" />
      <path d="M560 230 Q600 300 540 330 Q500 345 470 320" stroke="#9aa0a6" strokeWidth="5" fill="none" />
      <rect x="452" y="308" width="26" height="20" rx="4" fill="#6b7076" />
      <circle cx="465" cy="318" r="4" fill="#2b2f36" />
    </Frame>
  );
}

const CLOSEUPS: Record<string, () => ReactNode> = {
  "MON-01-tailgate:look_badge": CourierChest,
  "MON-01-tailgate:look_parcel": ParcelLabel,
  "MON-01-tailgate:look_reception": ReceptionGlass,
  "MON-04-usb:look_label": UsbLabel,
  "MON-04-usb:look_laptop": LoanerUnlocked,
  "MON-05-wire:look_text": WireText,
  "MON-05-wire:look_form": PortalUp,
  "MON-06-updates:look_updates": UpdatesPanel,
  "MON-06-updates:look_shield": ShieldTray,
  "MON-06-updates:look_badge": BadgeBack,
  "MON-09-cleandesk:look_parcel": EmptyLock,
};

export function hasCloseup(scenario: string, choice: string) {
  return !!CLOSEUPS[`${scenario}:${choice}`];
}

/** The pop-up: the picture, nothing else, until you say you're done looking. */
export function Closeup({ scenario, choice, label, alt, onClose }: { scenario: string; choice: string; label: string; alt: string; onClose: () => void }) {
  const Art = CLOSEUPS[`${scenario}:${choice}`];
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [onClose]);
  if (!Art) return null;
  return (
    <div className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center bg-[#07090e]/80 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="flex max-h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0c0d0f] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="px-5 pt-4 text-[10px] tracking-[0.24em] text-[#c4a574]">👁 {label.toUpperCase()}</p>
        <p className="px-5 pt-1 text-sm text-[#a8a59c]">What's off? Take a look, then make your call.</p>
        <div className="mt-3">
          <Art />
          <span className="sr-only">{alt}</span>
        </div>
        <div className="flex shrink-0 justify-end px-5 py-3">
          <button type="button" autoFocus onClick={onClose} className="min-h-11 border border-[#c4a574]/60 px-5 text-sm hover:bg-white/5">
            Done looking
          </button>
        </div>
      </div>
    </div>
  );
}
