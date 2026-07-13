import { useEffect, useState } from "react";
import type { NavItem } from "@/data/navigation";
import { cn } from "@/utilities/classname";

interface MobileMenuProps {
  items: NavItem[];
  ctaLabel: string;
  ctaHref: string;
  ctaExternal?: boolean;
  tone?: "light" | "dark";
}

export function MobileMenu({
  items,
  ctaLabel,
  ctaHref,
  ctaExternal = false,
  tone = "light",
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isDark = tone === "dark";

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-(--duration-fast) ease-(--ease-out-quart) lg:hidden",
          isDark
            ? "text-(--color-white) hover:bg-(--color-white)/10"
            : "text-(--color-black) hover:bg-(--color-purple-0)",
        )}
      >
        <svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          {open ? (
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-(--color-black) text-(--color-white) transition-opacity duration-(--duration-base) ease-(--ease-out-quart) lg:hidden",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        // Panel stays in DOM (opacity-0) for animation; `inert` removes it
        // from tab order + a11y tree when closed (paired with aria-hidden).
        inert={!open}
        aria-hidden={!open}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <div className="flex h-full flex-col px-6 pb-10 pt-24">
          <nav aria-label="Mobile" className="flex flex-1 flex-col gap-1">
            {items.map((item, i) => (
              <a
                key={item.href}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                onClick={() => setOpen(false)}
                style={{
                  transitionDelay: open ? `${i * 60 + 80}ms` : "0ms",
                }}
                className={cn(
                  "group flex items-center justify-between border-b border-(--color-gray-100) py-5 font-sans text-[1.5rem] font-medium text-(--color-white) transition-[transform,opacity,color] duration-(--duration-base) ease-(--ease-out-quart) hover:text-(--color-purple-40)",
                  open
                    ? "translate-y-0 opacity-100"
                    : "translate-y-3 opacity-0",
                )}
              >
                {item.label}
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  className="text-(--color-white) transition-all duration-(--duration-fast) ease-(--ease-out-quart) group-hover:translate-x-0.5 group-hover:text-(--color-purple-40)"
                >
                  <path
                    d="M4.17 10h11.67M15.83 10l-5-5M15.83 10l-5 5"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            ))}
          </nav>

          <a
            href={ctaHref}
            target={ctaExternal ? "_blank" : undefined}
            rel={ctaExternal ? "noopener noreferrer" : undefined}
            onClick={() => setOpen(false)}
            style={{
              transitionDelay: open ? `${items.length * 60 + 80}ms` : "0ms",
            }}
            className={cn(
              "group mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-sm bg-(--color-purple-60) px-6 font-sans text-body font-medium text-(--color-white) transition-[transform,opacity,background-color] duration-(--duration-base) ease-(--ease-out-quart) hover:bg-(--color-purple-70)",
              open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
            )}
          >
            {ctaLabel}
            <svg
              width={20}
              height={20}
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="transition-transform duration-(--duration-fast) ease-(--ease-out-quart) group-hover:translate-x-0.5"
            >
              <path
                d="M4.17 10h11.67M15.83 10l-5-5M15.83 10l-5 5"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>

        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="absolute right-6 top-7 inline-flex h-10 w-10 items-center justify-center rounded-full text-(--color-white) transition-colors duration-(--duration-fast) ease-(--ease-out-quart) hover:bg-(--color-white)/10"
        >
          <svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </>
  );
}
