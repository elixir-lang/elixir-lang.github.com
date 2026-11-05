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
  const { status, error, outputs, start, run, cancel } =
    useExampleRuntime(resume);
  const busy = status === "loading" || status === "running";
  const [canCancel, setCanCancel] = useState(false);
  const [activity, setActivity] = useState<{
    kind: "loading" | "running";
    shownAt: number;
  } | null>(null);

  useEffect(() => setInteractive(true), []);
  useEffect(() => {
    setCanCancel(false);
    if (!busy) return;
    const timer = setTimeout(() => setCanCancel(true), 3_000);
    return () => clearTimeout(timer);
  }, [busy]);
  useEffect(() => {
    if (status === "loading" || status === "running") {
      if (activity?.kind === status) return;
      const timer = setTimeout(() => {
        setActivity({ kind: status, shownAt: performance.now() });
      }, 350);
      return () => clearTimeout(timer);
    }
    if (activity === null) return;
    const remaining = Math.max(0, 400 - (performance.now() - activity.shownAt));
    const timer = setTimeout(() => setActivity(null), remaining);
    return () => clearTimeout(timer);
  }, [status, activity]);

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
    if (status !== "ready") {
      const ready = await start({ idx, sources, runOnResume: true });
      if (!ready) return;
    }
    await run(idx, sources[idx]);
  };
  const retry = async () => {
    await start({ idx, sources, runOnResume: false });
  };
  let activityLabel = status === "cancelled" ? "Cancelled." : "";
  if (activity?.kind === "loading") {
    activityLabel = "Starting Elixir…";
  }
  if (activity?.kind === "running") {
    activityLabel = "Running…";
  }

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
      canCancel: busy && canCancel,
      disabled: !interactive || busy,
      activity: activityLabel,
      working: activity !== null,
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
