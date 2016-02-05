---
layout: post
title: Elixir v0.12.0 released
author: José Valim
category: Releases
excerpt: Elixir v0.12.0 is out with improved enumerables, build patterns and welcoming a new member to our team
---

Elixir v0.12.0 has been released with improved enumerables, build patterns and welcoming a new member to our team.

## Enumerables

In previous versions, the Enumerable protocol was based on reduce/fold, and while it is very efficient for operations like `map`, `reduce` and `filter`, it was sub-optimal for operations that need to halt, like `take` and `take_while`, and it made it impossible for operations like `zip` to be implemented.

In v0.12.0, Elixir's Enumerable protocol has been extended to allow suspension and halting mechanisms, making operations like `take` simpler and operations that require interleaving, like `zip`, possible.

Although most users don't need to concern with the implementation of the Enumerable protocol, the side-effect is that both `Enum` and `Stream` modules have been considerably extended and improved in this release, with more than 15 new functions added to the `Stream` module.

## Mix

The tool that received most improvements in this release was Mix. The biggest change is that Mix no longer compiles projects in place but to the `_build` directory. For example, take the [Ecto project](https://github.com/elixir-lang/ecto) that [depends on `postgrex` and `poolboy`](https://github.com/elixir-lang/ecto/blob/master/mix.exs#L24-L25). When compiled, all the artifacts will be placed in the `_build` directory like this:

```
_build
└── shared
    └── lib
        ├── ecto
        │   └── ebin
        |   └── priv
        ├── poolboy
        │   └── ebin
        └── postgrex
            └── ebin
```

For those familiar with Erlang's OTP, this is similar to the structure used by OTP when releasing your software. So this new structure makes our software one step close to production and guarantee it is designed correctly since day 1.

This approach comes with the `:build_per_environment` option which, when set to true, creates a different build per environment (`dev`, `test`, `production` or more). Extremely useful when a project compile different artifacts depending on the compilation environment.

Mix has also added support to optional dependencies and improved common patterns, like the usage of umbrella apps.

## Welcome, Eric!

With this release, we also want to welcome [Eric MJ](https://github.com/ericmj) to the Elixir Team. He has done fantastic work on Elixir, helping us maintain the codebase and working on many of the important features from previous releases and now many more to come.

Eric is also maintainer of both [Ecto](https://github.com/elixir-lang/ecto) and [Postgrex](https://github.com/ericmj/postgrex) projects. Which are proving to be very useful to the Elixir community too!

## Tidying up

There were other small changes, like additions to the `Float` module and improvements the to the typespec syntax. To see the full list, please [see the CHANGELOG](https://github.com/elixir-lang/elixir/blob/v0.12.0/CHANGELOG.md).

Give Elixir a try! You can start with our [getting started guide](/getting-started/introduction.html), or check out our sidebar for other learning resources.
