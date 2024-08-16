---
layout: post
title: "Announcing the official Elixir Language Server team"
author: José Valim
category: Announcements
excerpt: "Announcing the official Elixir Language Server team to work on the code intelligence infrastructure to be used across tools and editors"
---

I am glad to welcome Elixir's official Language Server team, formed by (in alphabetical order):

* [Jonatan Kłosko](https://github.com/jonatanklosko)
* [Łukasz Samson](https://github.com/lukaszsamson)
* [Mitch Hanberg](https://www.mitchellhanberg.com/)
* [Steve Cohen](https://github.com/scohen)

The team will work on the code intelligence infrastructure to be used across tools and editors. These efforts are partially funded by [Fly.io](https://fly.io/) and [Livebook](https://livebook.dev/).

## A brief history

The [Language Server Protocol (LSP)](https://en.wikipedia.org/wiki/Language_Server_Protocol) was created by Microsoft as a protocol between IDEs and programming languages to provide language intelligence tools.

The first implementation of said protocol for Elixir was started by [Jake Becker](https://github.com/JakeBecker/elixir-ls/), back in 2017, alongside an implementation for Visual Studio Code, and it relied on [the ElixirSense project from Marlus Saraiva](https://github.com/msaraiva/elixir_sense) to extract and provide some of the language intelligence.

As the Language Server Protocol adoption grew as a whole, so did the usage of Elixir's implementation, which eventually became the main mechanism Elixir users interacted with the language from their editors.

Eventually, Elixir's language server implementation got its [own organization on GitHub](https://github.com/elixir-lsp/), and maintenance reins were given to Łukasz Samson and Jason Axelson.

Over time, the Elixir Language Server has accrued technical debt. Some of it exists due to intrinsic complexities (for example, the Language Server Protocol uses UTF-16 for text encoding, instead of the more widely used UTF-8), while others are a consequence of working on codebase while both the programming language and the protocol themselves were still evolving.

This led to Mitch Hanberg and Steve Cohen to create alternative language server implementations, exploring different trade-offs.

For example, both [Next LS](https://github.com/elixir-tools/next-ls) and [Lexical](https://github.com/lexical-lsp/lexical) use Erlang Distribution to isolate the Language Server runtime from the user code.

Next LS also focused on extracting the LSP protocol parts into [GenLSP](https://github.com/elixir-tools/gen_lsp) (which can be used by anyone to easily create a language server), single binary distribution with [Burrito](https://github.com/burrito-elixir/burrito), and experimenting with SQLite for the symbol index.

[Lexical](https://github.com/lexical-lsp/lexical) concerned itself with speed and abstractions to deal with documents, ranges, and more.

This means the Elixir community had, for some time, three distinct language server implementations, each with their own strengths.

## Looking forward

The current language server maintainers have agreed to move forward with a _single Language Server Protocol project_, relying on the strengths of each implementation:

* Lexical provides a stable foundation
* ElixirLS, through ElixirSense, provides the most complete implementation and wider functionality
* Next LS, through GenLSP, provides a general interface for LSP implementations and straight-forward packaging via [Burrito](https://github.com/burrito-elixir/burrito)

The above is a rough outline, as the specific details of how the projects will move forward are still being discussed. While some of the team members also maintain direct integration with some editors, we will continue relying on the community's help and efforts to get full coverage across all available editors.

And there is still a lot more to do!

Many underestimate the complexity behind implementing the Language Server Protocol. That's not surprising: we mostly interact with it from an editor, allowing us to freely ignore what makes it tick.

In practice, the Language Server needs, in many ways, to reimplement several parts of the language and its compiler.

If the Elixir compiler sees the code `some_value +`, it can immediately warn and say: "this expression is incomplete". However, the Language Server still needs to make sense of invalid code to provide features like completion. And that applies to everything: missing do-end blocks, invalid operators, invoking macros that do not exist, etc. Mitch has made [Spitfire](https://github.com/elixir-tools/spitfire), an error tolerant parser to tackle this particular problem.

Some ecosystems have undertaken [multi-year efforts to redesign their compilers and toolchains](https://en.wikipedia.org/wiki/Roslyn_(compiler)) to provide better tools for lexical and semantic code analysis (which most likely took a significant investment of time and resources to conclude). That's to say some of the problems faced by Language Server implementations will be best tackled if they are also solved as part of Elixir itself.

For example, every Language Server implementation compiles their own version of a project, making it so every application and its dependencies have to be compiled twice in development: once for Mix and once for the Language Server. Wouldn't it be nice if Elixir and the Language Servers could all rely on the same compilation artifacts?

This is not news to the Elixir team either: almost every Elixir release within the last 3 years has shipped new code analysis APIs, such as [Code.Fragment](https://hexdocs.pm/elixir/Code.Fragment.html), with the goal of removing duplication across Language Servers, [IEx](https://hexdocs.pm/iex), and [Livebook](https://livebook.dev/), as well as reduce their reliance on internal Elixir modules. Most recently, Elixir v1.17 shipped with [new APIs to help developers emulate the compiler behaviour](https://hexdocs.pm/elixir/Macro.Env.html). Our goal is to make these building blocks available for all Elixir developers, so their benefits are reaped beyond the language server tooling.

Furthermore, as [set-theoretic types make their way into Elixir](https://elixir-lang.org/blog/2024/06/12/elixir-v1-17-0-released/), we also want to provide official APIs to integrate them into our tools.

## Sponsorships

Currently, [Fly.io](https://fly.io/) is sponsoring Łukasz Samson to work part-time on the Language Server and editor integration. The [Livebook](https://livebook.dev/) project is donating development time from Jonatan Kłosko, creator of Livebook, to improve the Elixir compiler and its code intelligence APIs.

We are grateful to both companies for investing into the community and you should check them out.

As mentioned above, Language Server implementations are complex projects, and unifying efforts is an important step in the right direction. However, we also need community help, and one of the ways to do so is by sponsoring the developers making this possible:

* [Łukasz Samson](https://github.com/sponsors/lukaszsamson)
* [Mitch Hanberg](https://github.com/sponsors/mhanberg)
* [Steve Cohen](https://github.com/sponsors/scohen)

Companies who can afford to sponsor part-time development are welcome to reach out and help us achieve this important milestone.

## Progress updates

A new project website and social media accounts will be created soon, and you can follow them to stay up to date with our progress and any interesting developments.

The name of the new project is still in the works as well as many of the decisions we'll need to make, so please have patience!

In the meantime, you can continue to use the language server of your choice, and we’ll be sure to make the transition to the fourth and final project as smooth as possible.

Thank you!
