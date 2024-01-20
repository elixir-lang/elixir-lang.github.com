---
layout: post
title: Elixir v1.12 released
author: José Valim
category: Releases
excerpt: Elixir v1.12 is out with improvements to scripting, tighter Erlang/OTP 24 integration, stepped ranges, and dozen of new functions across the standard library
---

Elixir v1.12 is out with improvements to scripting, tighter Erlang/OTP 24 integration, stepped ranges, and dozen of new functions across the standard library. Overall this is a small release, which continues our tradition of bringing Elixir developers quality of life improvements every 6 months. Some of these improvements directly relates with the [recent efforts of bringing Numerical Computing to Elixir](https://dashbit.co/blog/nx-numerical-elixir-is-now-publicly-available).

Elixir v1.12 requires Erlang/OTP 22+. We also recommend running `mix local.rebar` after installation to upgrade to the latest Rebar versions, which includes support for Erlang OTP/24+.

Note: this announcement contains [asciinema](https://asciinema.org) snippets. You may need to enable 3rd-party JavaScript on this site in order to see them. If JavaScript is disabled, `noscript` tags with the proper links will be shown.

## Scripting improvements: `Mix.install/2` and `System.trap_signal/3`

Elixir v1.12 brings new conveniences for those using Elixir for scripting (via `.exs` files). Elixir has been capable of managing dependencies for a quite long time, but it could only be done within Mix projects. In particular, the Elixir team is wary of global dependencies as any scripts that rely on system packages are brittle and hard to reproduce whenever your system changes.

`Mix.install/2` is meant to be a sweet spot between single-file scripts and full-blown Mix projects. With `Mix.install/2`, you can list your dependencies at the top of your scripts. When you execute the script for the first time, Elixir will download, compile, and cache your dependencies before running your script. Future invocations of the script will simply read the compiled artifacts from the cache:

```elixir
Mix.install([:jason])
IO.puts(Jason.encode!(%{hello: :world}))
```

`Mix.install/2` also performs protocol consolidation, which gives script developers an option to execute their code in the most performant format possible. Note `Mix.install/2` is currently experimental and it may change in future releases.

Furthermore, `Mix.install/2` pairs nicely with Livebook, a newly announced project that brings interactive and collaborative notebook projects to Elixir. With Livebook and `Mix.install/2`, you can bring dependencies into your code notebooks and ensure they are fully reproducible. [Watch the Livebook announcement to learn more](https://www.youtube.com/watch?v=RKvqc-UEe34).

Another improvement to scripting is the ability to trap exit signals via `System.trap_signal/3`. All you need is the signal name and a callback that will be invoked when the signal triggers. For example, ExUnit leverages this functionality to print all currently running tests when you abort the test suite via SIGQUIT (`Ctrl+\\ `). You can see this in action when running tests in the Plug project below:

<script type="text/javascript" src="https://asciinema.org/a/qPOJ9Vd8DiEXttEv7olNJPUR0.js" id="asciicast-qPOJ9Vd8DiEXttEv7olNJPUR0" async></script><noscript><p><a href="https://asciinema.org/a/qPOJ9Vd8DiEXttEv7olNJPUR0">See the example in asciinema</a></p></noscript>

This is particularly useful when your tests get stuck and you want to know which one is the culprit.

**Important**: Trapping signals may have strong implications on how a system shuts down and behaves in production and therefore it is extremely discouraged for libraries to set their own traps. Instead, they should redirect users to configure them themselves. The only cases where it is acceptable for libraries to set their own traps is when using Elixir in script mode, such as in `.exs` files and via Mix tasks.

## Tighter Erlang/OTP 24 integration

[Erlang/OTP 24 ships with JIT compilation](https://blog.erlang.org/My-OTP-24-Highlights/) and Elixir developers don't have to do anything to reap its benefits. There are many other features in Erlang/OTP 24 to look forwards to and Elixir v1.12 provides integration with many of them: such as support for 16bit floats in bitstrings as well as performance improvements in the compiler and during code evaluation.

Another excellent feature in Erlang/OTP 24 is the implementation of [EEP 54](http://www.erlang.org/eeps/eep-0054.html), which provides extended error information for many functions in Erlang's stdlib. Elixir v1.12 fully leverages this feature to improve reporting for errors coming from Erlang. For example, in earlier OTP versions, inserting an invalid argument into an ETS table that no longer exists would simply error with `ArgumentError`:

<script type="text/javascript" src="https://asciinema.org/a/1s79Cwf2JvSLYihAahIobVyBm.js" id="asciicast-1s79Cwf2JvSLYihAahIobVyBm" async></script><noscript><p><a href="https://asciinema.org/a/1s79Cwf2JvSLYihAahIobVyBm">See the example in asciinema</a></p></noscript>

However, in Elixir v1.12 with Erlang/OTP 24:

<script type="text/javascript" src="https://asciinema.org/a/4l1ORaVDVdHB7Gi5DccIYFgSL.js" id="asciicast-4l1ORaVDVdHB7Gi5DccIYFgSL" async></script><noscript><p><a href="https://asciinema.org/a/4l1ORaVDVdHB7Gi5DccIYFgSL">See the example in asciinema</a></p></noscript>

Finally, note Rebar v2 no longer works on Erlang/OTP 24+. Mix defaults to Rebar v3 since Elixir v1.4, so no changes should be necessary by the vast majority of developers. However, if you are explicitly setting `manager: :rebar` in your dependency, you want to move to Rebar v3 by removing the `:manager` option. Compatibility with unsupported Rebar versions will be removed from Mix in the future.

## Stepped ranges

Elixir has had support for ranges from before its v1.0 release. Ranges support only integers and are inclusive, using the mathematic notation `a..b`. Ranges in Elixir are either increasing `1..10` or decreasing `10..1` and the direction of the range was always inferred from the first and last positions. Ranges are always lazy as its values are emitted as they are enumerated rather than being computed upfront.

Unfortunately, due to this inference, it is not possible to have empty ranges. For example, if you want to create a list of `n` elements, you cannot express it with a range from `1..n`, as `1..0` (for `n=0`) is a decreasing range with two elements.

Elixir v1.12 supports stepped ranges via [the `first..last//step` notation](https://hexdocs.pm/elixir/1.12/Kernel.html#..///3). For example: `1..10//2` will emit the numbers `1`, `3`, `5`, `7`, and `9`. You can consider the `//` operator as an equivalent to "range division", as it effectively divides the number of elements in the range by `step`, rounding up on inexact scenarios. Steps can be either positive (increasing ranges) or negative (decreasing ranges). Stepped ranges bring more expressive power to Elixir ranges and they elegantly solve the empty range problem, as they allow the direction of the steps to be explicitly declared instead of inferred.

As of Elixir v1.12, implicitly decreasing ranges are soft-deprecated and warnings will be emitted in future Elixir versions based on our [deprecation policy](https://hexdocs.pm/elixir/compatibility-and-deprecations.html#deprecations).

## `then/2` and `tap/2`

Two new functions have been added to `Kernel` module, in order to ease working with pipelines. [`tap/2`](https://hexdocs.pm/elixir/1.12/Kernel.html#tap/2) passes the given argument to an anonymous function, returning the argument itself. [`then/2`](https://hexdocs.pm/elixir/1.12/Kernel.html#then/2) passes the given argument to an anonymous function, returning the result. The following:

```elixir
"hello world"
|> tap(&IO.puts/1)
|> then(&Regex.scan(~r/\w+/, &1))
```

Is equivalent to this:

```elixir
"hello world"
|> (fn x ->
      IO.puts(x)
      x
    end).()
|> (&Regex.scan(~r/\w+/, &1)).()
```

Both `tap/2` and `then/2` are implemented as macros, and compiler improvements available on Erlang/OTP 24 ensure the intermediate anonymous functions is optimized away, which guarantees the idioms above do not have any performance impact on your code.

## IEx improvements

IEx got two important quality of life improvements in this release. Hitting tab after a function invocation will show all of the arguments for said function and it is now possible to paste code with pipelines in the shell. See both features in action below:

<script type="text/javascript" src="https://asciinema.org/a/IMSAZUqLFlmGRsPk4gKuJ3tN0.js" id="asciicast-IMSAZUqLFlmGRsPk4gKuJ3tN0" async></script><noscript><p><a href="https://asciinema.org/a/IMSAZUqLFlmGRsPk4gKuJ3tN0">See the example in asciinema</a></p></noscript>

## Additional functions

Elixir v1.12 has also added many functions across the standard library. The `Enum` module received additions such as `Enum.count_until/2`, `Enum.product/1`, `Enum.zip_with/2`, and more. The `Integer` module now includes `Integer.pow/2` and `Integer.extended_gcd/2`.

The `Code` module got a [`cursor_context/2`](https://hexdocs.pm/elixir/1.12/Code.html#cursor_context/2) function, which is now used to power `IEx` autocompletion and it is [used by projects such as Livebook to provide intellisense](https://user-images.githubusercontent.com/17034772/115117125-533b2900-9f9d-11eb-94a9-a2cf2ccb7388.mp4).

The EEx application has also been extended to provide metadata on text segments. This has enabled the Surface and Phoenix LiveView teams to implement [a new template language called HEEx](https://github.com/phoenixframework/phoenix_live_view/pull/1440), which validates both HTML and EEx. Finally, the `Registry` module supports the `:compressed` option, which is useful for GraphQL applications managing hundreds of thousands of subscriptions via [Absinthe](http://absinthe-graphql.org/).

For a complete list of all changes, see the [full release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.12.0). Check [the Install section](/install.html) to get Elixir installed and read our [Getting Started guide](https://hexdocs.pm/elixir/introduction.html) to learn more.

Have fun!
