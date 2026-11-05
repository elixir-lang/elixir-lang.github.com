import { type RefObject, useEffect, useState } from "react";
import type { HighlightedLine } from "@/utilities/elixir-highlight";

export function useHighlighter(
  node: RefObject<HTMLTextAreaElement | null>,
  changed = false,
) {
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState<
    (code: string) => HighlightedLine[]
  >(() => (code: string) => [[{ text: code }]]);
  const needsHighlighter = focused || changed;

  useEffect(() => {
    const element = node.current as HTMLTextAreaElement;
    const focus = () => setFocused(true);
    element.addEventListener("focus", focus, { once: true });
    return () => element.removeEventListener("focus", focus);
  }, [node]);

  useEffect(() => {
    if (!needsHighlighter) return;
    let active = true;
    async function load() {
      const module = await import("@/utilities/elixir-highlight");
      const highlighter = await module.getElixirHighlighter();
      if (active) {
        setHighlight(
          () => (code: string) => module.highlightElixir(highlighter, code),
        );
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [needsHighlighter]);

  return { highlight };
}
