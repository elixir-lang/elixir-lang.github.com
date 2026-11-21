export const RESUME_KEY = "popcorn:resume";

const ISOLATION_FAILED =
  "Your browser could not enable the Elixir runtime. Try a browser with SharedArrayBuffer support.";
const SERVICE_WORKER_REQUIRED =
  "The Elixir runtime needs HTTPS and a browser with service worker support.";
const ISOLATION_TIMEOUT =
  "Could not enable the Elixir runtime. Please try again.";

export async function ensureIsolation(
  resume: string,
  resumed: boolean,
  signal: AbortSignal,
): Promise<"ready" | "reloading"> {
  if (crossOriginIsolated) return "ready";
  if (resumed) {
    throw new Error(ISOLATION_FAILED);
  }
  const hasServiceWorker = navigator.serviceWorker !== undefined;
  if (!isSecureContext || !hasServiceWorker) {
    throw new Error(SERVICE_WORKER_REQUIRED);
  }

  await navigator.serviceWorker.register(
    `${import.meta.env.BASE_URL}coi-serviceworker.js`,
  );
  await navigator.serviceWorker.ready;
  if (navigator.serviceWorker.controller === null) {
    await new Promise<void>((resolve, reject) => {
      const changed = () => {
        clearTimeout(timeout);
        resolve();
      };
      const timeout = setTimeout(() => {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          changed,
        );
        reject(new Error(ISOLATION_TIMEOUT));
      }, 10_000);
      navigator.serviceWorker.addEventListener("controllerchange", changed, {
        once: true,
      });
    });
  }

  signal.throwIfAborted();
  sessionStorage.setItem(RESUME_KEY, resume);
  location.reload();
  return "reloading";
}
