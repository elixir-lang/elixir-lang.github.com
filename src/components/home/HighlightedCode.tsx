import { Fragment, useMemo, useRef } from "react";
import type { HighlightedLine } from "@/utilities/elixir-highlight";
import { useHighlighter } from "./use-highlighter";

export default function HighlightedCode({
  source,
  originalSource,
  initialLines,
  readOnly,
  onChange,
  onRun,
}: {
  source: string;
  originalSource: string;
  initialLines: HighlightedLine[];
  readOnly: boolean;
  onChange: (source: string) => void;
  onRun: () => Promise<void>;
}) {
  const node = useRef<HTMLTextAreaElement>(null);
  const display = useRef<HTMLPreElement>(null);
  const { highlight } = useHighlighter(node, source !== originalSource);

  const lines = useMemo(() => {
    if (source === originalSource) return initialLines;
    return highlight(source);
  }, [highlight, source, originalSource, initialLines]);

  const typography =
    "min-h-52 whitespace-pre-wrap break-words px-4 py-2 font-mono text-body font-light leading-code sm:py-3";

  return (
    <div className="relative">
      <pre
        key={originalSource}
        ref={display}
        aria-hidden="true"
        className={`${typography} elixir-scrollbar max-h-80 overflow-auto text-white-10`}
      >
        {lines.map((line, li) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: tokens are stateless source text
          <Fragment key={li}>
            {li > 0 && "\n"}
            {line.map((token, ti) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: tokens are stateless source text
              <span key={ti} style={{ color: token.color }}>
                {token.text}
              </span>
            ))}
          </Fragment>
        ))}
        {"\n"}
      </pre>
      <textarea
        ref={node}
        aria-label="Elixir example code"
        readOnly={readOnly}
        value={source}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={async (event) => {
          const hasRunModifier = event.ctrlKey || event.metaKey;
          const isRunShortcut = hasRunModifier && event.key === "Enter";
          if (!isRunShortcut || readOnly) return;
          event.preventDefault();
          await onRun();
        }}
        onScroll={(event) => {
          const element = display.current as HTMLPreElement;
          element.scrollTop = event.currentTarget.scrollTop;
          element.scrollLeft = event.currentTarget.scrollLeft;
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className={`${typography} elixir-scrollbar absolute inset-0 size-full resize-none overflow-auto bg-transparent text-transparent caret-white-10 outline-none selection:bg-purple-40/25`}
      />
    </div>
  );
}
