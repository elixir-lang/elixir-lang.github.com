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
  const { status, error, outputs, start, run } = useExampleRuntime(resume);
  const busy = status === "loading" || status === "running";

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
    if (status !== "ready") {
      const ready = await start({ idx, sources, runOnResume: true });
      if (!ready) return;
    }
    await run(idx, sources[idx]);
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
      error,
      busy,
      disabled: !interactive || busy,
    },
    actions: {
      select,
      previous: () => select(idx - 1),
      next: () => select(idx + 1),
      changeSource,
      execute,
      retry,
    },
  };
}
