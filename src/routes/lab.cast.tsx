import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";

export const Route = createFileRoute("/lab/cast")({
  head: () => ({ meta: [{ title: "Cast check · Dry Run Cyber" }, { name: "robots", content: "noindex" }] }),
  component: CastLab,
});

/** A turntable for checking a converted character before it goes in a scene. ?slot=night-desk */
function CastLab() {
  const [View, setView] = useState<ComponentType | null>(null);
  useEffect(() => {
    void import("@/game/CastLabView").then((m) => setView(() => m.CastLabView));
  }, []);
  return View ? <View /> : <div className="h-dvh bg-[#1a1d22]" />;
}
