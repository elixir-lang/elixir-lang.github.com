import type { Popcorn, PopcornOpts } from "@swmansion/popcorn";
import { useCallback, useEffect, useRef, useState } from "react";

export function usePopcorn() {
  const [state, setState] = useState<{
    status: "idle" | "loading" | "ready" | "error";
    runtime: Popcorn | null;
    error: { phase: "startup" | "runtime"; cause: unknown } | null;
  }>({ status: "idle", runtime: null, error: null });
  const session = useRef<{
    controller: AbortController;
    runtime: Popcorn | null;
  } | null>(null);

  const dispose = useCallback(() => {
    session.current?.controller.abort();
    session.current?.runtime?.deinit();
    session.current = null;
  }, []);

  const stop = useCallback(() => {
    dispose();
    setState({ status: "idle", runtime: null, error: null });
  }, [dispose]);

  const start = useCallback(
    async (options: PopcornOpts = {}) => {
      stop();
      const attempt = {
        controller: new AbortController(),
        runtime: null as Popcorn | null,
      };
      session.current = attempt;
      const { signal } = attempt.controller;
      setState({ status: "loading", runtime: null, error: null });
      try {
        const { Popcorn } = await import("@swmansion/popcorn");
        if (signal.aborted) return null;
        const instance = new Popcorn({
          ...options,
          onError: (cause) => {
            if (signal.aborted) return;
            setState({
              status: "error",
              runtime: null,
              error: { phase: "runtime", cause },
            });
            if (options.onError !== undefined) {
              options.onError(cause);
            } else {
              console.error("Popcorn runtime stopped:", cause);
            }
          },
        });
        attempt.runtime = instance;
        await instance.boot();
        if (signal.aborted) return null;
        setState({ status: "ready", runtime: instance, error: null });
        return instance;
      } catch (cause) {
        if (signal.aborted) return null;
        dispose();
        console.error("Popcorn startup failed:", cause);
        setState({
          status: "error",
          runtime: null,
          error: { phase: "startup", cause },
        });
        return null;
      }
    },
    [dispose, stop],
  );

  useEffect(() => dispose, [dispose]);

  return { ...state, start, stop };
}
