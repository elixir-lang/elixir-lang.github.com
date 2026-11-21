import { useEffect, useRef } from "react";

export function useResultAnimation(runKey: string | null) {
  const node = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (runKey === null) return;
    const element = node.current as HTMLSpanElement;
    const animation = "animate-popcorn-result";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        element.classList.add(animation);
        observer.disconnect();
      },
      { threshold: 1 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.classList.remove(animation);
    };
  }, [runKey]);

  return node;
}
