import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import mailJson from "@/content/scenarios/mon-02-phishing-v2.json";
import callJson from "@/content/scenarios/mon-03-vishing-v2.json";
import signinJson from "@/content/scenarios/mon-07-signin-v2.json";
import doorJson from "@/content/scenarios/mon-01-tailgate-v2.json";
import usbJson from "@/content/scenarios/mon-04-usb-v2.json";
import updatesJson from "@/content/scenarios/mon-06-updates-v2.json";
import wireJson from "@/content/scenarios/mon-05-wire-v2.json";
import cleandeskJson from "@/content/scenarios/mon-09-cleandesk-v2.json";
import misdirectJson from "@/content/scenarios/mon-08-misdirect-v2.json";
import { addFallout, hasFallout } from "@/game/fallout";
import { exitFocus, focus, type FocusApp } from "@/game/focus";
import { ComposeApp, type ComposeContent, type ComposeResult } from "@/game/mail/ComposeApp";
import { MailClient } from "@/game/mail/MailClient";
import type { InboxContent, MailResult } from "@/game/mail/mailLogic";
import type { CallContent } from "@/game/phone/callLogic";
import { PhoneCall } from "@/game/phone/PhoneCall";
import { SigninPush, type SigninContent } from "@/game/signin/SigninPush";
import type { TalkContent } from "@/game/talk/dialogue";
import { TalkPanel } from "@/game/talk/TalkPanel";
import { useHarbor } from "@/game/state";

// Every v2 beat's UI, mounted once in Harbor.tsx. Each app shows when focus.app
// says so and hands its v1 outcome id(s) to choose() after the camera/app exits.
// Rendered through a portal on <body> so the game root's touch-action:none and
// key handlers don't reach it.

const inbox = mailJson as unknown as InboxContent;
const call = callJson as unknown as CallContent;
const signin = signinJson as unknown as SigninContent;
const compose = misdirectJson as unknown as ComposeContent;
const talks: Partial<Record<FocusApp, TalkContent>> = {
  door: doorJson as unknown as TalkContent,
  usb: usbJson as unknown as TalkContent,
  updates: updatesJson as unknown as TalkContent,
  wire: wireJson as unknown as TalkContent,
  cleandesk: cleandeskJson as unknown as TalkContent,
};

/** The clean desk changes if the courier got in earlier. */
function cleandeskFor(base: TalkContent): TalkContent {
  if (!hasFallout("courier_in")) return base;
  const extra = (base as TalkContent & { courier_tells?: TalkContent["tells"] }).courier_tells ?? [];
  return { ...base, start: "end_courier", tells: [...base.tells, ...extra] };
}

/** Below this many CSS pixels wide, the monitor is too small to use: go full screen instead. */
const MIN_EMBED_WIDTH = 760;

/** Hand one or more v1 outcomes to the story once the app has closed. */
function finish(steps: string[], result: unknown) {
  focus.lastResult = result;
  exitFocus(() => {
    for (const id of steps) useHarbor.getState().choose(id);
  });
}

export function DeskScreen() {
  const [snap, setSnap] = useState({ phase: focus.phase, app: focus.app, rect: { ...focus.rect } });
  const last = useRef("");

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const r = focus.rect;
      const key = `${focus.phase}|${focus.app}|${Math.round(r.x)}|${Math.round(r.y)}|${Math.round(r.w)}|${Math.round(r.h)}`;
      if (key !== last.current) {
        last.current = key;
        setSnap({ phase: focus.phase, app: focus.app, rect: { ...r } });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (snap.phase === "off" || !snap.app || typeof document === "undefined") return null;
  const app = snap.app;

  // Apps on the desk monitor: laid over the monitor's projected rectangle.
  if (app === "mail" || app === "misdirect") {
    const done = (r: MailResult) => {
      if (r.enteredCreds) addFallout("creds_phished");
      finish([r.choiceId], r);
    };
    return (
      <OnMonitor phase={snap.phase} rect={snap.rect}>
        {app === "mail" ? (
          <MailClient content={inbox} variant={focus.mailVariant} onDone={done} embedded showSummary />
        ) : (
          <ComposeApp
            content={compose}
            variant={focus.misdirectVariant}
            onDone={(r: ComposeResult) => finish(r.steps, r)}
          />
        )}
      </OnMonitor>
    );
  }

  // Everything else opens in place with no camera move.
  if (snap.phase !== "hold") return null;

  if (app === "phone") {
    return createPortal(<PhoneCall content={call} onDone={(r) => finish([r.choiceId], r)} />, document.body);
  }

  if (app === "signin") {
    const fallout = hasFallout("code_given") ? "code_given" : hasFallout("creds_phished") ? "creds_phished" : null;
    return createPortal(
      <SigninPush content={signin} fallout={fallout} onDone={(r) => finish([r.choiceId], r)} />,
      document.body,
    );
  }

  const talk = talks[app];
  if (talk) {
    const content = app === "cleandesk" ? cleandeskFor(talk) : talk;
    return createPortal(
      <TalkPanel key={app} content={content} onDone={(r) => finish([r.choiceId], r)} />,
      document.body,
    );
  }

  return null;
}

/** Lays an app exactly over the monitor once the desk zoom settles; full screen on phones. */
function OnMonitor({
  phase,
  rect,
  children,
}: {
  phase: string;
  rect: { x: number; y: number; w: number; h: number };
  children: ReactNode;
}) {
  const shown = phase === "hold";
  const narrow = rect.w < MIN_EMBED_WIDTH || window.innerWidth < MIN_EMBED_WIDTH;
  const box: CSSProperties = narrow
    ? { position: "absolute", inset: 0 }
    : { position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h };
  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        // Dim the HUD and the monitor bezel around the app once the zoom has settled.
        background: "rgba(7, 9, 14, 0.9)",
        opacity: shown ? 1 : 0,
        transition: shown ? "opacity 180ms ease-out" : "opacity 120ms ease-in",
        pointerEvents: shown ? "auto" : "none",
        touchAction: "auto",
        userSelect: "text",
      }}
    >
      <div style={box}>{children}</div>
    </div>,
    document.body,
  );
}
