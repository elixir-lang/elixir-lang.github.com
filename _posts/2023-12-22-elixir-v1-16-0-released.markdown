---
layout: post
title: Elixir v1.16 released
author: José Valim
category: Releases
excerpt: Elixir v1.16 released with compiler diagnostics and extensive documentation
---

Elixir v1.16 has just been released. 🎉

The Elixir team continues improving the developer experience
via tooling, documentation, and precise feedback, while keeping
the language stable and compatible.

The notable improvements in this release are the addition of
compiler diagnostics and extensive improvements to our docs
in the forms of guides, anti-patterns, diagrams and more.

## Code snippets in diagnostics

Elixir v1.15 introduced a new compiler diagnostic format and
the ability to print multiple error diagnostics per compilation
(in addition to multiple warnings).

With Elixir v1.16, we also include code snippets in exceptions
and diagnostics raised by the compiler, including ANSI coloring
on supported terminals. For example, a syntax error now includes
a pointer to where the error happened:

```
** (SyntaxError) invalid syntax found on lib/my_app.ex:1:17:
    error: syntax error before: '*'
    │
  1 │ [1, 2, 3, 4, 5, *]
    │                 ^
    │
    └─ lib/my_app.ex:1:17
```

For mismatched delimiters, it now shows both delimiters:

```
** (MismatchedDelimiterError) mismatched delimiter found on lib/my_app.ex:1:18:
    error: unexpected token: )
    │
  1 │ [1, 2, 3, 4, 5, 6)
    │ │                └ mismatched closing delimiter (expected "]")
    │ └ unclosed delimiter
    │
    └─ lib/my_app.ex:1:18
```

For unclosed delimiters, it now shows where the unclosed delimiter starts:

```
** (TokenMissingError) token missing on lib/my_app:8:23:
    error: missing terminator: )
    │
  1 │ my_numbers = (1, 2, 3, 4, 5, 6
    │              └ unclosed delimiter
 ...
  8 │ IO.inspect(my_numbers)
    │                       └ missing closing delimiter (expected ")")
    │
    └─ lib/my_app:8:23
```

Errors and warnings diagnostics also include code snippets.
When possible, we will show precise spans, such as on undefined variables:

```
  error: undefined variable "unknown_var"
  │
5 │     a - unknown_var
  │         ^^^^^^^^^^^
  │
  └─ lib/sample.ex:5:9: Sample.foo/1
```

Otherwise the whole line is underlined:

```
error: function names should start with lowercase characters or underscore, invalid name CamelCase
  │
3 │   def CamelCase do
  │   ^^^^^^^^^^^^^^^^
  │
  └─ lib/sample.ex:3
```

A huge thank you to Vinícius Müller for working on the new diagnostics.

## Revamped documentation

The [ExDoc](https://github.com/elixir-lang/ex_doc) package provides Elixir developers
with one of the most complete and robust documentation generator. It [supports API
references, tutorials, cheatsheets, and more](/blog/2022/12/22/cheatsheets-and-8-other-features-in-exdoc-that-improve-the-developer-experience/).

However, because many of the language tutorials and reference documentation
were written before ExDoc, they were maintained separately as part of the
official website, separate from the language source code. With Elixir v1.16,
[we have moved our learning material to the language repository](https://hexdocs.pm/elixir/introduction.html).
This provides several benefits:

1. Tutorials are versioned alongside their relevant Elixir version

2. You get full-text search across all API reference and tutorials

3. ExDoc will autolink module and function names in tutorials to their relevant API documentation

Another feature we have incorporated in this release is the addition
of cheatsheets, starting with [a cheatsheet for the Enum module](https://hexdocs.pm/elixir/main/enum-cheat.html).
If you would like to contribute future cheatsheets to Elixir itself,
feel free to start a discussion and collect feedback on the
[Elixir Forum](https://elixirforum.com/).

Finally, we have started enriching our documentation with
[Mermaid.js](https://mermaid.js.org/) diagrams. You can find examples
in the [GenServer](https://hexdocs.pm/elixir/GenServer.html)
and [Supervisor](https://hexdocs.pm/elixir/Supervisor.html) docs.

Elixir has always been praised by its excellent documentation and
we are glad to continue to raise the bar for the whole ecosystem.

## Living anti-patterns reference

Elixir v1.16 incorporates and extends the work on [Understanding Code Smells
in Elixir Functional Language](https://github.com/lucasvegi/Elixir-Code-Smells/blob/main/etc/2023-emse-code-smells-elixir.pdf),
by Lucas Vegi and Marco Tulio Valente, from [ASERG/DCC/UFMG](http://aserg.labsoft.dcc.ufmg.br/),
into [the official documention in the form of anti-patterns](https://hexdocs.pm/elixir/what-anti-patterns.html).
Our goal is to provide examples of potential pitfalls for library and
application developers, with additional context and guidance on how
to improve their codebases.

In earlier versions, Elixir's official reference for library authors
included a list of anti-patterns for library developers. Lucas Vegi and
Marco Tulio Valente extended and refined this list based on the existing
literature, articles, and community input (including feedback based on
their prevalence in actual codebases).

To incorporate the anti-patterns into the language, we trimmed the list down
to keep only anti-patterns which are unambiguous and actionable, and divided
them into four categories: [code-related](https://hexdocs.pm/elixir/code-anti-patterns.html),
[design-related](https://hexdocs.pm/elixir/design-anti-patterns.html),
[process-related](https://hexdocs.pm/elixir/process-anti-patterns.html),
and [meta-programming](https://hexdocs.pm/elixir/macro-anti-patterns.html).
Then we collected more community feedback during the release candidate
period, further refining and removing unclear guidance.

We are quite happy with the current iteration of anti-patterns but
this is just the beginning. As they become available to the whole community,
we expect to receive more input, questions, and concerns. We will
continue listening and improving, as our ultimate goal is to provide
a live reference that reflects the practices of the ecosystem,
rather than a document that is written in stone and ultimately gets
out of date. A perfect example of this is [the recent addition of
"Sending unnecessary data" anti-pattern](https://github.com/elixir-lang/elixir/pull/13194),
which was contributed by the community and describes a pitfall that may
happen across codebases.

## Type system updates

As we get Elixir v1.16 out of door, the Elixir team will focus on bringing
the initial core for set-theoretic types into the Elixir compiler, with the
goal of running automated analysis in patterns and guards. This is [the first
step outlined in a previous article](/blog/2023/06/22/type-system-updates-research-dev/)
and is sponsored by [Fresha](https://www.fresha.com) ([they are hiring!](https://www.fresha.com/careers/openings?department=engineering)),
[Starfish*](https://starfish.team) ([they are hiring!](https://starfish.team/jobs/experienced-elixir-developer)),
and [Dashbit](https://dashbit.co).

## Learn more

Other notable changes in this release are:

* the addition of [`String.replace_invalid/2`](https://hexdocs.pm/elixir/String.html#replace_invalid/2), to help deal with invalid UTF-8 encoding

* the addition of the `:limit` option in [`Task.yield_many/2`](https://hexdocs.pm/elixir/Task.html#yield_many/2) that limits the maximum number of tasks to yield

* improved binary pattern matching by allowing prefix binary matches, such as `<<^prefix::binary, rest::binary>>`

For a complete list of all changes, see the
[full release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.16.0).

Check [the Install section](/install.html) to get Elixir installed and
read our [Getting Started guide](https://hexdocs.pm/elixir/introduction.html)
to learn more.

Happy learning!
