import type { Popcorn } from "@swmansion/popcorn";
import { useCallback, useEffect, useRef, useState } from "react";
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
    "idle" | "loading" | "ready" | "running" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState<Output[]>(
    EXAMPLES.map((example) => example.precanned),
  );
  const runtime = useRef<Popcorn | null>(null);
  const mounted = useRef(true);
  const evaluation = useRef<{
    idx: number;
    stdout: string;
    finished: boolean;
  } | null>(null);

  const start = useCallback(async (state: EditorState, resumed = false) => {
    setStatus("loading");
    setError("");
    runtime.current?.deinit();
    runtime.current = null;
    evaluation.current = null;
    try {
      const serializedState = JSON.stringify(state);
      const isolation = await ensureIsolation(serializedState, resumed);
      const isReloading = isolation === "reloading";
      if (isReloading || !mounted.current) return false;
      const { Popcorn } = await import("@swmansion/popcorn");
      if (!mounted.current) return false;
      const appendOutput = (text: string) => {
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
      const instance = new Popcorn({
        onStdout: appendOutput,
        onStderr: appendOutput,
        onError: (event) => {
          if (!mounted.current) return;
          console.error("Popcorn runtime stopped:", event);
          setError("Elixir stopped.");
          setStatus("error");
        },
      });
      runtime.current = instance;
      await instance.boot();
      if (!mounted.current) return false;
      setStatus((current) => (current === "error" ? current : "ready"));
      return true;
    } catch (cause) {
      runtime.current?.deinit();
      runtime.current = null;
      if (mounted.current) {
        console.error("Popcorn startup failed:", cause);
        setError("Elixir could not start.");
        setStatus("error");
      }
      return false;
    }
  }, []);

  const run = useCallback(async (idx: number, source: string) => {
    const instance = runtime.current as Popcorn;
    setStatus("running");
    const active = { idx, stdout: "", finished: false };
    evaluation.current = active;
    const result = await instance.tryCall("evaluator", ["eval", source], {
      timeoutMs: 10_000,
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
    setStatus((current) => (current === "error" ? current : "ready"));
  }, []);

  useEffect(() => {
    mounted.current = true;
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
      const ready = await start(saved, true);
      if (ready && saved.runOnResume) {
        await run(saved.idx, saved.sources[saved.idx]);
      }
    }
    resume();
    return () => {
      mounted.current = false;
      runtime.current?.deinit();
    };
  }, [onResume, start, run]);

  return { status, error, outputs, start, run };
}
