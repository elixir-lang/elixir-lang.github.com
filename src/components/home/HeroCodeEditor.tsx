import { Fragment, useState } from "react";
import { EXAMPLES } from "@/components/home/hero-examples";
import type { HighlightedLine } from "@/utilities/elixir-highlight";
import { tokenStyle } from "@/utilities/highlight-style";

function ArrowIcon({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={direction === "left" ? "-scale-x-100" : undefined}
    >
      <path
        d="M4.16669 10H15.8334M15.8334 10L10.8334 5M15.8334 10L10.8334 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExampleDots({
  count,
  activeIdx,
  onSelect,
  titles,
}: {
  count: number;
  activeIdx: number;
  onSelect: (i: number) => void;
  titles: string[];
}) {
  return (
    <div
      className="flex items-center gap-2"
      role="tablist"
      aria-label="Code examples"
    >
      {titles.slice(0, count).map((title, i) => {
        const active = i === activeIdx;
        return (
          <button
            key={title}
            type="button"
            role="tab"
            aria-selected={active}
            aria-current={active ? "true" : undefined}
            aria-label={`Example ${i + 1}: ${title}`}
            onClick={() => onSelect(i)}
            className={
              active
                ? "size-2.5 shrink-0 cursor-pointer rounded-full bg-white-10 outline-none transition-colors duration-fast ease-out-quart focus-visible:ring-2 focus-visible:ring-purple-40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                : "size-2.5 shrink-0 cursor-pointer rounded-full bg-gray-60 outline-none transition-colors duration-fast ease-out-quart hover:bg-gray-40 focus-visible:ring-2 focus-visible:ring-purple-40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            }
          />
        );
      })}
    </div>
  );
}

export default function HeroCodeEditor({
  highlightedExamples,
}: {
  // Per example, per line: shiki tokens produced at build time.
  highlightedExamples: HighlightedLine[][];
}) {
  const [idx, setIdx] = useState(0);
  const example = EXAMPLES[idx];
  const highlightedLines = highlightedExamples[idx];
  const showExample = (nextRaw: number) => {
    const next =
      ((nextRaw % EXAMPLES.length) + EXAMPLES.length) % EXAMPLES.length;
    setIdx(next);
  };

  return (
    <div className="flex w-full max-w-[544px] flex-col gap-6 [color-scheme:dark] xl:w-[544px] xl:shrink-0 xl:self-stretch xl:justify-end">
      {/* Title + prev/next row (above the editor frame) */}
      <div className="flex w-full items-center justify-between gap-4 md:gap-6">
        <p
          className="min-w-0 flex-1 font-sans text-body font-normal text-white-10 text-xl"
          aria-live="polite"
        >
          {example.title}
        </p>
        <div className="flex shrink-0 items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => showExample(idx - 1)}
            aria-label="Previous example"
            className="inline-flex size-12 cursor-pointer items-center justify-center rounded-sm border border-gray-40 text-white-10 outline-none transition-all duration-base ease-out-quart will-change-transform hover:scale-[1.02] hover:border-purple-60 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-purple-50 active:scale-[0.98]"
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={() => showExample(idx + 1)}
            aria-label="Next example"
            className="inline-flex size-12 cursor-pointer items-center justify-center rounded-sm border border-gray-40 text-white-10 outline-none transition-all duration-base ease-out-quart will-change-transform hover:scale-[1.02] hover:border-purple-60 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-purple-50 active:scale-[0.98]"
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>

      {/* Editor frame */}
      <div className="w-full rounded-[22px] bg-purple-60 p-1.5">
        <div className="flex flex-col overflow-hidden rounded-2xl bg-black">
          <div className="flex min-h-10 items-center border-b border-gray-80 px-4 py-2">
            <ExampleDots
              count={EXAMPLES.length}
              activeIdx={idx}
              onSelect={showExample}
              titles={EXAMPLES.map((e) => e.title)}
            />
          </div>

          <pre className="m-0 min-h-52 overflow-hidden whitespace-pre-wrap break-words px-4 py-2 font-mono text-body font-light leading-[26px] text-white-10 sm:py-3">
            {highlightedLines.map((line, li) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static highlighted lines have no stateful children
              <Fragment key={li}>
                {li > 0 && "\n"}
                {line.map((token, ti) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: see above
                  <span key={ti} style={tokenStyle(token)}>
                    {token.text}
                  </span>
                ))}
              </Fragment>
            ))}
          </pre>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3">
        <p className="font-sans text-body font-normal leading-[26px] text-white-10">
          Output
        </p>
        <div className="flex max-h-80 w-full flex-col gap-2 overflow-auto">
          {example.precanned.stdout && (
            <pre className="whitespace-pre-wrap break-words font-mono text-small font-normal text-gray-20 md:text-body">
              {example.precanned.stdout}
            </pre>
          )}
          {example.precanned.value && (
            <div className="flex w-full items-start gap-2">
              <span
                className="inline-flex size-6 shrink-0 items-center justify-center text-purple-40"
                aria-hidden="true"
              >
                <ArrowIcon direction="right" />
              </span>
              <pre className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-body font-normal text-purple-40 md:text-lead">
                {example.precanned.value}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
