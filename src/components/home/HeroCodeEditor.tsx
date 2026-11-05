import popcornLogo from "@/assets/icons/popcorn.svg?url";
import { EXAMPLES } from "@/components/home/hero-examples";
import { useExampleEditor } from "@/components/home/use-example-editor";
import { useResultAnimation } from "@/components/home/use-result-animation";
import type { HighlightedLine } from "@/utilities/elixir-highlight";
import HighlightedCode from "./HighlightedCode";

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
  activeIdx,
  onSelect,
  disabled,
}: {
  activeIdx: number;
  onSelect: (i: number) => void;
  disabled: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2"
      role="tablist"
      aria-label="Code examples"
    >
      {EXAMPLES.map(({ title }, i) => {
        const active = i === activeIdx;
        let background = "bg-gray-60 hover:bg-gray-40";
        if (active) {
          background = "bg-white-10";
        }
        return (
          <button
            key={title}
            type="button"
            role="tab"
            aria-selected={active}
            aria-current={active ? "true" : undefined}
            aria-label={`Example ${i + 1}: ${title}`}
            onClick={() => onSelect(i)}
            disabled={disabled}
            className={`size-2.5 cursor-pointer rounded-full outline-none transition-colors duration-fast ease-out-quart focus-visible:ring-2 focus-visible:ring-purple-40 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${background}`}
          />
        );
      })}
    </div>
  );
}

function RuntimeFeedback({
  runtime,
  onRetry,
}: {
  runtime: ReturnType<typeof useExampleEditor>["runtime"];
  onRetry: () => Promise<void>;
}) {
  const { activity, error, started, working } = runtime;
  const hasError = error !== "";
  let feedback = (
    <output aria-label="Elixir runtime status" className="truncate">
      {activity}
    </output>
  );
  if (hasError) {
    feedback = (
      <>
        <p role="alert" className="min-w-0 text-orange-50">
          {error}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 cursor-pointer rounded-xs px-1 text-white-10 hover:text-purple-40 focus-visible:outline-2 focus-visible:outline-purple-40"
        >
          Retry
        </button>
      </>
    );
  }

  return (
    <div className="relative flex min-h-10 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-gray-80 px-4 py-2 text-small text-gray-20">
      {working && !hasError && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-px h-0.5 overflow-hidden"
        >
          <span className="block h-full w-1/3 bg-purple-40 animate-popcorn-busy" />
        </span>
      )}
      <div className="flex min-w-0 items-center gap-3">{feedback}</div>
      {started && (
        <a
          href="https://popcorn.swmansion.com/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xs text-micro sm:text-caption transition-colors duration-base hover:text-white-10 focus-visible:outline-2 focus-visible:outline-purple-40"
        >
          <img
            src={popcornLogo}
            alt=""
            className="h-3.5 w-2 brightness-0 sm:h-4 sm:w-2.5 invert motion-safe:animate-popcorn-enter"
          />
          Powered by Popcorn
        </a>
      )}
    </div>
  );
}

function ExampleOutput({
  example,
  runtimeError,
}: {
  example: ReturnType<typeof useExampleEditor>["example"];
  runtimeError: string;
}) {
  const { idx, source, output } = example;
  const preview = output.source !== source;
  const hasError = (output.error ?? "") !== "" && runtimeError === "";
  const hasValue = (output.value ?? "") !== "";
  const hasStdout = (output.stdout ?? "") !== "";
  let previewBorder = "border-transparent";
  if (preview) {
    previewBorder = "border-dashed border-gray-60";
  }
  const resultColor = preview ? "text-gray-20" : "text-purple-40";
  let runKey = null;
  if (hasValue && !preview && output.runId !== undefined) {
    runKey = `${idx}-${output.runId}`;
  }
  const arrow = useResultAnimation(runKey);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-sans text-body leading-code text-white-10">Output</h2>
      <div
        className={`elixir-scrollbar flex max-h-80 flex-col gap-3 overflow-auto border-l pl-3 ${previewBorder}`}
      >
        {preview && (
          <span className="sr-only">
            Preview output. Run the code to update it.
          </span>
        )}
        {hasError && (
          <pre
            role="alert"
            className="whitespace-pre-wrap break-words font-mono text-small text-orange-50"
          >
            {output.error}
          </pre>
        )}
        {hasValue && (
          <figure
            aria-label="Result"
            className={`flex items-start gap-2 ${resultColor}`}
          >
            <span
              ref={arrow}
              key={`${idx}-${output.runId ?? 0}`}
              aria-hidden="true"
              className="inline-flex size-6 shrink-0 items-center justify-center"
            >
              <ArrowIcon direction="right" />
            </span>
            <pre className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-body md:text-lead">
              {output.value}
            </pre>
          </figure>
        )}
      </div>
      {hasStdout && (
        <figure aria-label="Standard output" className="flex flex-col gap-3">
          <figcaption>
            <h2 className="font-sans text-body leading-code text-white-10">
              Standard output
            </h2>
          </figcaption>
          <pre
            className={`elixir-scrollbar max-h-40 overflow-auto whitespace-pre-wrap break-words border-l pl-3 font-mono text-body text-gray-20 md:text-lead ${previewBorder}`}
          >
            {output.stdout}
          </pre>
        </figure>
      )}
    </div>
  );
}

export default function HeroCodeEditor({
  highlightedExamples,
}: {
  highlightedExamples: HighlightedLine[][];
}) {
  const { example, runtime, actions } = useExampleEditor();

  return (
    <div className="flex flex-col gap-6 [color-scheme:dark]">
      <div className="flex items-center justify-between gap-4 md:gap-6">
        <p
          className="min-w-0 flex-1 text-lead text-white-10"
          aria-live="polite"
        >
          {example.title}
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={actions.previous}
            disabled={runtime.disabled}
            aria-label="Previous example"
            className="inline-flex size-12 cursor-pointer items-center justify-center rounded-sm border border-gray-40 text-white-10 outline-none transition duration-base ease-out-quart hover:scale-[1.02] hover:border-purple-60 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-purple-50 active:scale-[0.98]"
          >
            <ArrowIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={actions.next}
            disabled={runtime.disabled}
            aria-label="Next example"
            className="inline-flex size-12 cursor-pointer items-center justify-center rounded-sm border border-gray-40 text-white-10 outline-none transition duration-base ease-out-quart hover:scale-[1.02] hover:border-purple-60 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-purple-50 active:scale-[0.98]"
          >
            <ArrowIcon direction="right" />
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-purple-60 p-1.5">
        <div
          className="flex flex-col overflow-hidden rounded-md bg-black"
          aria-busy={runtime.busy}
        >
          <div className="flex h-12 items-center justify-between border-b border-gray-80 px-4 py-2">
            <ExampleDots
              activeIdx={example.idx}
              onSelect={actions.select}
              disabled={runtime.disabled}
            />
            <button
              type="button"
              disabled={runtime.disabled}
              onClick={actions.execute}
              className="h-8 min-w-14 cursor-pointer rounded-xs bg-purple-60 px-3 text-small text-white-10 hover:bg-purple-70 focus-visible:outline-2 focus-visible:outline-purple-40 disabled:cursor-wait disabled:opacity-50"
            >
              Run
            </button>
          </div>

          <HighlightedCode
            source={example.source}
            originalSource={example.code}
            initialLines={highlightedExamples[example.idx]}
            readOnly={runtime.disabled}
            onChange={actions.changeSource}
            onRun={actions.execute}
          />
          <RuntimeFeedback runtime={runtime} onRetry={actions.retry} />
        </div>
      </div>

      <ExampleOutput example={example} runtimeError={runtime.error} />
    </div>
  );
}
