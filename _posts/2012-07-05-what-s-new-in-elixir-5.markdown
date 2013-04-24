---
layout: post
title: What's New in Elixir  &#35;5
author: José Valim
category: "What's New in Elixir"
excerpt: The series is back after the first, official 0.5.0 release and we are packed with information!
---

This is our first post from the What's New in Elixir series after [Elixir v0.5.0 was released](http://elixir-lang.org/blog/2012/05/25/elixir-v0-5-0-released/) and we have great improvements to share with you.

Many of these improvements are related to how Elixir handles macros, but we also have the addition of ranges, some performance improvements and other minor changes.

## API Changes ##

### List and bit comprehensions ###

The syntax for list and bit comprehensions was changed slightly to be more explicit and allow a developer to mix generators and filters:

    lc x inlist [1,2,3], rem(x, 2) == 0, y inlist [4,5,6], do: x * y
    #=> [8,10,12]

### The `__ENV__` pseudo-variable ###

Elixir provides many pseudo-variables that allow you to get information from the source code. For example, with `__MODULE__` you can get the current module name.

In Elixir master, two pseudo-variables were deprecated (`__LINE__` and `__FUNCTION__`) in favor of the `__ENV__` variable. The `__ENV__` variable returns a [`Macro.Env` record](http://elixir-lang.org/docs/master/Macro.Env.html) that contains not only the current line and function but extra information such as the aliases set, macros imported and modules required:

    iex> __ENV__.aliases
    []
    iex> alias List, as: L
    []
    iex> L.flatten([1,[2],3])
    [1,2,3]
    iex> __ENV__.aliases
    [{L,List}]

Besides the `__ENV__` variable, all macros can also access a `__CALLER__` pseudo-variable that contains the environment information about the caller. With such information, Elixir programmers can create more robust macros, as showed [in this commit which rewrites the `access` macro from Erlang to Elixir](https://github.com/elixir-lang/elixir/commit/088eff4c19614101cea55dfef9966d4de89181e3).

## Performance improvements ##

Regular expressions defined with the macros `%r` and `%R` are now compiled at compilation time instead of runtime, [as seen in this commit](https://github.com/elixir-lang/elixir/commit/646ee5f125601760bcd263105470545e0b7aa7f2). Our benchmarks showed that matching against [the regular expression defined in the URI module](https://github.com/elixir-lang/elixir/blob/ab61e6f95c37a8c0538f349a59be63ca00341b98/lib/uri.ex#L123) got twice faster:

    Regex.match? %r/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/, "http://foo.com/"
    #=> true

The `Enum` module was also optimized when handling lists. Micro benchmarks show improvements from 1.5 to 4x. Such work was done over many commits throughout the month, but here is [an example of how `Enum.all?` and `Enum.any?` were optimized](https://github.com/elixir-lang/elixir/commit/058f0f66965323ca9e792b5143929ffd7819ed9d).

## New features ##

### Type specifications ###

Elixir master also has shiny new features. Thanks to [Yurii Rashkovskii](https://github.com/yrashk), we now support [Erlang's type specification](http://www.erlang.org/doc/reference_manual/typespec.html):

    @spec add(integer, integer), do: integer
    def add(a, b), do: a + b

Many tools in the Erlang community, as [dialyzer](http://www.erlang.org/doc/man/dialyzer.html) and [PropEr](https://github.com/manopapad/proper/), use type specifications to give feedback and point out inconsistencies, tests and improvements to your codebase. Supporting type specification is an important milestone which allows Elixir to integrate better with the existing Erlang community.

### Ranges ###

Elixir master has initial support for ranges. Ranges can be created with the operator `..` and integrate nicely with guard clauses. For example, a function that converts a student score to a message could be written as:

    def score_to_message(x) when x in 0..40,   do: "Fail"
    def score_to_message(x) when x in 41..60,  do: "Pass"
    def score_to_message(x) when x in 61..70,  do: "Pass with Merit"
    def score_to_message(x) when x in 71..100, do: "Pass with Distinction"

Ranges can be extended via the range protocol, so developers can use their custom types in ranges and guard clauses too!

### Other improvements ###

There are many other improvements for the upcoming v0.6.0 release, including more robust and complete `IO` and `File` modules, more compilation callbacks with the `@before_compilation` and `@after_compilation` attributes and convenient helpers to work with macros, like `Macro.expand` that expands macros and `Macro.to_binary`, that receives a tree and converts it to its original source code:

    iex> tree = Macro.expand(quote(do: !foo), __ENV__)
    iex> IO.puts Macro.to_binary(tree)
    case(foo) do
      false ->
        true
      nil ->
        true
      _ ->
        false
    end

In the example above, we use `Macro.expand` to expand the expression `!foo` and then print it using `Macro.to_binary`. We can see that the operator `!` is simply a macro that translates the expression to a `case` expression.

## Community ##

Besides improvements to Elixir itself, Elixir's community is also working on tools to make their day-to-day life easier. One of such examples is [genx](https://github.com/yrashk/genx), which provides helpers to work with Erlang OTP behaviors such as `application`, `gen_event` and others.

More importantly, [rebar_elixir_plugin](https://github.com/yrashk/rebar_elixir_plugin) was also released to allow existing Erlang developers to compile Elixir source code using [Rebar](https://github.com/basho/rebar). For those not familar with Rebar, it is a build tool for Erlang projects created by [the good folks at Basho, from Riak fame](http://basho.com/).

Finally, our documentation generation tool [ExDoc](https://github.com/elixir-lang/ex_doc) was improved to include the function signatures and arguments, making it more friendly to developers. [The documentation for Elixir master with those improvements is available here](http://elixir-lang.org/docs/master/). Enjoy!
