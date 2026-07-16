// Elixir syntax highlighting via shiki, using the github-dark theme.
//
// Used at build time by the homepage Astro components, and lazily on
// the client by the hero editor (dynamically imported, so shiki stays
// out of the initial island bundle).

import { createHighlighterCore, type HighlighterCore } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import elixirLang from "@shikijs/langs/elixir";
import githubDark from "@shikijs/themes/github-dark";

export type HighlightedToken = {
  text: string;
  color?: string;
  italic?: boolean;
};

export type HighlightedLine = HighlightedToken[];

let highlighterPromise: Promise<HighlighterCore> | null = null;

export function getElixirHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    themes: [githubDark],
    langs: [elixirLang],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighterPromise;
}

// Tokenizes Elixir source into per-line tokens.
export function highlightElixir(
  highlighter: HighlighterCore,
  code: string,
): HighlightedLine[] {
  const lines = highlighter.codeToTokensBase(code, {
    lang: "elixir",
    theme: "github-dark",
  });

  return lines.map((line) => {
    const tokens: HighlightedLine = [];
    for (const themed of line) {
      const fontStyle = themed.fontStyle ?? 0;
      const italic = fontStyle > 0 && (fontStyle & 1) !== 0;
      const color = themed.color;
      const prev = tokens[tokens.length - 1];
      if (prev && prev.color === color && (prev.italic ?? false) === italic) {
        prev.text += themed.content;
      } else {
        tokens.push({
          text: themed.content,
          ...(color !== undefined && { color }),
          ...(italic && { italic }),
        });
      }
    }
    return tokens;
  });
}
