---
layout: post
title: Elixir's new continuable enumerators
author: Peter Minten
category: Internals
excerpt: In 0.12.0 Elixir's enumerators have gained the ability to suspend value
         production and to terminate early.
---

As you may have heard in the upcoming 0.12.0 release Elixir's enumerators gained
some new features. In this blog post I'll explain what's new, what it enables
and how it works.

For those of you who use the development version of Elixir these changes are
already available. For the exact differences in code you can look at the
[relevant pull request](https://github.com/elixir-lang/elixir/pull/1922).

## A recap of enumerators, and some terminology

The basic idea of enumerators is that you traverse some data structure or
resource (lines from a file) by putting the thing that is traversed in control.
That is if you're reading from a file you have a loop that reads lines from a
file and for each line calls a function. Just calling a function isn't all that
useful for most tasks as there'd be no way to remember previous lines (ugly
hacks aside), so some accumulator value is passed to the function and a new
accumulator is returned by it.

For example here's how you can count the total length of strings in a list.

```elixir
Enumerable.reduce(l, 0, fn x, acc -> String.length(x) + acc end)
```

Often the actual call to `Enumerable.reduce/3` is hidden inside another
function.  Say that we want to define a `sum` function. The usual way is to
write it like this:

```elixir
def sum(coll) do
  Enumerable.reduce(coll, 0, fn x, acc -> x + acc end)
end
```

This could get called as `Enum.map(1..10, &(&1 * &1)) |> sum()` to get the sum of
squares. Desugaring this means `sum(Enum.map(1..10, &(&1 * &1)))`.

The general pattern is this:

```elixir
def outer_function(coll, ...) do
  ...
  Enumerable.reduce(coll, initial_consumer_acc, consumer)
  ...
end

something_that_returns_an_enumerable(...) |> outer_function(...)
```

You'll notice the slightly uncommon terminology of "outer function" and
"consumer" (normally called an "iteratee"). That's intentional, naming an
iteratee a consumer better reflects that it consumes values.

Along the same lines I call the reduce function for a specific enumerable a
producer, it produces values which are given to a consumer.

The outer function is the function to which the enumerable is passed.
Syntactically it looks like this is the consumer, but it's really a function
that combines the producer and the consumer. For simple consumers (say `fn x,
acc -> length(x) + acc end`) the consumer will often be written directly in the
source text of the outer function, but let's try to keep those concepts
distinguished.

## Two issues with classic Elixir enumerators

Enumerators are great, but they have their limitations. One issue is that it's
not possible to define a function that only returns at most 3 elements without
traversing all elements or using ugly tricks such as `throw` (with a
`try...catch` construct in the outer function). The `throw` trick is used in
`Enum` and `Stream` to implement functions such as `Enum.take/2` and
`Stream.take_while/2`. It works, but it's not what I'd call stylish.

A bigger problem, that doesn't have a workaround, is that there's no way to
interleave two enumerables. That is, it's not possible to define a function that
for two enumerables `A` and `B` returns a list `[A1, B1, A2, B2, A3, ...]`
(where `A1` is the first element of A) without first traversing both lists and
then interleaving the collected values. Interleaving is important because it's
the basis of a zip function. Without interleaving you cannot implement
`Stream.zip/2`.

The underlying problem, in both cases, is that the producer is fully in control.
The producer simply pushes out as many elements to the consumer as it wants and
then says "I'm done". There's no way aside from `throw/raise` for a consumer
to tell a producer "stop producing". There is definitely no way to tell a
producer "stop for now but be prepared to continue where you left off later".

## Power to the consumer!

At CodeMeshIO José Valim and Jessica Kerr sat down and discussed this problem.
They came up with a solution inspired by a [Monad.Reader
article](http://themonadreader.files.wordpress.com/2010/05/issue16.pdf) (third
article). It's an elegant extension of the old system, based on a simple idea.
Instead of returning only an accumulator at every step (for every produced
value) the consumer returns a combination of an accumulator and an instruction
to the producer. Three instructions are available:

* `:cont` - Keep producing.
* `:halt` - Stop producing.
* `:suspend` - Temporarily stop producing.

A consumer that always returns `:cont` makes the producer behave exactly the
same as in the old system. A consumer may return `:halt` to have the producer
terminate earlier than it normally would.

The real magic is in `:suspend` though. It tells a producer to return the
accumulator and a continuation function.

```elixir
{ :suspended, n_, cont } = Enumerable.reduce(1..5, { :cont, 0 }, fn x, n ->
  if x == 3 do
    { :suspend, n }
  else
    { :cont, n + x }
  end
end)
```

After running this code `n_` will be `3` (1 + 2) and `cont` will be a
function. We'll get back to `cont` in a minute but first take a look at some of
the new elements here. The initial accumulator has an instruction as well, so
you could suspend or halt a producer immediately, if you really want to. The
value passed to the consumer (`n`) does not contain the instruction. The return
value of the producer also has a symbol in it. Like with the instructions of
consumers there are three possible values:

* `:done` - Completed normally.
* `:halted` - Consumer returned a `:halt` instruction.
* `:suspended` - Consumer return a `:suspend` instruction.

Together with the other values returned the possible return values from a
producer are `{ :done, acc } | { :halted, acc } | { :suspended, acc,
continuation }`.

Back to the continuation. A continuation is a function that given an accumulator
returns a new producer result. In other words it's a way to swap out the
accumulator but keep the same producer in the same state.

## Implementing `interleave`

Using the power of suspension it is now possible to create an interleave
function.

```elixir
defmodule Interleave do
  def interleave(a, b) do
    step = fn x, acc -> { :suspend, [x|acc] } end
    af = &Enumerable.reduce(a, &1, step)
    bf = &Enumerable.reduce(b, &1, step)
    do_interleave(af, bf, []) |> :lists.reverse()
  end

  defp do_interleave(a, b, acc) do
    case a.({ :cont, acc }) do
      { :suspended, acc, a } ->
        case b.({ :cont, acc }) do
          { :suspended, acc, b } ->
            do_interleave(a, b, acc)
          { :halted, acc } ->
            acc
          { :done, acc } ->
            finish_interleave(a, acc)
        end
      { :halted, acc } ->
        acc
      { :done, acc } ->
        finish_interleave(b, acc)
    end
  end

  defp finish_interleave(a_or_b, acc) do
    case a_or_b.({ :cont, acc }) do
      { :suspended, acc, a_or_b } ->
        finish_interleave(a_or_b, acc)
      { _, acc } ->
        acc
    end
  end
end

Interleave.interleave([1,2], [:a, :b, :c, :d])
#=> [1, :a, 2, :b, :c, :d]
```

Lets go through this step by step. The main `interleave` function first
partially applies `Enumerable.reduce/3` to get function values that work just
like the continuations. This makes things easier for `do_interleave`.

The `do_interleave` function first calls `a` (`af` from `interleave`) with the
`step` function so that the available element of `a` gets added to the
accumulator and `a` immediately suspends afterwards. Then the same is done for
`b`. If either producer is done all the remaining elements of the other get
added to the accumulator list.

Note that `acc` is sometimes used to mean a tuple like `{ :cont, x }` and
sometimes the accumulator value proper. It's a bit confusing, yes.

This example shows that through clever combination of an outer function
(`do_interleave`) and an inner function `step` two producers can be interleaved.

## Conclusion

The new system of enumerators certainly makes things a bit more complicated but
also adds power. I suspect many interesting and "interesting" functions can be
built on top of it.
