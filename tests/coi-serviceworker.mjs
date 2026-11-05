import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

test("service-worker responses", async () => {
  const listeners = new Map();
  const worker = {
    self: {
      addEventListener: (name, listener) => listeners.set(name, listener),
    },
    fetch: () => Promise.reject(new TypeError("Network request failed")),
    Response,
    Headers,
    Request,
    console,
  };
  runInNewContext(readFileSync("public/coi-serviceworker.js", "utf8"), worker);

  let response;
  const event = {
    request: new Request("https://example.test/asset"),
    respondWith: (result) => {
      response = result;
    },
  };
  listeners.get("fetch")(event);
  const failed = await response;
  assert(failed instanceof Response);
  assert.equal(failed.type, "error");

  worker.fetch = () => Promise.resolve(new Response("asset"));
  listeners.get("fetch")(event);
  const served = await response;
  assert.equal(await served.text(), "asset");
  assert.equal(served.headers.get("Cross-Origin-Opener-Policy"), "same-origin");
  assert.equal(
    served.headers.get("Cross-Origin-Embedder-Policy"),
    "require-corp",
  );
});
