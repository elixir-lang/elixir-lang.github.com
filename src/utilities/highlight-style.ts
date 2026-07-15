import type { HighlightedToken } from "@/utilities/elixir-highlight";

// Inline style for a highlighted token.
export function tokenStyle(
  token: HighlightedToken,
): { color?: string; fontStyle?: "italic" } | undefined {
  if (!token.color && !token.italic) return undefined;
  return {
    ...(token.color && { color: token.color }),
    ...(token.italic && { fontStyle: "italic" as const }),
  };
}
