let isFirstLoad = true;

function revealImmediately(els: HTMLElement[]) {
  for (const el of els) el.dataset.revealed = "true";
}

function initReveal() {
  const all = document.querySelectorAll<HTMLElement>(
    "[data-reveal]:not([data-revealed])",
  );
  if (all.length === 0) return;

  if (!isFirstLoad) {
    revealImmediately(Array.from(all));
    return;
  }

  const eager: HTMLElement[] = [];
  const scrolled: HTMLElement[] = [];
  for (const el of all) {
    if (el.hasAttribute("data-reveal-eager")) eager.push(el);
    else scrolled.push(el);
  }

  if (eager.length > 0) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        revealImmediately(eager);
      });
    });
  }

  if (scrolled.length === 0) return;

  if (typeof IntersectionObserver === "undefined") {
    revealImmediately(scrolled);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.dataset.revealed = "true";
        observer.unobserve(el);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
  );

  for (const el of scrolled) observer.observe(el);
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
