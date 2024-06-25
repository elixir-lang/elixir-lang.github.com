---
layout: post
title: Elixir v0.11.0 released
author: José Valim
category: Releases
excerpt: Elixir v0.11.0 is out and it focus on improving and optimizing the patterns often used by the community.
---

After 4 months, Elixir v0.11.0 has been released with 832 commits since the previous minor release, done by more than 40 contributors. Although we have some great features in this release, the major focus in those 4 months was improving the common patterns used by the community and streamlining the existing workflows.

## IEx

One of the tools that most received improvements in this release was our interactive shell. Such improvements come as no surprise as Elixir developers spend a good amount of time in the shell, which is great for development, allowing you to quickly try and load code, to production, where IEx can connect to remote nodes to inspect production information.

The IEx helper `h`, responsible for showing documentation for existing modules and functions, has now been improved to rely on ANSI codes and nicely format the documentation. let's take a look at the docs for the String module:

![String module docs](/images/contents/string-help.png)

This change goes in line with Elixir's goal of providing first-class documentation, which makes documentation easily accessible at runtime, support to doctests and more.

In this new release, IEx also supports a very simple debugging mechanism called `IEx.pry`. Let's see an screenshot of it in action:

![IEx pry example](/images/contents/iex-pry.png)

In Elixir, your code runs in many processes that talk to each other and the Elixir shell is no different. `IEx.pry` allows another process to take over the shell, allowing the developer to inspect the binding and halt the execution of the process being "pried" (i.e. the one that invoked `IEx.pry`). We called this feature `pry` as a gentle reminder that you can only inspect existing information, you cannot change the binding over a pried process. For more information, check the docs for [`IEx.pry/1`](https://hexdocs.pm/iex/IEx.html#pry/1).

## ExUnit

[In the previous release](/blog/2013/07/13/elixir-v0-10-0-released/), we introduced great changes to ExUnit, like the support for the `--trace` option. This time we continued pushing improvements, like adding profiling to test cases (times can be seen with the `--trace` option), paving the way for other features like emitting warnings for test cases that are too slow.

Another simple but significant change in ExUnit was the change in the default formatter to print changes as they come, instead of waiting until the suite is done running:

![ExUnit Fast Fail](/images/contents/fast-fail.png)

This change allows developer to get faster feedback from their test suites.

## Mix

Since the early days, Elixir took ahold of the compilation process in order to provide a seamless compilation experience. [Elixir's ParallelCompiler](/blog/2012/04/24/a-peek-inside-elixir-s-parallel-compiler/) was introduced even before the first official release, allowing developers to harness all the cores in their computer to compile Elixir code. However, once the first release came out, every time you changed any file, the whole project had to be recompiled.

In the past releases we have improved this process to only compile files that changed and their dependencies. For v0.11.0, we have improved this process to be faster and less conservative than the previous version.

Mix has also improved support for umbrella projects, which are projects that contain multiple OTP applications, essential for building large projects. The current release allows sharing of dependencies between projects and faster and dependency resolution times.

## Other changes

This release also introduces the new capture operator, which provides a convenient syntax for retrieving functions so they can be passed as arguments:

```elixir
Enum.all?([:foo, :bar, :baz], &is_atom/1)
#=> true
```

Which can also be used for partially applying functions and macros:

```elixir
fun = &is_record(&1, Range)
fun.(1..3)
#=> true
```

You can learn more about the [new capture operator in our docs](https://hexdocs.pm/elixir/Kernel.SpecialForms.html#&/1).

We have also pushed improvements to [the String module](https://hexdocs.pm/elixir/String.html), including new APIs. In particular, in order to know that `String.length("josé")` has length 4 (even though it takes 5 bytes to be represented in UTF-8), we need to use some algorithms defined by the Unicode Standard. These have been implemented as specified in the [extended grapheme cluster algorithm, defined in the version 6.3.0 of the Unicode Standard](http://www.unicode.org/reports/tr29/).

In the optimization front, we have pushed the first iteration of a [feature called Protocol consolidation](https://groups.google.com/forum/#!topic/elixir-lang-core/RoXAUtoyjk4), which speeds up the polymorphic dispatch done by protocols, sometimes reducing the dispatching time to 10% of the original time. We will continue working in upcoming releases to integrate protocol consolidation as a regular part of the developer workflow.

And finally, a minor but frequently asked feature has finally arrived into Elixir: variables follow the same rules as other identifiers in the language, which means developers can now name their variables `is_atom?`. For a general overview, [check out the CHANGELOG](https://github.com/elixir-lang/elixir/blob/v0.11.0/CHANGELOG.md).

Give Elixir a try! You can start with our [getting started guide](https://hexdocs.pm/elixir/introduction.html), or check out our sidebar for other learning resources.

**PS:** We have just released v0.11.1 which addresses a regression in Mix and improves the dependencies update process.
