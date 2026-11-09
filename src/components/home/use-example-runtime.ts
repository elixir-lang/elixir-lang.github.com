import type { Popcorn, PopcornOpts } from "@swmansion/popcorn";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { assert } from "@/utilities/assert";
import { EXAMPLES } from "./hero-examples";
import { ensureIsolation, RESUME_KEY } from "./popcorn-isolation";

const ERROR_MESSAGES = {
  startup: "Elixir could not start.",
  runtime: "Elixir stopped.",
};

type Result = { value?: string; error?: string };
type EditorState = { idx: number; sources: string[]; runOnResume: boolean };
type RuntimeState =
  | { status: "idle" | "loading" | "cancelled" }
  | { status: "ready" | "running"; runtime: Popcorn }
  | { status: "error"; phase: "startup" | "runtime" };
type RuntimeEvent =
  | { type: "start" | "run" | "complete" | "cancel" | "fail" }
  | { type: "booted"; runtime: Popcorn };

function transition(state: RuntimeState, event: RuntimeEvent): RuntimeState {
  switch (event.type) {
    case "start":
      return { status: "loading" };
    case "booted":
      assert(state.status === "loading");
      return { status: "ready", runtime: event.runtime };
    case "run":
      assert(state.status === "ready");
      return { status: "running", runtime: state.runtime };
    case "complete":
      assert(state.status === "running");
      return { status: "ready", runtime: state.runtime };
    case "cancel":
      return { status: "cancelled" };
    case "fail":
      return {
        status: "error",
        phase: state.status === "loading" ? "startup" : "runtime",
      };
  }
}

export function useExampleRuntime(onResume: (state: EditorState) => void) {
  const [state, dispatch] = useReducer(transition, { status: "idle" });
  const { outputs, begin, append, complete, clear } = useRunOutputs<Result>(
    EXAMPLES.map((example) => example.precanned),
  );
  const controller = useRef<ReturnType<typeof createPopcornController> | null>(
    null,
  );

  const dispose = useCallback(() => {
    clear();
    controller.current?.dispose();
    controller.current = null;
  }, [clear]);

  const start = useCallback(
    async (editor: EditorState, resumed = false) => {
      dispose();
      dispatch({ type: "start" });
      const attempt = createPopcornController({
        onStdout: appendOutput,
        onStderr: appendOutput,
        onError(cause) {
          clear();
          console.error("Popcorn runtime stopped:", cause);
          dispatch({ type: "fail" });
        },
      });
      controller.current = attempt;

      function appendOutput(text: string) {
        if (!attempt.signal.aborted) append(text);
      }

      try {
        const isolation = await ensureIsolation(
          JSON.stringify(editor),
          resumed,
          attempt.signal,
        );
        attempt.signal.throwIfAborted();
        if (isolation === "reloading") return null;
        const runtime = await attempt.boot();
        attempt.signal.throwIfAborted();
        dispatch({ type: "booted", runtime });
        return runtime;
      } catch (cause) {
        if (attempt.signal.aborted) return null;
        dispose();
        console.error("Popcorn startup failed:", cause);
        dispatch({ type: "fail" });
        return null;
      }
    },
    [dispose, append, clear],
  );

  const run = useCallback(
    async (runtime: Popcorn, idx: number, source: string) => {
      dispatch({ type: "run" });
      const active = begin(idx, source);
      const result = await runtime.tryCall("evaluator", ["eval", source], {
        timeoutMs: 15_000,
      });
      if (!result.ok && result.error.t === "vm:exited") return;
      const reply = result.ok
        ? (result.data as Result)
        : { error: result.error.message };
      if (complete(active, reply)) dispatch({ type: "complete" });
    },
    [begin, complete],
  );

  const cancel = useCallback(() => {
    dispose();
    dispatch({ type: "cancel" });
  }, [dispose]);

  useEffect(() => {
    async function resume() {
      let saved: EditorState;
      try {
        const pending = sessionStorage.getItem(RESUME_KEY);
        if (pending === null) return;
        sessionStorage.removeItem(RESUME_KEY);
        saved = JSON.parse(pending) as EditorState;
      } catch {
        return;
      }
      onResume(saved);
      const runtime = await start(saved, true);
      if (runtime !== null && saved.runOnResume) {
        await run(runtime, saved.idx, saved.sources[saved.idx]);
      }
    }
    resume();
    return dispose;
  }, [onResume, start, run, dispose]);

  let error = "";
  if (state.status === "error") {
    error = ERROR_MESSAGES[state.phase];
  }
  const runtime =
    state.status === "ready" || state.status === "running"
      ? state.runtime
      : null;

  return { status: state.status, error, runtime, outputs, start, run, cancel };
}

type Run = {
  idx: number;
  source: string;
  stdout: string;
  finished: boolean;
};

type RunOutput<Result> = Result & {
  stdout?: string;
  source?: string;
  runId?: number;
};

function useRunOutputs<Result>(initialOutputs: RunOutput<Result>[]) {
  const [outputs, setOutputs] = useState(initialOutputs);
  const currentRun = useRef<Run | null>(null);

  const clear = useCallback(() => {
    currentRun.current = null;
  }, []);

  const begin = useCallback((idx: number, source: string) => {
    const run = { idx, source, stdout: "", finished: false };
    currentRun.current = run;
    return run;
  }, []);

  const append = useCallback((text: string) => {
    const run = currentRun.current;
    if (run === null) return;
    run.stdout = `${run.stdout}${text}`.slice(0, 16_000);
    if (!run.finished) return;
    const stdout = run.stdout;
    setOutputs((current) =>
      current.map((item, idx) =>
        idx === run.idx ? { ...item, stdout } : item,
      ),
    );
  }, []);

  const complete = useCallback((run: Run, result: Result) => {
    if (currentRun.current !== run) return false;
    run.finished = true;
    const output = { ...result, source: run.source, stdout: run.stdout };
    setOutputs((current) =>
      current.map((item, idx) => {
        if (idx !== run.idx) return item;
        return { ...output, runId: (item.runId ?? 0) + 1 };
      }),
    );
    return true;
  }, []);

  return { outputs, begin, append, complete, clear };
}

function createPopcornController(options: PopcornOpts) {
  const abortController = new AbortController();
  const { signal } = abortController;
  let runtime: Popcorn | null = null;

  function dispose() {
    abortController.abort();
    runtime?.deinit();
    runtime = null;
  }

  async function boot() {
    const { Popcorn } = await import("@swmansion/popcorn");
    signal.throwIfAborted();
    const instance = new Popcorn({
      ...options,
      onError(cause) {
        if (signal.aborted) return;
        runtime = null;
        abortController.abort();
        if (options.onError !== undefined) {
          options.onError(cause);
        } else {
          console.error("Popcorn runtime stopped:", cause);
        }
      },
    });
    runtime = instance;
    await instance.boot();
    signal.throwIfAborted();
    return instance;
  }

  return { signal, boot, dispose };
}
