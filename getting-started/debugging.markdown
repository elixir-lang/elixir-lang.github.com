---
layout: getting-started
title: Debugging
---

# {{ page.title }}

{% include toc.html %}

There are a number of ways one can debug their code in Elixir. In this chapter we will cover some of the more common ways of doing so.

## IO.inspect/2

What makes `IO.inspect(item, opts \\ [])` really useful in debugging is that it returns the `item` argument passed to it without affecting the behavior of the original code. Let's see how that is so with an example.

```elixir
(1..10)
|> IO.inspect
|> Enum.map(fn x -> x * 2 end)
|> IO.inspect
|> Enum.sum
|> IO.inspect
```

Prints:
```elixir
1..10
[2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
110
```

As you can see here `IO.inspect/2` makes it possible to "spy" on values almost anywhere in your code like in the above case without altering the result. One of the places where IO.inspect is very helpful is when we have to debug code one or more times inside of a pipeline like in the above case.

Another handy thing that the `IO.inspect/2` function provides is the ability to decorate the output with a `label` option. The label will be printed before the inspected `item`. A sample usecase where this could be handy is shown below.

```elixir
[1, 2, 3]
|> IO.inspect(label: "before")
|> Enum.map(&(&1 * 2))
|> IO.inspect(label: "after")
|> Enum.sum
```

Prints:

```elixir
before: [1, 2, 3]
after: [2, 4, 6]
```


Please see [IO.inspect/2](https://hexdocs.pm/elixir/IO.html#inspect/2) to read more about other ways in which one could use this function. Also, in order to find a full list of other formatting options that one can use alongside `IO.inspect/2` please see [Inspect.Opts](https://hexdocs.pm/elixir/Inspect.Opts.html) .


## IEx.pry