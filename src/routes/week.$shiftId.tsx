import { AccessGate } from "@/site/AccessGate";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import { shiftById, shiftLabel } from "@/content/week";
import type { ShiftDef } from "@/content/week/types";

export const Route = createFileRoute("/week/$shiftId")({
  loader: ({ params }) => {
    if (params.shiftId !== "sunday" && !shiftById(params.shiftId)) throw notFound();
    return { id: params.shiftId };
  },
  head: ({ params }) => ({ meta: [{ title: `${shiftLabel(params.shiftId)} · Dry Run Cyber` }] }),
  component: ShiftPage,
  notFoundComponent: () => (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#07090e] text-[#f4f0e6]">
      <p>No shift by that name.</p>
      <Link to="/week" className="mt-4 underline">
        Back to the week
      </Link>
    </div>
  ),
});

type Game = ComponentType<{ shift: ShiftDef; onExit: () => void }>;
type Sort = ComponentType<{ onExit: () => void }>;

function ShiftPage() {
  const { id } = Route.useLoaderData();
  const navigate = useNavigate();
  const [Game, setGame] = useState<Game | null>(null);
  const [Sorter, setSorter] = useState<Sort | null>(null);
  const exit = () => void navigate({ to: "/week" });

  useEffect(() => {
    let live = true;
    if (id === "sunday") void import("@/game/weekplay/SundaySort").then((m) => live && setSorter(() => m.SundaySort));
    else void import("@/game/weekplay/ShiftGame").then((m) => live && setGame(() => m.ShiftGame));
    return () => {
      live = false;
    };
  }, [id]);

  if (id === "sunday") return <AccessGate shift="sunday">{Sorter ? <Sorter onExit={exit} /> : <Loading label="Sunday" />}</AccessGate>;
  const shift = shiftById(id)!;
  return <AccessGate shift={id}>{Game ? <Game key={id} shift={shift} onExit={exit} /> : <Loading label={shift.day} />}</AccessGate>;
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-[#07090e] text-[#f4f0e6]">
      <p className="font-game text-xs tracking-[0.28em] text-[#c4a574]">DRY RUN CYBER</p>
      <h1 className="mt-3 font-display text-5xl">{label}</h1>
    </div>
  );
}
