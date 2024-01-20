---
layout: post
title: Elixir v0.9.0 released
author: José Valim
category: Releases
excerpt: Elixir v0.9.0 is released with support for reducers, umbrella projects, faster compilation times and dropped support for R15 and earlier OTP versions.
---

While [Programming Elixir](https://pragprog.com/book/elixir/programming-elixir) was being announced, we have been working on Elixir v0.9.0 which is finally out. This release contains new features, important performance optimizations and bug fixes.

Elixir v0.9.0 also removes support for Erlang R15 and earlier versions. In case you still need to run Elixir software on R15, we have also released Elixir v0.8.3, which contains many of the enhancements in v0.9.0. Check the [CHANGELOG for more details for both releases](https://github.com/elixir-lang/elixir/blob/v0.9.0/CHANGELOG.md).

All this work was achieved by our very vibrant community! Over the last month, 17 authors have pushed more than 500 commits, where more than 60 pull requests were merged and more than 80 issues were closed.

Let's talk about the goodies!

## Compilation time improvements

We have spent some time improving compilation time. The particular scenario we have worked on was the definition of records:

```elixir
defrecord User, name: nil, age: nil
```

Records are a good scenario because they are implemented in Elixir, using Elixir macros, and they also define a module underneath, which exercises the Erlang VM compilation stack.

We have used [fprof](http://www.erlang.org/doc/man/fprof.html) to identify the bottlenecks and made the compilation stack 35% faster. We have also identified bottlenecks coming from Erlang and [pushed some patches](https://github.com/erlang/otp/commit/32b194495f353dde014b00008a630eeff2a71056) that should benefit both Elixir and Erlang code.

A special thanks to [Yurii Rashkovskii](https://github.com/yrashk) for the data and profiling.

## Umbrella projects

In Elixir, an application denotes a component implementing some specific functionality, that can be started and stopped as a unit, and which can be re-used in other systems as well.

As a project grows, it is recommended to break it apart into smaller, isolated applications and bundle them together. The issue so far was that Elixir did not provide good support for working with many applications at once, and compiling and managing those applications became rather a tedious work.

Elixir v0.9.0 now supports umbrella projects which can work with many applications at the same time. You can create a new umbrella project with:

```bash
$ mix new my_project --umbrella
```

The generated project will have the following structure:

    apps/
    mix.exs
    README.md

Now, inside the `apps` directory, you can create as many applications as you want and running `mix compile` inside the umbrella project will automatically compile all applications. The [original discussion for this feature](https://github.com/elixir-lang/elixir/issues/667) contains more details about how it all works.

A special thanks to [Eric Meadows-Jonsson](https://github.com/ericmj) for implementing this feature and to [Yurii](https://github.com/yrashk) for testing it against different edge cases.

## Reducers

Elixir v0.9.0 changes its main abstraction for enumeration from iterators to reducers. Before Elixir v0.9.0, when you invoked:

```elixir
Enum.map([1, 2, 3], fn(x) -> x * x end)
#=> [1, 4, 9]
```

It asked the `Enum.Iterator` protocol for instructions on how to iterate the list `[1, 2, 3]`. This iteration happened by retrieving each item in the list, one by one, until there were no items left.

This approach posed many problems:

* Iterators are very hard to compose;
* Iterators contain state. You need to know, at each moment, what is the next element you have to iterate next. We use functions and their bindings to pass the iteration state around;
* Iterators have the "dangling open resource" problem. Consider that you want to iterate a file with `Enum.map/2` as above. If any step during the iteration fails, there is no easy way to notify the resource being iterated  (in this case, the opened file) that iteration failed, so we can't close the file automatically, leaving it to the user.

Reducers solve all of those problems by using a more functional approach. Instead of asking a list to spill its elements out one by one and then working on each element, we now generate a recipe of computations and pass it down to the list which applies those computations on itself.

Here is how we implement the `Enumerable` protocol for lists:

```elixir
defimpl Enumerable, for: List do
  def reduce(list, acc, fun) do
    do_reduce(list, acc, fun)
  end

  defp do_reduce([head | tail], acc, fun) do
    do_reduce(tail, fun.(head, acc), fun)
  end

  defp do_reduce([], acc, fun) do
    acc
  end
end
```

The implementation above works as a simple `reduce` function (also called `fold`, `inject` or `foldl` in other languages). Here is how it works:

```elixir
# Sum all elements in a list
Enumerable.reduce([1, 2, 3], 0, fn(x, acc) -> x + acc end)
#=> 6
```

The `Enum.map/2` we have used above is now implemented in terms of this reducing function:

```elixir
defmodule Enum do
  def map(collection, fun) do
    Enumerable.reduce(collection, [], fn(x, acc) ->
      [fun.(x, acc) | acc]
    end) |> reverse
  end
end
```

This approach solves all the problems above:

* Reducers are composable (notice how we have implemented map on top of reduce by composing functions);
* Reducers are self-contained: there is no need keep state around, which also solves the "dangling open resource" problem. The data type now knows exactly when the iteration starts and when it finishes;
* Reducers do not dictate how a type should be enumerated. This means types like `Range` and `HashDict` can provide a much faster implementation for Reducers;
* Furthermore, the end result is a cleaner implementation of most of `Enum` functions (the [reducers pull request](https://github.com/elixir-lang/elixir/pull/1102) removes over 500LOC) and better performance!

Reducers also opens up room for lazy and parallel enumeration, as [the Clojure community has already proven](http://clojure.com/blog/2012/05/08/reducers-a-library-and-model-for-collection-processing.html) and something we are looking forward to explore on upcoming releases.

A special thanks to [Eric Meadows-Jonsson](https://github.com/ericmj) for implementing this feature!

## Other bits

We have also many other smaller improvements:

* Our CLI now supports `--hidden` and `--cookie` flags which are useful for distributed modes;
* Our test framework, ExUnit, is now able to capture all the communication that happens with a registered IO device, like `:stdio` and `:stderr`, via [`ExUnit.CaptureIO`](https://hexdocs.pm/ex_unit/ExUnit.CaptureIO.html). This is very useful for testing how your software reacts to some inputs and what it prints to the terminal;
* `IEx` now allows files to be imported into the shell with `import_file` and also loads `~/.iex` on startup for custom configuration;
* The `String`, `Enum` and `Dict` modules got more convenience functions that goes from checking unicode character validity to taking values out of a dictionary;
* And many, many more!

A huge thank you to our community for sending bug reports, providing bug fixes and contributing all those amazing features. And when are **you** joining us? :)

Give Elixir a try! You can start with our [getting started guide](https://hexdocs.pm/elixir/introduction.html), or [check this 30 minute video from PragProg](https://www.youtube.com/watch?v=a-off4Vznjs&feature=youtu.be) or buy the beta version of [Programming Elixir](https://pragprog.com/book/elixir/programming-elixir).
