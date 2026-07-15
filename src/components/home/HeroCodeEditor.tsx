import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EXAMPLES } from "@/components/home/hero-examples";
import type { HighlightedLine } from "@/utilities/elixir-highlight";
import { tokenStyle } from "@/utilities/highlight-style";

type RunStatus = "idle" | "running" | "success" | "error";
type Output = {
  value: string;
  durationMs: number;
  status: "success" | "error";
};

type PopcornCallResult =
  | { ok: true; data: unknown; durationMs: number }
  | {
      ok: false;
      error?: { code?: string; name?: string };
      durationMs?: number;
    };

type PopcornInstance = {
  call: (
    args: [string, string],
    opts: { timeoutMs: number },
  ) => Promise<PopcornCallResult>;
  registerLogListener: (
    listener: (message: string) => void,
    type: "stdout",
  ) => void;
  unregisterLogListener: (
    listener: (message: string) => void,
    type: "stdout",
  ) => void;
};

let popcornPromise: Promise<PopcornInstance | null> | null = null;
const bundleUrl = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/bundle.avm`;

function resetPopcorn() {
  popcornPromise = null;
}

async function loadPopcorn(): Promise<PopcornInstance | null> {
  if (popcornPromise) return popcornPromise;
  popcornPromise = (async () => {
    try {
      const probe = await fetch(bundleUrl, { method: "HEAD" });
      if (!probe.ok) return null;
      const mod = await import(/* @vite-ignore */ "@swmansion/popcorn");
      const Popcorn = (mod as { Popcorn?: unknown }).Popcorn ?? mod;
      // biome-ignore lint/suspicious/noExplicitAny: optional 3p shape
      const instance = await (Popcorn as any).init({
        bundlePaths: [bundleUrl],
        onStdout: () => {},
        onStderr: () => {},
      });
      return instance as PopcornInstance;
    } catch {
      return null;
    }
  })();
  return popcornPromise;
}

type Highlight = (code: string) => HighlightedLine[];

// The pristine examples are highlighted at build time (see Hero.astro),
// so shiki is only fetched once the user starts editing code.
let highlightPromise: Promise<Highlight | null> | null = null;

function loadHighlight(): Promise<Highlight | null> {
  highlightPromise ??= import("@/utilities/elixir-highlight")
    .then(async (mod) => {
      const highlighter = await mod.getElixirHighlighter();
      return (code: string) => mod.highlightElixir(highlighter, code);
    })
    .catch((error) => {
      // Drop the cached promise so the next keystroke retries.
      highlightPromise = null;
      console.error("Live syntax highlighting unavailable:", error);
      return null;
    });
  return highlightPromise;
}

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

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="4 9 8 13 14 5" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="5" x2="13" y2="13" />
      <line x1="13" y1="5" x2="5" y2="13" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block size-[14px] animate-spin rounded-full border-2 border-white/40 border-t-white"
      aria-hidden="true"
    />
  );
}

export default function HeroCodeEditor({
  highlightedExamples,
}: {
  // Per example, per line: shiki tokens produced at build time.
  highlightedExamples: HighlightedLine[][];
}) {
  const [idx, setIdx] = useState(0);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [executedCode, setExecutedCode] = useState(EXAMPLES[0].code);
  const [stdout, setStdout] = useState(EXAMPLES[0].precanned.stdout ?? "");
  const [isMac, setIsMac] = useState(false);
  const [status, setStatus] = useState<RunStatus>("success");
  const [output, setOutput] = useState<Output>({
    value: EXAMPLES[0].precanned.value,
    durationMs: 0,
    status: "success",
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const outputPaneRef = useRef<HTMLDivElement>(null);
  const stdoutListenerRef = useRef<{
    popcorn: PopcornInstance;
    listener: (message: string) => void;
  } | null>(null);
  const stdoutBufferRef = useRef("");
  const stdoutFrameRef = useRef<number | null>(null);
  // Bumped per run() so a late Popcorn result can detect it was superseded.
  const callIdRef = useRef(0);

  const clearStdoutListener = useCallback(() => {
    const active = stdoutListenerRef.current;
    if (active) {
      active.popcorn.unregisterLogListener(active.listener, "stdout");
      stdoutListenerRef.current = null;
    }
    if (stdoutFrameRef.current !== null) {
      cancelAnimationFrame(stdoutFrameRef.current);
      stdoutFrameRef.current = null;
    }
  }, []);

  const showExample = useCallback(
    (nextRaw: number) => {
      clearStdoutListener();
      ++callIdRef.current;
      const n =
        ((nextRaw % EXAMPLES.length) + EXAMPLES.length) % EXAMPLES.length;
      setIdx(n);
      setCode(EXAMPLES[n].code);
      setExecutedCode(EXAMPLES[n].code);
      setStdout(EXAMPLES[n].precanned.stdout ?? "");
      setStatus("success");
      setOutput({
        value: EXAMPLES[n].precanned.value,
        durationMs: 0,
        status: "success",
      });
    },
    [clearStdoutListener],
  );

  const run = useCallback(async () => {
    clearStdoutListener();
    const callId = ++callIdRef.current;
    setExecutedCode(code);
    setStdout("");
    setOutput({ value: "", durationMs: 0, status: "success" });
    stdoutBufferRef.current = "";
    const isStale = () => callIdRef.current !== callId;
    const finish = (
      value: string,
      durationMs: number,
      kind: "success" | "error",
    ) => {
      if (isStale()) return;
      setOutput({ value, durationMs, status: kind });
      setStatus(kind);
    };

    setStatus("running");

    const popcorn = await loadPopcorn();
    if (isStale()) return;
    if (!popcorn) {
      // Without the WASM runtime we show the example's precanned answer
      // when the code is unmodified, otherwise a friendly note.
      const example = EXAMPLES[idx];
      const matches = code.trim() === example.code.trim();
      if (matches) {
        setStdout(example.precanned.stdout ?? "");
        finish(example.precanned.value, 0, "success");
      } else {
        finish("Live evaluation is unavailable in this build.", 0, "error");
      }
      return;
    }

    const stdoutListener = (message: string) => {
      if (isStale()) return;
      stdoutBufferRef.current += message.endsWith("\n")
        ? message
        : `${message}\n`;
      if (stdoutFrameRef.current !== null) return;
      stdoutFrameRef.current = requestAnimationFrame(() => {
        stdoutFrameRef.current = null;
        if (!isStale()) setStdout(stdoutBufferRef.current);
      });
    };
    popcorn.registerLogListener(stdoutListener, "stdout");
    stdoutListenerRef.current = { popcorn, listener: stdoutListener };

    try {
      const result = await popcorn.call(["eval_elixir", code], {
        timeoutMs: 3_000,
      });
      if (isStale()) return;

      if (result.ok) {
        const text =
          typeof result.data === "string"
            ? result.data
            : JSON.stringify(result.data);
        finish(text, result.durationMs, "success");
        return;
      }

      const errCode = result.error?.code;
      const message =
        errCode === "timeout"
          ? "Evaluation timed out. Check for a syntax error or infinite loop."
          : errCode === "reload"
            ? "Couldn't evaluate that code. Check the syntax and try again."
            : `Runtime error${errCode ? ` (${errCode})` : ""}.`;
      resetPopcorn();
      finish(message, result.durationMs ?? 0, "error");
    } catch (err) {
      if (isStale()) return;
      const message = err instanceof Error ? err.message : String(err);
      resetPopcorn();
      const friendly = /PopcornInternal|"mount"|"ready"|not allowed/i.test(
        message,
      )
        ? "Runtime was reset after the previous run. Run the code again."
        : message;
      finish(friendly, 0, "error");
    }
  }, [clearStdoutListener, code, idx]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const shouldRun = e.key === "Enter" && (isMac ? e.metaKey : e.altKey);
      if (shouldRun) {
        e.preventDefault();
        run();
      }
    },
    [isMac, run],
  );

  const onEditorScroll = useCallback(
    (e: React.UIEvent<HTMLTextAreaElement>) => {
      const highlight = highlightRef.current;
      if (!highlight) return;
      highlight.scrollTop = e.currentTarget.scrollTop;
      highlight.scrollLeft = e.currentTarget.scrollLeft;
    },
    [],
  );

  useEffect(() => {
    const nav = navigator as Navigator & {
      userAgentData?: { platform?: string };
    };
    const platform = nav.userAgentData?.platform ?? nav.userAgent;
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(platform));
  }, []);

  const ensureHighlight = useCallback(() => {
    loadHighlight().then((fn) => {
      if (fn) setHighlight(() => fn);
    });
  }, []);

  const onCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCode(e.target.value);
      // Covers focus events missed around hydration and retries after
      // a failed load.
      if (!highlight) ensureHighlight();
    },
    [highlight, ensureHighlight],
  );

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const onFocus = () => {
      loadPopcorn();
      ensureHighlight();
    };
    el.addEventListener("focus", onFocus, { once: true });
    return () => {
      el.removeEventListener("focus", onFocus);
    };
  }, [ensureHighlight]);

  useEffect(() => clearStdoutListener, [clearStdoutListener]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Follow streamed and evaluated output changes.
  useEffect(() => {
    const pane = outputPaneRef.current;
    if (pane) pane.scrollTop = pane.scrollHeight;
  }, [stdout, output.value]);

  const example = EXAMPLES[idx];

  const highlightedLines = useMemo<HighlightedLine[]>(() => {
    if (code === example.code) return highlightedExamples[idx];
    if (highlight) return highlight(code);
    // Shiki is still loading (or unavailable): render the edited code
    // unstyled; it inherits the base <pre> colour.
    return code.split("\n").map((text) => [{ text }]);
  }, [code, example, idx, highlight, highlightedExamples]);

  return (
    <div className="flex w-full max-w-[544px] flex-col gap-6 [color-scheme:dark] xl:w-[544px] xl:shrink-0 xl:self-stretch xl:justify-end">
      {/* Title + prev/next row (above the editor frame) */}
      <div className="flex w-full items-center justify-between gap-4 md:gap-6">
        <p
          className="min-w-0 flex-1 font-sans text-body font-normal text-white-10 md:text-h4"
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
          <div className="flex items-center justify-between border-b border-gray-80 px-4 py-2">
            <ExampleDots
              count={EXAMPLES.length}
              activeIdx={idx}
              onSelect={showExample}
              titles={EXAMPLES.map((e) => e.title)}
            />
            <p className="font-sans text-small font-normal text-gray-40">
              Powered by{" "}
              <a
                href="https://popcorn.swmansion.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-40 underline decoration-from-font underline-offset-2 transition-colors duration-fast ease-out-quart hover:text-purple-30"
              >
                Popcorn
              </a>{" "}
              (Elixir in the browser)
            </p>
          </div>

          {/* Code editor area */}
          <label className="sr-only" htmlFor="hero-elixir-code">
            Editable Elixir code
          </label>
          <div className="relative flex min-h-52 flex-1 flex-col">
            <pre
              ref={highlightRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre-wrap break-words px-4 py-2 font-mono text-body font-light leading-[26px] text-white-10 [scrollbar-gutter:stable] sm:py-3"
            >
              {highlightedLines.map((line, li) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: pre is aria-hidden cosmetic backdrop, no React state survives a re-tokenise
                <Fragment key={li}>
                  {li > 0 && "\n"}
                  {line.map((t, ti) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: see above
                    <span key={ti} style={tokenStyle(t)}>
                      {t.text}
                    </span>
                  ))}
                </Fragment>
              ))}
              {code.endsWith("\n") && " "}
            </pre>
            <textarea
              id="hero-elixir-code"
              ref={textareaRef}
              value={code}
              onChange={onCodeChange}
              onKeyDown={onKeyDown}
              onScroll={onEditorScroll}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              placeholder="Type here..."
              className="relative block h-full w-full flex-1 resize-none whitespace-pre-wrap break-words bg-transparent px-4 py-2 font-mono text-body font-light leading-[26px] text-transparent caret-white-10 outline-none placeholder:text-white-10/70 selection:bg-purple-60/40 [scrollbar-gutter:stable] sm:py-3"
            />
          </div>

          {/* Footer: keybinding hint + status badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-80 px-4 py-3">
            <p className="inline-flex items-center gap-1.5 font-sans text-small font-normal leading-6 text-gray-40">
              <span>Press</span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-40 px-1.5 py-0.5 text-gray-40">
                <span className="font-sans text-small font-medium">
                  {isMac ? "⌘" : "Alt"}
                </span>
                <span aria-hidden="true">+</span>
                <span className="font-sans text-small font-medium">Enter</span>
              </span>
              <span>to run code.</span>
            </p>
            <StatusBadge
              status={status}
              outputStatus={output.status}
              dirty={code !== executedCode}
              onExecute={run}
            />
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3">
        <p className="font-sans text-body font-normal leading-[26px] text-white-10">
          Output
        </p>
        <div
          ref={outputPaneRef}
          className="flex max-h-80 w-full flex-col gap-2 overflow-auto"
        >
          {stdout && (
            <pre className="whitespace-pre-wrap break-words font-mono text-body font-normal leading-[26px] text-gray-20">
              {stdout}
            </pre>
          )}
          {output.value && (
            <div className="flex w-full items-start gap-2">
              <span
                className={
                  output.status === "error"
                    ? "inline-flex size-6 shrink-0 items-center justify-center text-red-400"
                    : "inline-flex size-6 shrink-0 items-center justify-center text-purple-40"
                }
                aria-hidden="true"
              >
                <ArrowIcon direction="right" />
              </span>
              <pre
                className={
                  output.status === "error"
                    ? "min-w-0 flex-1 font-mono text-lead font-normal leading-[normal] whitespace-pre-wrap break-words text-red-400"
                    : "min-w-0 flex-1 font-mono text-lead font-normal leading-[normal] whitespace-pre-wrap break-words text-purple-40"
                }
              >
                {output.value}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  outputStatus,
  dirty,
  onExecute,
}: {
  status: RunStatus;
  outputStatus: "success" | "error";
  dirty: boolean;
  onExecute: () => void;
}) {
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-80 py-1 pl-2 pr-3 font-sans text-small font-normal text-white-10">
        <Spinner />
        Running
      </span>
    );
  }
  if (dirty) {
    return (
      <button
        type="button"
        onClick={onExecute}
        className="inline-flex cursor-pointer items-center rounded-full bg-purple-70 px-3 py-1 font-sans text-small font-normal text-white transition-colors duration-fast ease-out-quart hover:bg-purple-60"
      >
        Execute
      </button>
    );
  }
  const isError =
    status === "error" || (status === "idle" && outputStatus === "error");
  if (isError) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-600/80 py-1 pl-2 pr-3 font-sans text-small font-normal text-white">
        <ErrorIcon />
        Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-purple-70 py-1 pl-2 pr-3 font-sans text-small font-normal text-white">
      <CheckIcon />
      Executed
    </span>
  );
}
