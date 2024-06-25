---
layout: post
title: Elixir v0.10.0 released
author: José Valim
category: Releases
excerpt: Elixir v0.10.0 is out with support for streams, sets, pretty printing and many improvements for Mix and ExUnit.
---

Elixir v0.10.0 is released with support for streams, sets and many improvements to the Mix and ExUnit applications.

## Streams

The default mechanism for working with collections in Elixir is the `Enum` module. With it, you can map over ranges, lists, sets, dictionaries and any other structure as long as it implements the `Enumerable` protocol:

```elixir
Enum.map([1, 2, 3], fn(x) -> x * 2 end)
#=> [2, 4, 6]
```

The `Enum` module performs eager evaluation. Consider the following example:

```elixir
[1, 2, 3]
  |> Enum.take_while(fn(x) -> x < 3 end)
  |> Enum.map(fn(x) -> x * 2 end)
#=> [2, 4]
```

In the example above, we enumerate the items in list once, taking all elements that are less than 3, and then we enumerate the remaining elements again, multiplying them by two. In order to retrieve the final result, we have created one intermediate list. As we add more operations, more intermediate lists will be generated.

This approach is simple and efficient for the majority of the cases but, when working with large collections, we can generate many, possibly large, intermediate lists affecting performance. That's one of the problems Streams solve. Let's rewrite the example above using Streams:

```elixir
[1, 2, 3]
  |> Stream.take_while(fn(x) -> x < 3 end)
  |> Stream.map(fn(x) -> x * 2 end)
#=> #Stream.Lazy<...>
```

Now, instead of getting the result back, we got a Stream. The list elements are yet to be enumerated! We can realize the stream  by calling any of the Enum functions, like `Enum.to_list/1`. By doing so the list will be iterated just once avoiding the intermediary representations.

In a nutshell, Streams are composable, lazy enumerables. Streams are also useful when doing IO or expressing infinite computations. We can retrieve a file as a stream:

```elixir
File.stream!("README.md")
```

In the example above, we got a stream that will enumerate the lines in the file one by one when enumerated. We could further extend the stream above, for example, by rejecting blank lines, and the file will be opened just when its results are actually needed.

Do you need a random number generator? We got your back:

```elixir
Stream.repeatedly(fn -> :random.uniform end) |> Enum.take(3)
#=> [0.4435846174457203, 0.7230402056221108, 0.94581636451987]
```

`Stream.repeatedly/1` returns an infinite stream but that's ok we just need its first three elements. You can learn more about [stream and related functions in `Stream` module documentation](https://hexdocs.pm/elixir/Stream.html).

## Sets

This release also adds [the Sets API](https://hexdocs.pm/elixir/Set.html) to Elixir and a HashSet implementation. The HashSet implementation follows [the same design goals as the HashDict implementation](/blog/2013/01/27/elixir-v0-8-0-released/) released at the beginning of this year, starting with a compact representation and expanding and contracting as needed.

This feature was a contribution from [Joseph Wilk](https://github.com/josephwilk) and he talks about its implementation and provides some benchmarks [on his blog](http://blog.josephwilk.net/elixir/sets-in-elixir.html).

## Pretty printing

Another addition to this release is pretty printing. The pretty printing started as an implementation of the [Wadler paper](http://homepages.inf.ed.ac.uk/wadler/papers/prettier/prettier.pdf) by [Jonns Mostovoys](https://github.com/manpages) which was then improved by [Gustavo Brunoro](https://github.com/brunoro) under his Google Summer of Code project as described in [Lindig's _Strictly Prettier_ paper](http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.34.2200).

As soon as you upgrade to Elixir v0.10.0 and start IEx, you will get pretty printing for all data structures provided by Elixir. We have also added documentation to the `Inspect` module about [adding pretty printing to your own structures](https://hexdocs.pm/elixir/Inspect.html) as well as [using the document algebra for any other kind of formatting](https://hexdocs.pm/elixir/Inspect.Algebra.html).

## Other improvements

Other notable improvements are:

* We have improved Mix to be able to fetch Rebar dependencies, making integration with the existing Erlang ecossystem much easier, thanks to [Eric Meadows-Jonsson](https://github.com/ericmj);

* ExUnit now supports the trace option, enabled via `mix test --trace`, which forces tests to run sequentially and print the test names and extra information as it goes;

* We are also working hard on Windows support, improving its command-line tools and working towards a green test suite, thanks to [Tom Jansens](https://github.com/tojans);

* Meta-programming in Elixir was also improved by the addition of the `binding/0` and `binding/1` macros plus the additions of `Macro.expand_once/2` and `Macro.expand_all/2` to the [`Macro` module](https://hexdocs.pm/elixir/Macro.html);

There are also improvements to typespecs, error messages, many bug fixes and some backwards incompatible changes. We have posted a detailed [upgrade instructions on the mailing list](https://groups.google.com/forum/?fromgroups#!topic/elixir-lang-talk/ksrefrgK1eY). For a general overview, [check out the CHANGELOG](https://github.com/elixir-lang/elixir/blob/v0.10.0/CHANGELOG.md).

Give Elixir a try! You can start with our [getting started guide](https://hexdocs.pm/elixir/introduction.html), or check out our sidebar for other learning resources.
