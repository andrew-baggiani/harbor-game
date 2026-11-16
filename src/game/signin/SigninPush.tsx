import { useEffect, useRef, useState } from "react";
import { blip } from "@/game/audio";
import type { Fallout } from "@/game/fallout";

// Sign-in beat as a real authenticator push: number matching, location, device,
// and the same request coming back every few seconds (MFA fatigue).

type Row = { label: string; value: string; tell?: string; why?: string };

export type SigninContent = {
  app: string;
  repeat_seconds: number;
  max_repeats: number;
  request: { title: string; rows: Row[]; number_prompt: string };
  monitor_check: { label: string; result: string; tell: string; why: string };
  fatigue: { tell: string; why: string };
  fallout: Partial<Record<Fallout, { banner: string; tell: string; why: string }>>;
  after_deny: { text: string; report_label: string; report_done: string; skip_label: string };
  tells_order: string[];
  outcomes: { approve: string; deny: string; dismiss: string; report: string };
};

export type SigninResult = {
  choiceId: "signin-yes" | "signin-ignore" | "signin-report";
  evidence: string[];
  tellsTotal: number;
  pushes: number;
  fallout: Fallout | null;
  ms: number;
};

type Props = { content: SigninContent; fallout: Fallout | null; onDone: (r: SigninResult) => void };

const GOLD = "#c4a574";

export function SigninPush({ content, fallout, onDone }: Props) {
  const [pushes, setPushes] = useState(1);
  const [shake, setShake] = useState(0);
  const [num, setNum] = useState("");
  const [peek, setPeek] = useState(false);
  const [stage, setStage] = useState<"ask" | "denied" | "reported">("ask");
  const [summary, setSummary] = useState<SigninResult | null>(null);
  const found = useRef(new Set<string>());
  const started = useRef(Date.now());
  const fall = fallout ? content.fallout[fallout] : undefined;

  // The attacker keeps pushing until you answer.
  useEffect(() => {
    if (stage !== "ask") return;
    if (pushes >= content.max_repeats) return;
    const id = window.setTimeout(() => {
      setPushes((p) => p + 1);
      setShake((s) => s + 1);
      blip(740);
    }, content.repeat_seconds * 1000);
    return () => window.clearTimeout(id);
  }, [pushes, stage, content.repeat_seconds, content.max_repeats]);

  const tells = [
    ...content.request.rows.filter((r) => r.tell).map((r) => ({ tell: r.tell!, why: r.why! })),
    { tell: content.monitor_check.tell, why: content.monitor_check.why },
    { tell: content.fatigue.tell, why: content.fatigue.why },
    ...(fall ? [{ tell: fall.tell, why: fall.why }] : []),
  ];

  const finish = (choiceId: SigninResult["choiceId"]) => {
    if (pushes > 1 && choiceId !== "signin-yes") found.current.add(content.fatigue.tell);
    if (fall && choiceId === "signin-report") found.current.add(fall.tell);
    setSummary({
      choiceId,
      evidence: [...found.current],
      tellsTotal: tells.length,
      pushes,
      fallout,
      ms: Date.now() - started.current,
    });
  };

  if (summary)
    return <Summary tells={tells} result={summary} fallBanner={fall?.banner} onContinue={() => onDone(summary)} />;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[#07090e]/80 p-3 text-[#f4f0e6] md:items-center"
      onKeyDownCapture={(e) => e.stopPropagation()}
      onKeyUpCapture={(e) => e.stopPropagation()}
    >
      <div className="flex h-[min(44rem,92dvh)] w-full max-w-md flex-col overflow-y-auto rounded-[2rem] border border-white/10 bg-[#101318] p-5 shadow-2xl">
        <p className="text-center text-[11px] tracking-[0.2em] text-white/50">{content.app.toUpperCase()}</p>

        {stage === "ask" && (
          <div key={shake} className={shake ? "animate-[signin-shake_0.4s]" : ""}>
            <style>{`@keyframes signin-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>
            {pushes > 1 && (
              <p className="mt-3 rounded-xl bg-[#d98a1e]/20 px-3 py-2 text-center text-xs text-[#f3c27a]">
                Request {pushes} · it keeps asking
              </p>
            )}
            {fall && <p className="mt-3 rounded-xl bg-[#b3261e]/25 px-3 py-2 text-xs text-[#ffb4ab]">{fall.banner}</p>}
            <h2 className="mt-5 text-center text-2xl">{content.request.title}</h2>
            <dl className="mt-5 divide-y divide-white/10 rounded-2xl bg-white/5 text-sm">
              {content.request.rows.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  className="flex w-full justify-between gap-4 px-4 py-3 text-left hover:bg-white/5"
                  onClick={() => r.tell && found.current.add(r.tell)}
                >
                  <dt className="text-white/50">{r.label}</dt>
                  <dd className="text-right">{r.value}</dd>
                </button>
              ))}
            </dl>

            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-white/15 px-3 py-2 text-left text-xs text-white/75"
              onClick={() => {
                setPeek(true);
                found.current.add(content.monitor_check.tell);
              }}
            >
              👁 {content.monitor_check.label}
              {peek && <span className="mt-1 block text-white">{content.monitor_check.result}</span>}
            </button>

            <label className="mt-5 block text-xs text-white/60">{content.request.number_prompt}</label>
            <input
              inputMode="numeric"
              maxLength={2}
              value={num}
              onChange={(e) => setNum(e.target.value.replace(/\D/g, ""))}
              placeholder="--"
              className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 text-center text-2xl tracking-[0.4em]"
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="min-h-12 rounded-xl bg-white/10 text-sm"
                onClick={() => setStage("denied")}
              >
                No, it's not me
              </button>
              <button
                type="button"
                disabled={num.length < 2}
                className="min-h-12 rounded-xl bg-[#2f6fd6] text-sm disabled:opacity-40"
                onClick={() => finish("signin-yes")}
              >
                Yes, approve
              </button>
            </div>
            <button type="button" className="mt-4 w-full text-xs text-white/45" onClick={() => finish("signin-ignore")}>
              Swipe it away
            </button>
          </div>
        )}

        {stage === "denied" && (
          <div className="m-auto text-center">
            <p className="text-lg">{content.after_deny.text}</p>
            <button
              type="button"
              className="mt-6 min-h-12 w-full rounded-xl bg-[#b3261e] text-sm"
              onClick={() => setStage("reported")}
            >
              {content.after_deny.report_label}
            </button>
            <button type="button" className="mt-3 w-full text-xs text-white/50" onClick={() => finish("signin-ignore")}>
              {content.after_deny.skip_label}
            </button>
          </div>
        )}

        {stage === "reported" && (
          <div className="m-auto text-center">
            <p className="text-lg">{content.after_deny.report_done}</p>
            <button
              type="button"
              className="mt-6 min-h-12 w-full rounded-xl border border-white/30 text-sm"
              onClick={() => finish("signin-report")}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Summary({
  tells,
  result,
  fallBanner,
  onContinue,
}: {
  tells: { tell: string; why: string }[];
  result: SigninResult;
  fallBanner?: string;
  onContinue: () => void;
}) {
  const headline =
    result.choiceId === "signin-yes"
      ? "You let them in."
      : result.choiceId === "signin-report"
        ? "Denied and reported."
        : "You didn't approve it, but nobody knows.";
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#07090e]/85 p-4 text-[#f4f0e6] md:items-center">
      <div className="w-full max-w-lg border border-white/10 bg-[#0c0d0f]/95 p-6 md:p-8">
        <p className="text-[10px] tracking-[0.24em]" style={{ color: GOLD }}>
          SIGN-IN · WHAT YOU CAUGHT
        </p>
        <h2 className="mt-2 font-display text-3xl text-balance">{headline}</h2>
        {fallBanner && <p className="mt-2 text-sm text-[#ffb4ab]">{fallBanner}</p>}
        <ul className="mt-5 space-y-2 text-sm">
          {tells.map((t) => {
            const got = result.evidence.includes(t.tell);
            return (
              <li key={t.tell} className="flex gap-3">
                <span style={{ color: got ? GOLD : "#6b6a66" }}>{got ? "✓" : "○"}</span>
                <span className={got ? "" : "text-[#a8a59c]"}>{t.why}</span>
              </li>
            );
          })}
        </ul>
        <button type="button" className="mt-6 min-h-11 border px-4 text-sm" style={{ borderColor: GOLD }} onClick={onContinue}>
          Continue the shift
        </button>
      </div>
    </div>
  );
}
