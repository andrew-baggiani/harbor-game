import { useEffect, useState } from "react";
import { CALLS, ORDERS, WATCHES, getSignal, type Call, type OrderId } from "@/content/shift";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui";
import { advance, decide, fuseFor, inspect, pickOrder, tally, type Run } from "@/lib/shift-game";
import { cn } from "@/lib/utils";

export function ShiftBoard({
  run,
  onChange,
  onExit,
  callsign,
}: {
  run: Run;
  onChange: (run: Run) => void;
  onExit: () => void;
  callsign: string;
}) {
  const [selected, setSelected] = useState<string | null>(run.queue[0]?.id ?? null);
  const watch = WATCHES[run.watch] ?? WATCHES[0]!;
  const active = run.queue.find((signal) => signal.id === selected) ?? null;

  useEffect(() => {
    if (selected && !run.queue.some((signal) => signal.id === selected)) {
      setSelected(run.queue[0]?.id ?? null);
    }
  }, [run.queue, selected]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (run.phase !== "play") return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLButtonElement) {
        return;
      }
      if (event.key === "Enter") {
        onChange(advance(run));
        return;
      }
      const index = Number(event.key) - 1;
      const call = CALLS[index];
      if (!call || !active || run.locked) return;
      onChange(decide(run, active.id, call.id));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run, active, onChange]);

  if (run.phase === "order") {
    return (
      <div className="enter mx-auto w-full max-w-3xl">
        <p className="text-sm text-faint">Between watches</p>
        <h1 className="mt-2 font-display text-4xl text-balance md:text-5xl">Pick a standing order.</h1>
        <p className="mt-3 max-w-prose text-pretty text-muted">
          {watch.name} is done. Pressure is {run.pressure}. The order lasts for the next watch only.
          {run.queue.length > 0
            ? ` ${run.queue.length} still on the desk, and they keep aging.`
            : " The desk is clear."}
        </p>
        <div className="mt-6 grid gap-3">
          {ORDERS.map((order) => (
            <button
              key={order.id}
              type="button"
              className="rounded-3xl border border-line bg-elevated p-5 text-left hover:border-line-strong"
              onClick={() => onChange(pickOrder(run, order.id as OrderId))}
            >
              <span className="font-display text-2xl text-fg">{order.name}</span>
              <span className="mt-1 block text-pretty text-muted">{order.line}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (run.phase === "won" || run.phase === "lost") {
    const counts = tally(run);
    const held = run.phase === "won";
    const path = `/result?end=${held ? "held" : "lost"}&sc=${run.score}&pr=${run.pressure}&n=${encodeURIComponent(callsign)}`;
    return (
      <div className="enter mx-auto w-full max-w-3xl">
        <p className="text-sm text-faint">{held ? "Shift held" : "Shift lost"}</p>
        <h1 className="mt-2 font-display text-4xl text-balance md:text-5xl">
          {held ? "The floor stayed boring." : "Pressure took the floor."}
        </h1>
        <p className="mt-4 font-display text-6xl tabular-nums">{run.score}</p>
        <p className="text-sm text-muted">score · pressure {run.pressure}</p>
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <EndStat label="Clean" value={counts.exact} />
          <EndStat label="Close" value={counts.soft} />
          <EndStat label="Wrong" value={counts.miss} />
          <EndStat label="Detonated" value={counts.detonated} />
        </dl>
        <p className="mt-6 max-w-prose text-sm text-pretty text-faint">{run.note}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button onClick={onExit}>Another shift</Button>
          <ShareButton
            label="Share this shift"
            title={`Dry Run Cyber · ${callsign}`}
            text={`Dry Run Cyber shift — ${held ? "held" : "lost"}, score ${run.score}, pressure ${run.pressure}. ${callsign}.`}
            path={path}
          />
        </div>
      </div>
    );
  }

  const signal = active ? getSignal(active.id) : null;
  const left = signal && active ? fuseFor(active.id, run.order) - active.age : 0;

  return (
    <div className="enter mx-auto w-full max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-faint">
            Watch {run.watch + 1} of 3 · {watch.name}
          </p>
          <h1 className="mt-1 font-display text-4xl text-balance">{watch.hours}</h1>
        </div>
        <div className="w-full sm:max-w-xs">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-faint">Pressure</span>
            <span className="tabular-nums text-fg">{run.pressure}</span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-sunken"
            role="meter"
            aria-valuenow={run.pressure}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Pressure"
          >
            <div
              className={cn(
                "h-full motion-safe:transition-[width] motion-safe:duration-500",
                run.pressure >= 75 ? "bg-bad" : run.pressure >= 45 ? "bg-warn" : "bg-paper",
              )}
              style={{ width: `${run.pressure}%` }}
            />
          </div>
          <p className="mt-2 text-sm tabular-nums text-faint">
            {run.locked ? "No actions left" : `${run.actions} ${run.actions === 1 ? "action" : "actions"}`}
            {" · "}
            hour {run.beat + 1} of 5 · {run.score} pts
          </p>
        </div>
      </div>

      {run.note ? <p className="mt-4 text-sm text-muted">{run.note}</p> : null}

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <ul className="grid gap-2" aria-label="Desk">
          {run.queue.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-muted">
              Nothing waiting. Advance the hour, or spend the quiet.
            </li>
          ) : (
            run.queue.map((item) => {
              const def = getSignal(item.id);
              const remain = fuseFor(item.id, run.order) - item.age;
              const on = item.id === selected;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(item.id)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left",
                      on ? "border-line-strong bg-elevated" : "border-line bg-sunken",
                    )}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-xs text-faint">
                        {def.channel} · {def.from}
                      </span>
                      <span className={cn("text-xs tabular-nums", remain <= 1 ? "text-bad" : "text-faint")}>
                        {remain <= 1 ? "This hour" : `${remain}h`}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm text-pretty text-fg">{def.preview}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <section className="rounded-3xl border border-line bg-elevated p-5">
          {signal && active ? (
            <>
              <p className="text-xs text-faint">
                {signal.channel} · {left <= 1 ? "Goes off if you leave it" : `${left} hours on the fuse`}
                {active.inspected ? " · inspected" : ""}
              </p>
              <h2 className="mt-2 font-display text-3xl text-balance">{signal.from}</h2>
              <p className="mt-3 text-pretty text-fg">{active.inspected ? signal.detail : signal.preview}</p>
              {!active.inspected ? (
                <p className="mt-3 text-sm text-pretty text-muted">
                  You can call this blind. Inspect spends an action and shows the part that is usually the trick.
                </p>
              ) : null}
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="secondary"
                  disabled={run.locked || active.inspected}
                  onClick={() => onChange(inspect(run, active.id))}
                >
                  Inspect
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {CALLS.map((call, index) => (
                  <button
                    key={call.id}
                    type="button"
                    disabled={run.locked}
                    onClick={() => onChange(decide(run, active.id, call.id as Call))}
                    className="min-h-11 rounded-md border border-line bg-sunken px-3 py-2 text-left disabled:opacity-40"
                  >
                    <span className="mr-2 font-mono text-xs text-faint">{index + 1}</span>
                    <span className="text-fg">{call.label}</span>
                    <span className="mt-0.5 block text-xs text-faint">{call.hint}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-pretty text-muted">Select something on the desk, or advance the hour.</p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={() => onChange(advance(run))}>
              {run.locked ? "Advance the hour" : "Advance early"}
            </Button>
            <button type="button" className="text-sm text-faint underline-offset-4 hover:underline" onClick={onExit}>
              Abandon shift
            </button>
          </div>
          <p className="mt-3 hidden text-xs text-faint sm:block">Keys 1–4 commit a call. Enter advances the hour.</p>
        </section>
      </div>
    </div>
  );
}

function EndStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-sm text-faint">{label}</dt>
      <dd className="mt-1 font-display text-3xl tabular-nums">{value}</dd>
    </div>
  );
}
