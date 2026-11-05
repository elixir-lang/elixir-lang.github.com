import type { Popcorn } from "@swmansion/popcorn";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePopcorn } from "@/hooks/use-popcorn";
import { EXAMPLES } from "./hero-examples";
import { ensureIsolation, RESUME_KEY } from "./popcorn-isolation";

type Output = {
  value?: string;
  stdout?: string;
  error?: string;
  source?: string;
  runId?: number;
};
type EditorState = { idx: number; sources: string[]; runOnResume: boolean };

export function useExampleRuntime(onResume: (state: EditorState) => void) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "running" | "cancelled"
  >("idle");
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState<Output[]>(
    EXAMPLES.map((example) => example.precanned),
  );
  const { runtime, error: failure, start: boot, stop } = usePopcorn();
  const startup = useRef<AbortController | null>(null);
  const evaluation = useRef<{
    idx: number;
    stdout: string;
    finished: boolean;
  } | null>(null);

  const start = useCallback(
    async (state: EditorState, resumed = false) => {
      startup.current?.abort();
      const attempt = new AbortController();
      startup.current = attempt;
      setStatus("loading");
      setError("");
      stop();
      evaluation.current = null;
      try {
        const serializedState = JSON.stringify(state);
        const isolation = await ensureIsolation(
          serializedState,
          resumed,
          attempt.signal,
        );
        const isReloading = isolation === "reloading";
        attempt.signal.throwIfAborted();
        if (isReloading) return null;
        const appendOutput = (text: string) => {
          if (attempt.signal.aborted) return;
          const active = evaluation.current;
          if (active === null) return;
          active.stdout = `${active.stdout}${text}`.slice(0, 16_000);
          if (!active.finished) return;
          setOutputs((current) =>
            current.map((item, i) => {
              if (i !== active.idx) return item;
              return { ...item, stdout: active.stdout };
            }),
          );
        };
        const instance = await boot({
          onStdout: appendOutput,
          onStderr: appendOutput,
        });
        if (instance === null || attempt.signal.aborted) return null;
        setStatus("ready");
        return instance;
      } catch (cause) {
        if (attempt.signal.aborted) return null;
        console.error("Popcorn startup failed:", cause);
        setError("Elixir could not start.");
        return null;
      }
    },
    [boot, stop],
  );

  const run = useCallback(
    async (instance: Popcorn, idx: number, source: string) => {
      setStatus("running");
      const active = { idx, stdout: "", finished: false };
      evaluation.current = active;
      const result = await instance.tryCall("evaluator", ["eval", source], {
        timeoutMs: 15_000,
      });
      if (!result.ok && result.error.t === "vm:exited") return;
      let reply: Output;
      if (result.ok) {
        reply = result.data as Output;
      } else {
        reply = { error: result.error.message };
      }
      active.finished = true;
      setOutputs((current) =>
        current.map((item, i) => {
          if (i !== idx) return item;
          return {
            ...reply,
            stdout: active.stdout,
            source,
            runId: (item.runId ?? 0) + 1,
          };
        }),
      );
      setStatus("ready");
    },
    [],
  );

  const cancel = useCallback(() => {
    startup.current?.abort();
    stop();
    evaluation.current = null;
    setError("");
    setStatus("cancelled");
  }, [stop]);

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
      const instance = await start(saved, true);
      if (instance !== null && saved.runOnResume) {
        await run(instance, saved.idx, saved.sources[saved.idx]);
      }
    }
    resume();
    return () => {
      startup.current?.abort();
    };
  }, [onResume, start, run]);

  let runtimeError = error;
  if (failure !== null) {
    runtimeError = "Elixir stopped.";
    if (failure.phase === "startup") {
      runtimeError = "Elixir could not start.";
    }
  }
  const visibleStatus = runtimeError === "" ? status : "error";

  return {
    status: visibleStatus,
    error: runtimeError,
    runtime,
    outputs,
    start,
    run,
    cancel,
  };
}
