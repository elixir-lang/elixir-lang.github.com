---
title: "Elixir v1.20 released: now a gradually typed language"
excerpt: "From Elixir v1.20, every program is now gradually type checked in search for verified bugs and typing violations."
date: 2026-06-03
author: "José Valim"
category: "Releases"
tags: []
---

In 2022, [we announced the effort to add set-theoretic types to Elixir](/blog/2022/10/05/my-future-with-elixir-set-theoretic-types/). In June 2023, we [published an award winning paper on Elixir's type system design](https://arxiv.org/abs/2306.06391) and said our work was transitioning [from research to development](/blog/2023/06/22/type-system-updates-research-dev/).

With Elixir v1.20, we have completed our first development milestone which is to perform type inference and gradually type check every Elixir program, without introducing type annotations. This means Elixir increasingly reports dead code and *verified bugs*: typing violations that are guaranteed to fail at runtime if executed. Elixir can find verified bugs in existing programs efficiently, without introducing developer overhead, and with an extremely low false positives rate.

In this announcement, we will break down the type system goals, what the `dynamic()` type means in Elixir, and how it finds *verified bugs*. In particular, our implementation performs well in the ["If T: Benchmark for Type Narrowing"](https://github.com/utahplt/ifT-benchmark/tree/main#benchmark-results) benchmark. Elixir passes 12 of the 13 categories, showing that it can recover precise type information from ordinary Elixir code, which we use to find verified bugs in dynamically typed programs.

The type system was made possible thanks to a partnership between [CNRS](https://www.cnrs.fr/) and [Remote](https://remote.com/). The development work is currently sponsored by [Fresha](https://www.fresha.com/), and [Tidewave](https://tidewave.ai/).

## Types, in my Elixir?

Our goal is to introduce a type system which is:

* **sound** - the types inferred and assigned by the type system align with the behaviour of the program

* **gradual** - Elixir's type system includes the `dynamic()` type, which can be used when the type of a variable or expression is checked at runtime. In the absence of `dynamic()`, Elixir's type system behaves as a static one

* **developer friendly** - the types are described, implemented, and composed using basic set operations: unions, intersections, and negations (hence it is a set-theoretic type system), with clear error messages

Introducing a type system into an existing language is a complex change. For this reason, our first milestone was to implement the type system without introducing typing annotations but still have it provide value to developers by finding dead code and verified bugs. This is done through the `dynamic()` type, which in Elixir is quite different from other gradually typed languages. Let's break it down.

## The `dynamic()` type

Many gradual type systems have the `any()` type, which, from the point of view of the type system, often means "anything goes" and no type violations are reported. On the other hand, Elixir's gradual type is called `dynamic()` and it has two important properties: compatibility and narrowing.

In static type systems, when you have a type of shape `integer() or binary()` and you invoke a function, said function must accept both types. However, because type systems cannot capture the intention of all of our programs with precision, this may lead to false positives. For example, take the simple code below:

```elixir
def percentage_or_error(value) when is_integer(value) do
  value_or_error =
    if value > 1 do
      value
    else
      "not well"
    end

  # ... more code ...

  if value > 1 do
    value_or_error / 100
  else
    String.upcase(value_or_error)
  end
end
```

Although `value_or_error` has type `integer() or binary()`, the operator `/` accepts only numbers, and `String.upcase` accepts only binaries/strings, the program above is valid and emits no exceptions at runtime. However, a type system would still report two violations, because the types supplied to `/` and `String.upcase` are not a subtype of the accepted types.

While the program above could be better written to have no typing violations, type systems will always reject valid programs, and if Elixir were to introduce too many false positives in existing codebases, it would quickly erode the trust in the type system. Therefore, Elixir's gradual type system tags the `value_or_error` variable above with the type `dynamic(integer() or binary())`, which means the type is either `integer() or binary()` at runtime.

When calling a function with a `dynamic()` type, Elixir will only emit a typing violation if the supplied types and the accepted types are disjoint. In the program above, even though `/` expects only numbers, `dynamic(integer() or binary())` can be an `integer()` and given the accepted and supplied types are not disjoint, there are no typing violations. However, if we were to change the program to this:

```elixir
value_or_error =
  if value > 1 do
    value
  else
    "not well"
  end

Map.fetch!(value_or_error, :some_key)
```

Because `Map.fetch!` expects a map data structure, and `value_or_error` can only be integer or binary at runtime, the accepted and supplied types are disjoint, which turns into a violation. This is known as the compatibility property and it explains how Elixir reports only *verified bugs*.

However, reporting only verified bugs would not be useful if we can't find many bugs in the first place. We addressed this problem by making sure Elixir's dynamic type can be narrowed. Take this code:

```elixir
def add_a_and_b(data) do
  data.a + data.b
end
```

In the program above, `data` starts as a `dynamic()` type. We then use it as `data.a` and `data.b` inside the plus operator, so Elixir will refine the `data` variable to have type `%{..., a: number(), b: number()}`, which implies it is a map with both `a` and `b` fields with number values (and potentially any other field, hence the leading `...`). Therefore, if you were to forget to select the `.b` field and write this:

```elixir
def add_a_and_b(data) do
  data.a + data
end
```

`data` would be first narrowed to a map of shape `%{..., a: number()}`, then attempted to be used as a `number()`, which would emit a violation.

In other words, the `dynamic()` type in Elixir effectively works as a range, which can be refined as it is used throughout the program and reports violations whenever type checks fall outside of the range. This is a contrast to other gradual type systems, which use the dynamic type to discard all type information.

Behind the scenes, our type inference and type checking algorithms behave as if we annotated all argument types as `dynamic()`. Once we introduce user-supplied type annotations, Elixir's type system will behave as any statically typed language as long as `dynamic()` is not used. And whenever you cross the static-dynamic boundary, we [developed new techniques that ensure our gradual typing is sound, without a need for additional runtime checks](/blog/strong-arrows-gradual-typing/).

## Typing guards, clauses, and more

Most of the work behind this release was to introduce type checking and narrowing to several constructs. Let's see some of them.

When it comes to guards, we can infer unions, intersections, and negations:

```elixir
def example(x, y) when is_list(x) and is_integer(y)
```

The code above correctly infers `x` is a list and `y` is an integer.

```elixir
def example({:ok, x} = y) when is_binary(x) or is_integer(x)
```

The one above infers x is a binary or an integer, and `y` is a two element tuple with `:ok` as first element and a binary or integer as second.

```elixir
def example(x) when is_map_key(x, :foo)
```

The code above infers `x` is a map which has the `:foo` key, represented as `%{..., foo: dynamic()}`. Remember the leading `...` indicates the map may have other keys.

```elixir
def example(x) when not is_map_key(x, :foo)
```

And the code above infers `x` is a map that does not have the `:foo` key, which has the type: `%{..., foo: not_set()}`.  Hence `x.foo` within the function body will raise a typing violation.

You can also have expressions that assert on the size of data structures:

```elixir
def example(x) when tuple_size(x) < 3
```

Elixir will correctly track the tuple has at most two elements, and therefore accessing `elem(x, 3)` will emit a typing violation. For maps and lists, we convert size checks into emptiness ones. In other words, Elixir can look at complex guards, infer types, and use this information to find bugs in our code.

When it comes to constructs such as `case` and conditionals, Elixir uses information from previous clauses to refine subsequent ones:

```elixir
case System.get_env("SOME_VAR") do
  nil -> :not_found
  value -> {:ok, String.upcase(value)}
end
```

`System.get_env("SOME_VAR")` returns either `nil` or a `binary()`. Because the first clause matches on `nil`, the type system knows `value` can no longer be `nil`, and therefore it must only be a `binary()`, which allows the second clause to also type check without violations. Narrowing across clauses also helps the type system find redundant clauses and dead code in existing codebases.

Furthermore, we have typed many functions in the standard library that work with tuples and maps. You can find more details in the [release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.20.0).

## Compilation time improvements

Elixir v1.20 also improves compilation times once more, especially on applications running on machines with many cores. [Even though BEAM languages are efficient to compile in general, our synthetic benchmarks now place Elixir's build tool as the fastest among them](https://github.com/josevalim/langcompilebench). If you would like to contribute more examples and scenarios, please start a discussion so we can provide a transparent suite of benchmarks and results.

It also introduces a new compiler option called `:module_definition`, which specifies if the module definition should be `:compiled` (the default) or `:interpreted`. This may improve compilation times in large projects and it does not affect the `.beam` files written to disk, only how the contents inside `defmodule` are executed. You can enable it by setting `elixirc_options: [module_definition: :interpreted]` in your `mix.exs`. [Read the documentation to learn more](https://elixir.hexdocs.pm/1.20.0/Code.html#put_compiler_option/2).

## What is next?

The biggest question ahead of us is: when will Elixir introduce new type signatures that leverage set-theoretic types? As recently discussed [in my ElixirConf EU 2026 keynote](https://youtu.be/Ay-gnCqDw9o?t=2389), we still have both research and development work ahead of us. We will only introduce type signatures:

  * if we are satisfied with the type system performance in Elixir v1.20 (and we have done [extensive](/blog/2025/12/02/lazier-bdds-for-set-theoretic-types/) [work](/blog/2026/02/26/eager-literal-intersections/) [optimizing](/blog/2026/03/19/lazy-bdds-with-eager-literal-differences/) it)
  * if we can implement recursive types efficiently
  * if we can implement parametric types efficiently
  * if we can implement traversing key-value pairs of maps as an enumerable efficiently (we are still researching the possible solutions here)

Once those problems are tackled, we will start to explore and discuss typed struct definitions and finally type signatures. As usual, we will keep the community posted through news and [in the Elixir Forum](https://elixirforum.com/).

We appreciate everyone who tried the release candidates, ran benchmarks, and gave us feedback! Give Elixir v1.20 a try and remember to fix all of the bugs it will find for free!
