import { useEffect, useState } from "react";
import { EXAMPLES } from "./hero-examples";

export function useExampleEditor() {
  const [interactive, setInteractive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [sources, setSources] = useState(
    EXAMPLES.map((example) => example.code),
  );
  useEffect(() => setInteractive(true), []);
  const select = (next: number) => {
    setIdx(((next % EXAMPLES.length) + EXAMPLES.length) % EXAMPLES.length);
  };
  const changeSource = (source: string) => {
    setSources((current) =>
      current.map((value, i) => (i === idx ? source : value)),
    );
  };

  return {
    example: { ...EXAMPLES[idx], idx, source: sources[idx] },
    runtime: { disabled: !interactive },
    actions: {
      select,
      previous: () => select(idx - 1),
      next: () => select(idx + 1),
      changeSource,
    },
  };
}
