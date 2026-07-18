let isFirstLoad = true;

function revealImmediately(els: HTMLElement[]) {
  for (const el of els) el.dataset.revealed = "true";
}

function initReveal() {
  const all = document.querySelectorAll<HTMLElement>(
    "[data-reveal-eager]:not([data-revealed])",
  );
  if (all.length === 0) return;

  const reveals = Array.from(all);
  if (!isFirstLoad) {
    revealImmediately(reveals);
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      revealImmediately(reveals);
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initReveal, { once: true });
} else {
  initReveal();
}

document.addEventListener("astro:before-swap", () => {
  document.documentElement.dataset.spaNav = "";
});

document.addEventListener("astro:page-load", () => {
  initReveal();
  isFirstLoad = false;
  setTimeout(() => {
    document.documentElement.removeAttribute("data-spa-nav");
  }, 350);
});
