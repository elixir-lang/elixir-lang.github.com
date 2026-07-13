#!/usr/bin/env node
/**
 * Optimize every SVG under src/assets/icons/ in place.
 * Rejects files larger than 200 KB after optimization (catches raster images
 * mistakenly committed as <svg> wrappers).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";
import config from "../svgo.config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ICONS = path.join(ROOT, "src/assets/icons");
const SIZE_LIMIT = 200 * 1024;

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile() && entry.name.endsWith(".svg")) {
      yield full;
    }
  }
}

async function main() {
  let count = 0;
  let savedBytes = 0;
  const oversized = [];

  for await (const file of walk(ICONS)) {
    const original = await fs.readFile(file, "utf-8");
    const result = optimize(original, { ...config, path: file });
    if (result.error) {
      console.error(`✗ ${path.relative(ROOT, file)}: ${result.error}`);
      process.exitCode = 1;
      continue;
    }
    if (result.data.length > SIZE_LIMIT) {
      oversized.push(`${path.relative(ROOT, file)} (${result.data.length} B)`);
    }
    if (result.data !== original) {
      await fs.writeFile(file, result.data);
      savedBytes += original.length - result.data.length;
      console.log(
        `✓ ${path.relative(ROOT, file)} (${original.length} → ${result.data.length} B)`,
      );
    }
    count++;
  }

  console.log(
    `\n${count} SVG${count === 1 ? "" : "s"} processed, ${savedBytes} B saved.`,
  );

  if (oversized.length) {
    console.error(
      `\n✗ ${oversized.length} SVG${oversized.length === 1 ? "" : "s"} exceed ${SIZE_LIMIT} bytes -- convert to AVIF/WebP or split:\n  ${oversized.join("\n  ")}`,
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
