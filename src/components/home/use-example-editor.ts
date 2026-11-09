import { useCallback, useEffect, useState } from "react";
import { EXAMPLES } from "./hero-examples";
import { useExampleRuntime } from "./use-example-runtime";

export function useExampleEditor() {
  const [interactive, setInteractive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [sources, setSources] = useState(
    EXAMPLES.map((example) => example.code),
  );
  const resume = useCallback((saved: { idx: number; sources: string[] }) => {
    setIdx(saved.idx);
    setSources(saved.sources);
  }, []);
  const { status, error, runtime, outputs, start, run, cancel } =
    useExampleRuntime(resume);
  const busy = status === "loading" || status === "running";
  let activityLabel: string | null = null;
  if (status === "loading") activityLabel = "Starting Elixir…";
  if (status === "running") activityLabel = "Running…";
  const activity = useDelayedValue(activityLabel, 350, 400);
  const cancelDelay = useDelayedValue(busy ? true : null, 3_000);

  useEffect(() => setInteractive(true), []);

  const select = (next: number) => {
    if (busy) return;
    setIdx(((next % EXAMPLES.length) + EXAMPLES.length) % EXAMPLES.length);
  };
  const changeSource = (source: string) => {
    setSources((current) =>
      current.map((value, i) => (i === idx ? source : value)),
    );
  };
  const execute = async () => {
    let instance = runtime;
    if (status !== "ready") {
      instance = await start({ idx, sources, runOnResume: true });
    }
    if (instance === null) return;
    await run(instance, idx, sources[idx]);
  };
  const retry = async () => {
    await start({ idx, sources, runOnResume: false });
  };
  return {
    example: {
      idx,
      title: EXAMPLES[idx].title,
      code: EXAMPLES[idx].code,
      source: sources[idx],
      output: outputs[idx],
    },
    runtime: {
      started: status !== "idle",
      error,
      busy,
      disabled: !interactive || busy,
      activity: activity ?? (status === "cancelled" ? "Cancelled." : ""),
      working: activity !== null,
      canCancel: busy && cancelDelay === true,
    },
    actions: {
      select,
      previous: () => select(idx - 1),
      next: () => select(idx + 1),
      changeSource,
      execute,
      retry,
      cancel,
    },
  };
}

// Shows values after delayMs; null clears them after at least minimumMs on screen.
function useDelayedValue<T>(value: T | null, delayMs: number, minimumMs = 0) {
  const [displayed, setDisplayed] = useState<{
    value: T;
    shownAt: number;
  } | null>(null);

  useEffect(() => {
    if (value !== null) {
      if (displayed?.value === value) return;
      const timer = setTimeout(() => {
        setDisplayed({ value, shownAt: performance.now() });
      }, delayMs);
      return () => clearTimeout(timer);
    }
    if (displayed === null) return;
    const remaining = Math.max(
      0,
      minimumMs - (performance.now() - displayed.shownAt),
    );
    if (remaining === 0) {
      setDisplayed(null);
      return;
    }
    const timer = setTimeout(() => setDisplayed(null), remaining);
    return () => clearTimeout(timer);
  }, [value, delayMs, minimumMs, displayed]);

  if (value === null && minimumMs === 0) return null;
  return displayed?.value ?? null;
}
