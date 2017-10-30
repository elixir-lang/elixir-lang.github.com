---
layout: post
title: Elixir v1.1 released
author: José Valim
category: Releases
excerpt: Elixir v1.1 brings enhancements, bug fixes, performance improvements and more into Elixir.
---

Elixir v1.1 has been released and it brings enhancements, bug fixes, performance improvements and more into Elixir.

Elixir v1.1 supports both Erlang 17 and Erlang 18. This is, however, the last release supporting Erlang 17, so upgrading to Erlang 18 is advised. Elixir v1.2 will introduce features that are Erlang 18 only.

On the standard library side, about 40 new functions have been added to Elixir public APIs. For example, [`Enum`](/docs/v1.1/elixir/Enum.html) got [`dedup/1`](/docs/v1.1/elixir/Enum.html#dedup/1), [`random/1`](/docs/v1.1/elixir/Enum.html#random/1), and a couple more. The [`String`](/docs/v1.1/elixir/String.html) module can now [calculate the distance between strings](/docs/v1.1/elixir/String.html#jaro_distance/2). We use this feature to provide suggestions whenever an unknown task name is given when using Mix. You can also [yield to](/docs/v1.1/elixir/Task.html#yield/2) and [shutdown](/docs/v1.1/elixir/Task.html#shutdown/2) tasks in the [`Task`](/docs/v1.1/elixir/Task.html) module.

The applications that ship with Elixir also has seen improvements and bug fixes. [ExUnit](/docs/v1.1/ex_unit/ExUnit.html), Elixir's test framework, now has support for skipping tests via tags `@tag :skip`, as well as the ability to capture logs via `@tag :capture_log`, ensuring that all log messages during the tests are captured. Even better, in case of failures, all captured log messages are printed along-side the test error report.

Mix ships with a [`mix profile.fprof`](/docs/v1.1/mix/Mix.Tasks.Profile.Fprof.html), useful for profiling your application code. The [`mix app.start`](/docs/v1.1/mix/Mix.Tasks.App.Start.html) has also been publicly documented. Although you likely won't invoke it directly through the command line, it is useful when writing your own tasks that require the current application to be up and running.

Mix also provides faster re-compilation times. Every time you compile your Elixir code, Mix generates a graph of the dependencies between source files. For example, if `a.ex` depends on `b.ex`, every time `b.ex` changes, `a.ex` must be recompiled. Elixir v1.1 improves this tracking by separating compile-time dependencies from runtime ones, recompiling a file only if a compile-time dependency changed. In projects that have a main dispatch entity, like a web-app router, we have seen `mix compile` go from recompiling the whole project to one or two files per run.

We have also seen great progress on areas that go beyond the source code. In particular, we have added a [CODE\_OF\_CONDUCT.md](https://github.com/elixir-lang/elixir/blob/v1.1/CODE_OF_CONDUCT.md) to guarantee our community continues to grow into a safe and welcoming place for everyone.

We have also released a new ExDoc version. It provides a [beautiful, clean and readable way to navigate the Elixir documentation](https://hexdocs.pm/elixir/1.1.0) and it is available to any Elixir project. The latest version includes initial support for User Guides and we have more features and improvements coming on the way.

The full list of changes is available in our [release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.1.0). Don't forget to check [the Install section](/install.html) to get Elixir installed.

Happy coding!
