import { useState } from "react";
import { EXAMPLES } from "./hero-examples";

export function useExampleEditor() {
  const [idx, setIdx] = useState(0);
  const select = (next: number) => {
    setIdx(((next % EXAMPLES.length) + EXAMPLES.length) % EXAMPLES.length);
  };

  return {
    example: { ...EXAMPLES[idx], idx },
    actions: {
      select,
      previous: () => select(idx - 1),
      next: () => select(idx + 1),
    },
  };
}
