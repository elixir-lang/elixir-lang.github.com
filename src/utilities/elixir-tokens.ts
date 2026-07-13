// Tiny regex-based Elixir tokenizer.

export type TokenKind =
  | "comment"
  | "string"
  | "atom"
  | "number"
  | "keyword"
  | "module"
  | "function"
  | "operator"
  | "punctuation"
  | "text";

export type Token = { kind: TokenKind; text: string };

const KEYWORDS = new Set([
  "def",
  "defp",
  "defmodule",
  "defmacro",
  "defmacrop",
  "defstruct",
  "defprotocol",
  "defimpl",
  "defguard",
  "defguardp",
  "defdelegate",
  "do",
  "end",
  "fn",
  "if",
  "else",
  "elsif",
  "unless",
  "case",
  "when",
  "cond",
  "with",
  "for",
  "receive",
  "after",
  "try",
  "catch",
  "rescue",
  "throw",
  "raise",
  "in",
  "not",
  "and",
  "or",
  "nil",
  "true",
  "false",
  "use",
  "import",
  "require",
  "alias",
  "quote",
  "unquote",
  "spawn",
  "spawn_link",
  "send",
]);

const RE_WHITESPACE = /^\s+/;
const RE_COMMENT = /^#.*$/;
const RE_STRING = /^"(?:[^"\\]|\\.)*"/;
const RE_CHARLIST = /^'(?:[^'\\]|\\.)*'/;
const RE_ATOM = /^:(?:[a-z_][a-zA-Z0-9_]*[!?]?|"[^"]*")/;
// `:` after an identifier turns it into a keyword-list atom (`name:`)
const RE_KEYWORD_ATOM = /^([a-z_][a-zA-Z0-9_]*[!?]?):(?=\s)/;
const RE_NUMBER = /^-?\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?/;
const RE_MODULE = /^[A-Z][a-zA-Z0-9_]*/;
const RE_IDENT = /^[a-z_][a-zA-Z0-9_]*[!?]?/;
const RE_OPERATOR =
  /^(?:\|>|->|=>|<>|::|<-|&&|\|\||==|!=|<=|>=|=~|\.\.|<<|>>|\+\+|--|&|\?|<|>|=|\+|-|\*|\/|\.|\|)/;
const RE_PUNCT = /^[(){}[\],;]/;

export function tokenizeElixir(source: string): Token[] {
  const tokens: Token[] = [];
  let rest = source;

  const eat = (m: RegExpExecArray | null, kind: TokenKind): boolean => {
    if (!m) return false;
    tokens.push({ kind, text: m[0] });
    rest = rest.slice(m[0].length);
    return true;
  };

  while (rest.length > 0) {
    if (eat(RE_WHITESPACE.exec(rest), "text")) continue;
    if (eat(RE_COMMENT.exec(rest), "comment")) continue;
    if (eat(RE_STRING.exec(rest), "string")) continue;
    if (eat(RE_CHARLIST.exec(rest), "string")) continue;
    if (eat(RE_ATOM.exec(rest), "atom")) continue;

    // `name:` (keyword-list shorthand) is the same colour as a regular
    // atom: emit one atom token covering the name + colon.
    const kwAtom = RE_KEYWORD_ATOM.exec(rest);
    if (kwAtom) {
      tokens.push({ kind: "atom", text: `${kwAtom[1]}:` });
      rest = rest.slice(kwAtom[1].length + 1);
      continue;
    }

    if (eat(RE_NUMBER.exec(rest), "number")) continue;
    if (eat(RE_MODULE.exec(rest), "module")) continue;

    const ident = RE_IDENT.exec(rest);
    if (ident) {
      const kind: TokenKind = KEYWORDS.has(ident[0]) ? "keyword" : "function";
      tokens.push({ kind, text: ident[0] });
      rest = rest.slice(ident[0].length);
      continue;
    }

    if (eat(RE_OPERATOR.exec(rest), "operator")) continue;
    if (eat(RE_PUNCT.exec(rest), "punctuation")) continue;

    // Single-char fallback so we never loop forever on something unrecognised.
    tokens.push({ kind: "text", text: rest[0] });
    rest = rest.slice(1);
  }

  return tokens;
}

// Maps token kinds to Tailwind utility classes.
export const TOKEN_CLASS: Record<TokenKind, string> = {
  comment: "italic text-gray-40",
  string: "text-purple-30",
  atom: "text-purple-30",
  number: "text-purple-30",
  keyword: "text-purple-40",
  module: "text-white",
  function: "text-purple-40",
  operator: "text-white-10",
  punctuation: "text-white-10",
  text: "",
};
