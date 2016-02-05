---
layout: post
title: Elixir v0.7.0 released
author: José Valim
category: Releases
excerpt: Elixir v0.7.0 is released with many improvements! Read on for more information.

---

Elixir v0.7.0 was released with bug fixes and many improvements, like a `String` module to handle utf-8 binaries and support to environments and nested dependencies in Mix.

We have also taken important steps into normalizing our APIs. In Erlang, accesses to tuple and lists are one-based and binaries are zero-based, but in Elixir we have normalized all of them to rely on zero-based access.

This release also includes some backwards incompatible changes, but the majority of changes were first deprecated, meaning your code will run just fine but with warnings. Those warnings will be removed in the next release v0.7.1, which should happen in a 2 to 4 weeks time span.

For more information, read out the [CHANGELOG](https://github.com/elixir-lang/elixir/blob/v0.7.0/CHANGELOG.md).

Thank you and don't forget to [give Elixir a try](/getting-started/introduction.html)!
