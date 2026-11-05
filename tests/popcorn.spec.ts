import { expect, test } from "@playwright/test";

test.describe("homepage examples", () => {
  test.setTimeout(90_000);

  test("loads only on Run and preserves edits across isolation and examples", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (/\/otp\/|worker-|\.wasm/.test(request.url())) {
        requests.push(request.url());
      }
    });
    await page.goto("/");
    const code = page.getByRole("textbox", { name: "Elixir example code" });
    const run = page.getByRole("button", { name: "Run", exact: true });
    const result = page
      .getByRole("figure", { name: "Result", exact: true })
      .locator("pre");
    await expect(code).toBeEditable();
    await expect(code).not.toBeFocused();
    await page.getByRole("button", { name: "Next example" }).click();
    await code.fill((await code.inputValue()).replace('"42px"', '"43px"'));
    expect(requests).toEqual([]);
    expect(
      await page.evaluate(() => navigator.serviceWorker.controller),
    ).toBeNull();
    await code.press("Meta+Enter");
    await expect(result).toHaveText("{:pixels, 43}", { timeout: 75_000 });
    await expect(code).toHaveValue(/Integer.parse\("43px"\)/);
    await expect(code).not.toBeFocused();
    const display = code.locator("..").locator("pre");
    await expect(display).toHaveText(await code.inputValue());
    await expect
      .poll(() =>
        display
          .locator("span")
          .evaluateAll(
            (tokens) =>
              new Set(tokens.map((token) => getComputedStyle(token).color))
                .size,
          ),
      )
      .toBeGreaterThan(1);
    expect(
      await page.evaluate(
        () =>
          crossOriginIsolated && new SharedArrayBuffer(16).byteLength === 16,
      ),
    ).toBe(true);
    expect(requests.length).toBeGreaterThan(0);
    await expect(
      page.getByRole("link", { name: "Powered by Popcorn", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Next example" }).click();
    await run.click();
    await expect(
      page.getByRole("figure", { name: "Standard output" }).locator("pre"),
    ).not.toBeEmpty();
    await expect(run).toBeEnabled();
    await page.getByRole("button", { name: "Next example" }).click();
    await run.click();
    await expect(result).toHaveText('"Hello Joe"');
    await page.getByRole("button", { name: "Next example" }).click();
    await run.click();
    await expect(result).toContainText('"delightful" => 1');
    await page.getByRole("button", { name: "Next example" }).click();
    await expect(code).toHaveValue(/Integer.parse\("43px"\)/);

    const menu = page.getByRole("button", { name: "Open menu" });
    const menuIsVisible = await menu.isVisible();
    if (menuIsVisible) {
      await menu.click();
    }
    await page.getByRole("link", { name: "Docs", exact: true }).first().click();
    await page.goto("/");
    await expect(run).toBeEnabled();
    await expect(code).not.toBeFocused();
    await expect(
      page.getByRole("status", { name: "Elixir runtime status" }),
    ).toBeEmpty();
  });

  test("retains previous output during execution and separates stdout", async ({
    page,
  }) => {
    await page.goto("/");
    const code = page.getByRole("textbox", { name: "Elixir example code" });
    const run = page.getByRole("button", { name: "Run", exact: true });
    const result = page
      .getByRole("figure", { name: "Result", exact: true })
      .locator("pre");
    const activity = page.getByRole("status", {
      name: "Elixir runtime status",
    });
    await code.fill('IO.puts("hello")\n21 * 2');
    await run.click();
    await expect(result).toHaveText("42", { timeout: 75_000 });
    const stdout = page.getByRole("figure", { name: "Standard output" });
    await expect(stdout.locator("pre")).toHaveText("hello");
    await expect(activity).toBeEmpty();
    await code.fill("Process.sleep(1_000)\n43");
    await code.press("Control+Enter");
    await expect(result).toHaveText("42");
    await expect(activity).toHaveText("Running…");
    await expect(result).toHaveText("43");
    await expect(activity).toBeEmpty();
    await expect(stdout).toHaveCount(0);
  });

  test("shows loading on a stalled download and resumes after release", async ({
    page,
    context,
  }) => {
    let pulses = 0;
    page.on("console", (message) => {
      if (message.text() === "Result pulse") {
        pulses++;
      }
    });
    await page.addInitScript(() => {
      document.addEventListener("animationstart", (event) => {
        if (event.animationName === "popcorn-result") {
          console.log("Result pulse");
        }
      });
    });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await context.route("**/worker-*.js", async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto("/");
    const code = page.getByRole("textbox", { name: "Elixir example code" });
    const run = page.getByRole("button", { name: "Run", exact: true });
    await code.fill("6 * 7");
    await run.click();
    const activity = page.getByRole("status", {
      name: "Elixir runtime status",
    });
    await expect(activity).toHaveText("Starting Elixir…", { timeout: 30_000 });
    await expect(run).toBeDisabled();
    await expect(code).not.toBeEditable();
    await expect(
      page.getByRole("link", { name: "Powered by Popcorn", exact: true }),
    ).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    release();
    const result = page.getByRole("figure", { name: "Result", exact: true });
    await expect(result.locator("pre")).toHaveText("42", { timeout: 75_000 });
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        }),
    );
    expect(pulses).toBe(0);
    await result.scrollIntoViewIfNeeded();
    await expect.poll(() => pulses).toBe(1);
    await expect(run).toBeEnabled();
    await expect(activity).toBeEmpty();

    await page.emulateMedia({ reducedMotion: "reduce" });
    await code.fill("7 * 7");
    await run.click();
    await expect(result.locator("pre")).toHaveText("49");
    await result.scrollIntoViewIfNeeded();
    const arrow = result.locator("span");
    await expect(arrow).toHaveCSS("animation-name", "popcorn-result");
    await expect(arrow).toHaveCSS("animation-duration", "0.7s");
    await expect.poll(() => pulses).toBe(2);
  });

  test("recovers from user errors, timeouts and a stopped runtime", async ({
    page,
  }) => {
    await page.goto("/");
    const code = page.getByRole("textbox", { name: "Elixir example code" });
    const run = page.getByRole("button", { name: "Run", exact: true });
    const alert = page.getByRole("alert");
    const result = page
      .getByRole("figure", { name: "Result", exact: true })
      .locator("pre");
    await code.fill("1 +");
    await run.click();
    await expect(alert).toContainText("TokenMissingError", { timeout: 75_000 });
    await code.fill(
      'defmodule UserExample do\n  def fail, do: raise("oops")\nend\napply(UserExample, :fail, [])',
    );
    await run.click();
    await expect(alert).toContainText("example.exs:2: UserExample.fail/0");
    await expect(alert).not.toContainText(
      /validated_eval_string|WebsiteExamples|Task.Supervised/,
    );
    await code.fill("Process.sleep(11_000)");
    await run.click();
    await expect(alert).toHaveText("Execution timed out after 10 seconds.", {
      timeout: 15_000,
    });
    await code.fill("2 + 2");
    await run.click();
    await expect(result).toHaveText("4");
    await expect(alert).toHaveCount(0);
    await code.fill("System.halt(0)");
    await run.click();
    await expect(alert).toHaveText("Elixir stopped.");
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(run).toBeEnabled({ timeout: 75_000 });
    await expect(code).toHaveValue("System.halt(0)");
    await code.fill("3 + 4");
    await run.click();
    await expect(result).toHaveText("7");
  });

  test("stops after failed isolation instead of reloading forever", async ({
    page,
  }) => {
    let navigations = 0;
    page.on("request", (request) => {
      if (
        request.isNavigationRequest() &&
        request.frame() === page.mainFrame()
      ) {
        navigations++;
      }
    });
    await page.addInitScript(() => {
      Object.defineProperty(window, "crossOriginIsolated", { value: false });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("Elixir could not start.");
    await expect(
      page.getByRole("button", { name: "Retry", exact: true }),
    ).toBeVisible();
    expect(navigations).toBe(2);
  });

  test("retries a failed startup without executing the source", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const register = navigator.serviceWorker.register.bind(
        navigator.serviceWorker,
      );
      let firstAttempt = true;
      navigator.serviceWorker.register = (...args) => {
        if (firstAttempt) {
          firstAttempt = false;
          return Promise.reject(new Error("Registration failed"));
        }
        return register(...args);
      };
    });
    await page.goto("/");
    const code = page.getByRole("textbox", { name: "Elixir example code" });
    const run = page.getByRole("button", { name: "Run", exact: true });
    await code.fill("System.halt(0)");
    await run.click();
    await expect(page.getByRole("alert")).toHaveText("Elixir could not start.");
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(run).toBeEnabled({ timeout: 75_000 });
    await expect(page.getByRole("alert")).toHaveCount(0);
    await code.fill("6 * 7");
    await run.click();
    await expect(
      page.getByRole("figure", { name: "Result", exact: true }).locator("pre"),
    ).toHaveText("42");
  });

  test("keeps the editor usable when storage is denied", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "sessionStorage", {
        get() {
          throw new DOMException("Storage denied", "SecurityError");
        },
      });
    });
    await page.goto("/");
    const code = page.getByRole("textbox", { name: "Elixir example code" });
    await expect(code).toBeEditable();
    await code.fill("21 * 2");
    await page.getByRole("button", { name: "Run", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("Elixir could not start.");
    await expect(code).toBeEditable();
    await expect(code).toHaveValue("21 * 2");
  });

  test("cancels a slow startup without letting it finish later", async ({
    page,
    context,
  }) => {
    await page.clock.install();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await context.route("**/worker-*.js", async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto("/");
    const code = page.getByRole("textbox", { name: "Elixir example code" });
    const run = page.getByRole("button", { name: "Run", exact: true });
    const cancel = page.getByRole("button", { name: "Cancel", exact: true });
    const activity = page.getByRole("status", {
      name: "Elixir runtime status",
    });
    await code.fill("System.halt(0)");
    await run.click();
    await expect(activity).toHaveText("Starting Elixir…", { timeout: 30_000 });
    await expect(cancel).toHaveCount(0);
    await page.clock.fastForward(3_000);
    await expect(cancel).toBeVisible();
    await code.press("Meta+Enter");
    await cancel.click();
    await expect(activity).toHaveText("Cancelled.");
    await expect(code).toHaveValue("System.halt(0)");
    await code.fill("21 * 2");
    await run.click();
    release();
    await expect(
      page.getByRole("figure", { name: "Result", exact: true }).locator("pre"),
    ).toHaveText("42", { timeout: 75_000 });
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("cancels a slow run and preserves the previous output", async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto("/");
    const code = page.getByRole("textbox", { name: "Elixir example code" });
    const run = page.getByRole("button", { name: "Run", exact: true });
    const cancel = page.getByRole("button", { name: "Cancel", exact: true });
    const result = page
      .getByRole("figure", { name: "Result", exact: true })
      .locator("pre");
    await code.fill("43");
    await run.click();
    await expect(result).toHaveText("43", { timeout: 75_000 });
    await expect(cancel).toHaveCount(0);
    await page.clock.pauseAt(new Date(Date.now() + 1_000));
    await code.fill("Process.sleep(9_000)\n44");
    await code.press("Control+Enter");
    await page.clock.runFor(2_999);
    await expect(cancel).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(cancel).toBeVisible();
    await cancel.click();
    await expect(code).toHaveValue("Process.sleep(9_000)\n44");
    await expect(result).toHaveText("43");
    await expect(run).toBeEnabled();
    await expect(cancel).toHaveCount(0);
    await code.fill("6 * 7");
    await code.press("Control+Enter");
    await expect(result).toHaveText("42", { timeout: 75_000 });
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
});
