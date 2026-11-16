import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import content from "@/content/scenarios/mon-02-phishing-v2.json";
import { exitFocus, focus } from "@/game/focus";
import { MailClient } from "@/game/mail/MailClient";
import type { InboxContent, MailResult } from "@/game/mail/mailLogic";
import { useHarbor } from "@/game/state";

const inbox = content as unknown as InboxContent;

/** Below this many CSS pixels wide, the monitor is too small to use: go full screen instead. */
const MIN_EMBED_WIDTH = 760;

// The clickable app that sits exactly on top of the in-world monitor once the desk
// zoom settles. Mount it once anywhere in the night route; it shows itself.
// Rendered through a portal on <body> so the game root's touch-action:none and
// key handlers don't reach it.
export function DeskScreen() {
  const [snap, setSnap] = useState({ phase: focus.phase, app: focus.app, rect: { ...focus.rect }, variant: focus.mailVariant });
  const last = useRef("");

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const r = focus.rect;
      const key = `${focus.phase}|${focus.app}|${focus.t > 0.97 ? 1 : 0}|${Math.round(r.x)}|${Math.round(r.y)}|${Math.round(r.w)}|${Math.round(r.h)}`;
      if (key !== last.current) {
        last.current = key;
        setSnap({ phase: focus.phase, app: focus.app, rect: { ...r }, variant: focus.mailVariant });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (snap.phase === "off" || snap.app !== "mail" || typeof document === "undefined") return null;

  const shown = snap.phase === "hold";
  const narrow = snap.rect.w < MIN_EMBED_WIDTH || window.innerWidth < MIN_EMBED_WIDTH;
  const style: React.CSSProperties = narrow
    ? { position: "absolute", inset: 0 }
    : { position: "absolute", left: snap.rect.x, top: snap.rect.y, width: snap.rect.w, height: snap.rect.h };

  const done = (result: MailResult) => {
    focus.lastResult = result;
    // Glide back out, then hand the v1 outcome to the story: debrief voice, flags, records.
    exitFocus(() => useHarbor.getState().choose(result.choiceId));
  };

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
      <div style={style}>
        <MailClient content={inbox} variant={snap.variant} onDone={done} embedded showSummary />
      </div>
    </div>,
    document.body,
  );
}
