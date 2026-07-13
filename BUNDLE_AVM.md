# Popcorn WASM bundle

The homepage hero ships an interactive Elixir editor backed by
[Software Mansion's Popcorn](https://github.com/software-mansion/popcorn),
which compiles AtomVM + an Elixir handler module to WebAssembly.

The runtime is loaded from `public/bundle.avm` and served beneath Astro's
configured base path. The file is ~7 MB and **is committed** to the repo so
cloning gives you a working interactive demo out of the box.

When `public/bundle.avm` is missing the editor still works: it loads the
example snippets and shows their precanned outputs, and `astro.config.ts`
skips registering the Popcorn Vite plugin. Drop a valid `bundle.avm`
back into `public/` and the live runtime turns on automatically — no
code changes needed.

## How to regenerate `bundle.avm`

Popcorn v0.3.0 hard-pins **OTP 26.0.2** and **Elixir 1.17.3**. macOS
ships much newer toolchains, so the safest way to reproduce the build
is a one-shot Docker container.

1. Clone the Popcorn repository (anywhere on disk):

   ```bash
   git clone https://github.com/software-mansion/popcorn.git ~/popcorn
   ```

2. From the elixir-website repo root, run the pinned-toolchain build:

   ```bash
   docker run --rm \
     -v "$HOME/popcorn:/popcorn" \
     -v "$PWD/public:/out" \
     -w /popcorn/examples/eval-in-wasm \
     -e MIX_HOME=/tmp/.mix -e HEX_HOME=/tmp/.hex \
     -e LANG=C.UTF-8 -e LC_ALL=C.UTF-8 -e ELIXIR_ERL_OPTIONS="+fnu" \
     erlang:26.0.2-slim bash -lc '
       set -euo pipefail
       apt-get update -qq && apt-get install -y -qq curl unzip git ca-certificates >/dev/null
       curl -fsSL -o /tmp/elixir.zip https://github.com/elixir-lang/elixir/releases/download/v1.17.3/elixir-otp-26.zip
       mkdir -p /opt/elixir && unzip -q /tmp/elixir.zip -d /opt/elixir
       export PATH=/opt/elixir/bin:$PATH
       mix local.hex --force >/dev/null && mix local.rebar --force >/dev/null
       mix deps.get
       mix popcorn.cook
       cp dist/wasm/bundle.avm /out/bundle.avm
     '
   ```

3. The rebuilt `bundle.avm` lands at `public/bundle.avm`. Commit it
   when the upstream Popcorn version changes or the handler module is
   updated.

## How the editor wires up

- The Vite plugin (`@swmansion/popcorn/vite`) is registered
  conditionally in `astro.config.ts` — only when `public/bundle.avm`
  exists. It excludes Popcorn from Vite's dep prebundling (so the
  internal worker iframe import resolves) and serves the bundle with
  the SharedArrayBuffer-required headers in dev/preview.
- GitHub Pages uses `public/coi-serviceworker.js` to provide the cross-origin
  isolation headers that the static host cannot configure itself.
- The hero React island (`src/components/home/HeroCodeEditor.tsx`)
  HEAD-probes the base-path-aware bundle URL; if the response is 200, it
  dynamically imports `@swmansion/popcorn` and calls
  `popcorn.call(["eval_elixir", code], { timeoutMs: 10_000 })`. If
  anything fails it falls back to the precanned output for the active
  example.

## Notes

- Popcorn v0.3.0 is described upstream as "early stages — may break";
  the graceful fallback keeps the page demoable if the runtime fails
  to boot for any reason.
- The handler action name is `eval_elixir`. If you customise the
  example Mix app (see `~/popcorn/examples/eval-in-wasm/lib/eval_in_wasm.ex`),
  keep the action name in sync with `HeroCodeEditor.tsx`.
- The bundle includes the full Elixir + stdlib + logger BEAM files for
  the WASM target — that's why it weighs ~7 MB.
