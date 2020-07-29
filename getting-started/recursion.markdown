---
layout: getting-started
title: Recursion
---

# {{ page.title }}

{% include toc.html %}

## Loops through recursion

Due to immutability, loops in Elixir (as in any functional programming language) are written differently from imperative languages. For example, in an imperative language like C, one would write:

```c
for(i = 0; i < sizeof(array); i++) {
  array[i] = array[i] * 2;
}
```

In the example above, we are mutating both the array and the variable `i`. However, data structures in Elixir are immutable. For this reason, functional languages rely on recursion: a function is called recursively until a condition is reached that stops the recursive action from continuing. No data is mutated in this process. Consider the example below that prints a string an arbitrary number of times:

```elixir
defmodule Recursion do
  def print_multiple_times(msg, n) when n <= 1 do
    IO.puts msg
  end

  def print_multiple_times(msg, n) do
    IO.puts msg
    print_multiple_times(msg, n - 1)
  end
end

Recursion.print_multiple_times("Hello!", 3)
# Hello!
# Hello!
# Hello!
```

Similar to `case`, a function may have many clauses. A particular clause is executed when the arguments passed to the function match the clause's argument patterns and its guard evaluates to `true`.

When `print_multiple_times/2` is initially called in the example above, the argument `n` is equal to `3`.

The first clause has a guard which says "use this definition if and only if `n` is less than or equal to `1`". Since this is not the case, Elixir proceeds to the next clause's definition.

The second definition matches the pattern and has no guard so it will be executed. It first prints our `msg` and then calls itself passing `n - 1` (`2`) as the second argument.

Our `msg` is printed and `print_multiple_times/2` is called again, this time with the second argument set to `1`.
Because `n` is now set to `1`, the guard in our first definition of `print_multiple_times/2` evaluates to true, and we execute this particular definition. The `msg` is printed, and there is nothing left to execute.

We defined `print_multiple_times/2` so that, no matter what number is passed as the second argument, it either triggers our first definition (known as a _base case_) or it triggers our second definition, which will ensure that we get exactly one step closer to our base case.

## Reduce and map algorithms

Let's now see how we can use the power of recursion to sum a list of numbers:

```elixir
defmodule Math do
  def sum_list([head | tail], accumulator) do
    sum_list(tail, head + accumulator)
  end

  def sum_list([], accumulator) do
    accumulator
  end
end

IO.puts Math.sum_list([1, 2, 3], 0) #=> 6
```

We invoke `sum_list` with the list `[1, 2, 3]` and the initial value `0` as arguments. We will try each clause until we find one that matches according to the pattern matching rules. In this case, the list `[1, 2, 3]` matches against `[head | tail]` which binds `head` to `1` and `tail` to `[2, 3]`; `accumulator` is set to `0`.

Then, we add the head of the list to the accumulator `head + accumulator` and call `sum_list` again, recursively, passing the tail of the list as its first argument. The tail will once again match `[head | tail]` until the list is empty, as seen below:

```elixir
sum_list [1, 2, 3], 0
sum_list [2, 3], 1
sum_list [3], 3
sum_list [], 6
```

When the list is empty, it will match the final clause which returns the final result of `6`.

The process of taking a list and _reducing_ it down to one value is known as a _reduce algorithm_ and is central to functional programming.

What if we instead want to double all of the values in our list?

```elixir
defmodule Math do
  def double_each([head | tail]) do
    [head * 2 | double_each(tail)]
  end

  def double_each([]) do
    []
  end
end
```

```console
$ iex math.exs
```

```elixir
iex> Math.double_each([1, 2, 3]) #=> [2, 4, 6]
```

Here we have used recursion to traverse a list, doubling each element and returning a new list. The process of taking a list and _mapping_ over it is known as a _map algorithm_.

Recursion and [tail call](https://en.wikipedia.org/wiki/Tail_call) optimization are an important part of Elixir and are commonly used to create loops. However, when programming in Elixir you will rarely use recursion as above to manipulate lists.

The [`Enum` module](https://hexdocs.pm/elixir/Enum.html), which we're going to see in the next chapter, already provides many conveniences for working with lists. For instance, the examples above could be written as:

```elixir
iex> Enum.reduce([1, 2, 3], 0, fn(x, acc) -> x + acc end)
6
iex> Enum.map([1, 2, 3], fn(x) -> x * 2 end)
[2, 4, 6]
```

Or, using the capture syntax:

```elixir
iex> Enum.reduce([1, 2, 3], 0, &+/2)
6
iex> Enum.map([1, 2, 3], &(&1 * 2))
[2, 4, 6]
```

Let's take a deeper look at `Enumerable` and, while we're at it, its lazy counterpart, `Stream`.
