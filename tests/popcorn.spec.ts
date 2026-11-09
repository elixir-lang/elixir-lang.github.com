import {
  type BrowserContext,
  expect as baseExpect,
  type Locator,
  type Page,
  type Request,
  test,
} from "@playwright/test";

const expect = baseExpect.configure({ timeout: 10_000 });

test.describe("examples", () => {
  test("lazy execution and edit persistence", async ({ page }) => {
    function isRequest(request: Request) {
      return /\/otp\/|worker-|\.wasm/.test(request.url());
    }
    const requests = gatherRequests(page, isRequest);
    await page.goto("/");
    const editor = nodes(page);

    await editor.next.click();
    const source = (await editor.code.inputValue()).replace('"42px"', '"43px"');
    await editor.code.fill(source);
    await expect.poll(() => syntaxHighlighted(editor.display)).toBe(true);
    expect(requests).toHaveLength(0);
    await expect(editor.popcornLogo).not.toBeVisible();

    await editor.code.press("Meta+Enter");
    await expect(editor.result).toHaveText("{:pixels, 43}");
    await expect(editor.code).toHaveValue(source);
    await expect(editor.display).toHaveText(source);
    await expect(editor.popcornLogo).toBeVisible();

    await editor.next.click();
    await editor.previous.click();
    await expect(editor.code).toHaveValue(source);
  });

  test("errors and runtime recovery", async ({ page }) => {
    await page.goto("/");
    const editor = nodes(page);

    await editor.code.fill("1 +");
    await editor.run.click();
    await expect(editor.alert).toContainText("TokenMissingError");

    await editor.code.fill(`defmodule UserExample do
      def fail, do: raise("oops")
    end
    apply(UserExample, :fail, [])`);
    await editor.run.click();
    await expect(editor.alert).toContainText(
      "example.exs:2: UserExample.fail/0",
    );

    await editor.code.fill("2 + 2");
    await editor.run.click();
    await expect(editor.result).toHaveText("4");
    await expect(editor.alert).toBeHidden();

    await editor.code.fill("System.halt(0)");
    await editor.run.click();
    await expect(editor.alert).toHaveText("Elixir stopped.");

    await editor.retry.click();
    await editor.code.fill("3 + 4");
    await editor.run.click();
    await expect(editor.result).toHaveText("7");
  });

  test("isolation failure", async ({ page }) => {
    function isNavigation(request: Request) {
      return (
        request.isNavigationRequest() && request.frame() === page.mainFrame()
      );
    }
    const navigations = gatherRequests(page, isNavigation);
    await page.addInitScript(() => {
      Object.defineProperty(window, "crossOriginIsolated", { value: false });
    });
    await page.goto("/");
    const editor = nodes(page);

    await editor.run.click();
    await expect(editor.alert).toHaveText("Elixir could not start.");
    expect(navigations).toHaveLength(2);
  });

  test("startup retry", async ({ page }) => {
    await failFirstRegistration(page);
    await page.goto("/");
    const editor = nodes(page);

    await editor.code.fill("System.halt(0)");
    await editor.run.click();
    await expect(editor.alert).toHaveText("Elixir could not start.");

    await editor.retry.click();
    await expect(editor.alert).toBeHidden();

    await editor.code.fill("6 * 7");
    await editor.run.click();
    await expect(editor.result).toHaveText("42");
  });

  test("startup cancellation", async ({ page, context }) => {
    await page.clock.install();
    const release = await delayRuntime(context);
    await page.goto("/");
    const editor = nodes(page);

    await editor.code.fill("System.halt(0)");
    await editor.run.click();
    await expect(editor.activity).toHaveText("Starting Elixir…");
    await expect(editor.run).toBeDisabled();

    await page.clock.fastForward(3_000);
    await editor.cancel.click();
    await expect(editor.activity).toHaveText("Cancelled.");
    await expect(editor.code).toHaveValue("System.halt(0)");

    await editor.code.fill("21 * 2");
    await editor.run.click();
    release();
    await expect(editor.result).toHaveText("42");
  });

  test("execution cancellation and output", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    const editor = nodes(page);

    await editor.code.fill('IO.puts("hello")\n43');
    await editor.run.click();
    await expect(editor.result).toHaveText("43");
    await expect(editor.stdout).toHaveText("hello");

    const source = "Process.sleep(:infinity)";
    await editor.code.fill(source);
    await editor.code.press("Control+Enter");
    await expect(editor.activity).toHaveText("Running…");
    await expect(editor.result).toHaveText("43");

    await page.clock.fastForward(3_000);
    await editor.cancel.click();
    await expect(editor.code).toHaveValue(source);
    await expect(editor.result).toHaveText("43");

    await editor.code.fill("6 * 7");
    await editor.run.click();
    await expect(editor.result).toHaveText("42");
    await expect(editor.stdout).toBeHidden();
  });
});

function gatherRequests(page: Page, matches: (request: Request) => boolean) {
  const requests: Request[] = [];
  page.on("request", (request) => {
    if (matches(request)) requests.push(request);
  });
  return requests;
}

function nodes(page: Page) {
  const code = page.getByRole("textbox", { name: "Elixir example code" });
  return {
    code,
    display: code.locator("..").locator("pre"),
    result: page
      .getByRole("figure", { name: "Result", exact: true })
      .locator("pre"),
    stdout: page
      .getByRole("figure", { name: "Standard output" })
      .locator("pre"),
    alert: page.getByRole("alert"),
    activity: page.getByRole("status", { name: "Elixir runtime status" }),
    run: page.getByRole("button", { name: "Run", exact: true }),
    retry: page.getByRole("button", { name: "Retry", exact: true }),
    cancel: page.getByRole("button", { name: "Cancel", exact: true }),
    popcornLogo: page.getByRole("link", {
      name: "Powered by Popcorn",
      exact: true,
    }),
    next: page.getByRole("button", { name: "Next example" }),
    previous: page.getByRole("button", { name: "Previous example" }),
  };
}

function syntaxHighlighted(node: Locator) {
  return node.locator("span").evaluateAll((tokens) => {
    const colors = tokens.map((token) => getComputedStyle(token).color);
    return new Set(colors).size > 1;
  });
}

async function delayRuntime(context: BrowserContext) {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await context.route("**/worker-*.js", async (route) => {
    await gate;
    await route.continue();
  });
  return release;
}

async function failFirstRegistration(page: Page) {
  await page.addInitScript(() => {
    const register = navigator.serviceWorker.register.bind(
      navigator.serviceWorker,
    );
    navigator.serviceWorker.register = () => {
      navigator.serviceWorker.register = register;
      return Promise.reject(new Error("Registration failed"));
    };
  });
}
