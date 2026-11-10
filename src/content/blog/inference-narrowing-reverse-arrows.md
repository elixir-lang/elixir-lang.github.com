---
title: "Type inference and narrowing with reverse arrows"
excerpt: "This article explains how Elixir implements type inference and type narrowing using reverse arrows."
date: 2026-11-10
author: "José Valim, Guillaume Duboc"
category: "Internals"
tags: []
---

This article explains how Elixir implements type inference and type narrowing
using reverse arrows: a small set of composable ideas, rather than special cases
hardcoded into the type checker.

Thanks to this work, the upcoming Elixir v1.21 passes all tests in the
[If-T: Type Narrowing Benchmark by Guo et al.](https://github.com/utahplt/ifT-benchmark).
This means v1.21 can find even more sure bugs in existing Elixir programs and, once
type signatures are introduced, narrowing will give us more precise types and fewer
false positives.

> The type system was made possible thanks to a partnership between [CNRS](https://www.cnrs.fr/)
> and [Remote](https://remote.com/). The development work is currently sponsored by
> [Supermethod](https://www.supermethod.com/) and [Dashbit](https://dashbit.co/).

## Type inference

Elixir performs type inference by refining the dynamic type. This is quite different
from how inference and gradual typing are implemented in most type systems, so let's
break it down.

In many gradual languages, the dynamic type, often known as `any`, is a "black box" and
can be used in any context. For example, imagine this Elixir function, where `x` starts
with type `dynamic()`, as there is no type signature:

```elixir
def using_x_as_number_and_binary(x) do
  IO.puts x * 2
  IO.puts byte_size(x)
  :ok
end
```

The program above uses `x` both as a number (more precisely, as `integer() or float()`
in `x * 2`) and as a bitstring in `byte_size(x)`. In some gradual type systems, the type
checker will accept the program above, even though it will crash at runtime, because
the dynamic type can be used in any context.

However, in Elixir, the `dynamic()` type can be refined, and the above will report the
following typing violation:

```
warning: incompatible types given to Kernel.byte_size/1:

    byte_size(x)

given types:

    dynamic(float() or integer())

but expected one of:

    bitstring()

where "x" was given the type:

    # type: dynamic(float() or integer())
    # from: iex:3
    x * 2

└─ iex:4: Foo.using_x_as_number_and_binary/1
```

As you can see in the error message, Elixir infers that the type of `x` after
`x * 2` is a `dynamic(float() or integer())`. This means that `x` can be given
to any function that accepts at least one of `float()` or `integer()`. However,
because `byte_size(x)` expects a bitstring, we have a typing violation.

This is possible because `dynamic()` in Elixir actually means `dynamic(term())`,
where `term()` is the top type. Then, as a variable is used throughout the code,
its dynamic type is refined by intersecting its type with the arguments of the
functions the code invokes. In other words, we go through the following steps:

1. `x` starts as `dynamic(term())`

2. `x` is given to `x * 2`. The left operand of `*` expects `integer() or float()`,
   which we then intersect with `term()`, and therefore `x` gains the type
   `dynamic(integer() or float())`

3. `x` is given to `byte_size(x)`, which expects a bitstring. The intersection
   of `integer() or float()` with `bitstring()` is empty, which will lead to a
   typing violation

Now, let's take a look at this program:

```elixir
def using_x_as_integer(x) do
  IO.puts x * 2
  IO.puts rem(x, 2)
  :ok
end
```

This time, we pass `x` to the remainder function, `rem`, which expects all of its
inputs to be integers. This means that, at the end of this function, Elixir will
correctly infer that `x` can only be an integer, because `x` was refined from
`dynamic(term())` to `dynamic(integer() or float())` and then only to `dynamic(integer())`.
The inferred type for `using_x_as_integer` is a function, commonly written using
the arrow notation: `dynamic(integer()) -> :ok`.

The best part is that all dynamic types in Elixir are refined and therefore the type
system is always doing its best to find bugs, even in the presence of dynamism.
And the refinement itself is often quite precise, thanks to reverse arrows, which we
will explore next.

## Reverse arrows

An arrow is the type of a function: `integer() -> boolean()` is an arrow that
says "given an integer, this function returns a boolean". The type on the left
of the arrow is its domain (what it accepts) and the type on the right is its
codomain (what it returns). Every function has arrows, whether they come from
a type signature you wrote or are inferred by Elixir from the function's clauses.

Functions in Elixir can be typed with multiple arrows. As an exercise, let's take
a function that negates numbers, such as `negate(1)` returning `-1`:

```elixir
def negate(number) when is_integer(number), do: 0 - number
def negate(number) when is_float(number), do: 0.0 - number
```

You could give it this type signature with a single arrow:

```elixir
$ integer() or float() -> integer() or float()
def negate(number)
```

However, this type says that, if you give it an integer, it may return a
float, which is never the case! This signature is too broad. Instead, we
could give it this signature with two arrows:

```elixir
$ integer() -> integer()
$ float() -> float()
def negate(number)
```

This precisely captures that, if you give it an integer, it returns an integer.
If you give it a float, it returns a float. Multiple arrows are an excellent way
to type functions with multiple clauses, which are common in both Erlang and Elixir.

With this in mind, and remembering that `rem` only works on integers (its type is
`integer(), integer() -> integer()`), what do you believe is the inferred type of
`x` in the function below?

```elixir
def negated_remainder(x), do: rem(negate(x), 2)
```

You may think `x` is `dynamic(integer() or float())`, because that's the domain of
`negate`. However, `x` will once again be inferred to be `dynamic(integer())`,
because Elixir propagates types through the arrows in reverse: it starts from
what the outermost call expects and walks inwards, from results to arguments,
until it reaches the variables. Let's break it down.

1. We start type checking the function and we find `rem(negate(x), 2)`. `rem` has
   a single arrow, `integer(), integer() -> integer()`, so we know that `negate(x)`
   must return an `integer()` for this to type check

2. Now we type check `negate(x)`. `negate` has two arrows: `integer() -> integer()`
   and `float() -> float()`. Since its result must be an integer, we can discard
   the `float() -> float()` arrow, as it never returns an integer. The only remaining
   arrow is `integer() -> integer()`, so the argument of `negate` must be `integer()`

3. Now we type check `x` itself. `x` starts with the type `dynamic(term())`. We then
   intersect it with `integer()`, resulting in `dynamic(integer())`

In other words, inference goes in two directions. Going forward, from arguments to
results, arrows tell us what each call returns. Going in reverse, from results to
arguments, arrows tell us what each argument must have been for the call to produce
the expected result. As we give precise type signatures to our programs using multiple
arrows, the type system will use these same arrows to infer precise types. As we will
learn next, Elixir uses this technique to infer types from guards and to perform type
narrowing (also known as occurrence typing).

## Guards

Now we have the foundation to understand how Elixir performs type inference of guards.
Take this function clause:

```elixir
def something(x, y) when is_integer(x) and is_bitstring(y) do
  ...
```

Both `x` and `y` start with type `dynamic(term())`. We also know that a guard only
succeeds if it returns `true` and we have the following type signatures (roughly):

```elixir
$ true, true -> true
$ true, false -> false
$ false, true -> false
$ false, false -> false
def and(left, right)

$ integer() -> true
$ not integer() -> false
def is_integer(value)

$ bitstring() -> true
$ not bitstring() -> false
def is_bitstring(value)
```

Therefore, to infer the types of `when is_integer(x) and is_bitstring(y)`,
we start with `true`, which is the only result for which a guard succeeds,
and propagate it through the arrows in reverse:

1. The only arrow of `and` that can return `true` is `true, true -> true`,
   therefore we know that both operands must be `true`

2. The only arrow of `is_integer` that can return `true` is `integer() -> true`,
   therefore we know `x` must be an integer

3. The only arrow of `is_bitstring` that can return `true` is `bitstring() -> true`,
   therefore we know `y` must be a bitstring

If multiple arrows could return `true`, we would then simply union their domains.

It is worth emphasizing that this behaviour is not hardcoded to a handful of
functions the type checker knows about. It works with any function, in any context.
Let's see more examples.

## Type narrowing (also known as occurrence typing)

Occurrence typing refines the type of variables and expressions based on
the branch taken in a conditional or pattern match, so the same variable may
have different types in different branches. For example:

```elixir
if is_bitstring(x) do
  x #=> x has type: bitstring()
else
  x #=> x has type: not bitstring()
end
```

The mechanism we use to perform occurrence typing is quite similar to the one
from the previous sections. Within the `do`-branch, we consider the scenarios
where `is_bitstring(x)` will return `true`. Within the `else`-branch, we consider
the ones where it returns `false`.

And since our foundation is built on reverse arrows, the narrowing also applies to
patterns and `case`-expressions! For example:

```elixir
def f(x) do
  case parse(x) do
    {:ok, _} -> ... # x is integer()
    :error -> ...   # x is bitstring()
  end
end

defp parse(x) when is_integer(x), do: {:ok, x}
defp parse(x) when is_bitstring(x), do: :error
```

Here, `parse` has no type signature, but Elixir infers its arrows from its clauses:
`integer() -> {:ok, integer()}` and `bitstring() -> :error`. Within the first branch,
we know `parse(x)` returned a tuple, and the only arrow that returns a tuple has
`integer()` as its domain, so `x` must be an integer.

The [If-T benchmark](https://github.com/utahplt/ifT-benchmark) is a collection of
test scenarios designed to evaluate both the precision and soundness of type narrowing.
Elixir v1.20 already handled 12 out of the 13 tests, but it could not infer the
proper types for this example:

```elixir
y = is_integer(x)

if y do
  # y is true, x remains dynamic
else
  # y is false, x remains dynamic
end
```

To narrow `x`, we need to reverse the arrows of `is_integer(x)`. In Elixir v1.20, we
only did so for the expression given directly to `if` or `case`. Here, the expression
given to `if` is the variable `y`. All v1.20 knew about `y` is that it was a `boolean()`.
Inside the `do`-branch, `y` is `true`, but by then the connection between `y` and
`is_integer(x)` had been lost at the assignment, so there were no arrows to reverse.

This would be quite harmful once we add type signatures, because it means trivial
refactoring techniques, such as extracting an expression into a variable, could lead
to false positives.

Elixir v1.21 solves this by keeping track of the expression each variable was assigned
to. Now, when `y` is narrowed to `true`, we know `y` came from `is_integer(x)`, so we
continue propagating `true` in reverse through the arrows of `is_integer`, narrowing `x`
to `integer()`. This works across any number of assignments:

```elixir
y = is_integer(x)
z = not y

if z do
  # z is true, y is false, x is not integer()
else
  # z is false, y is true, x is integer()
end
```

Our implementation also performs the narrowing lazily, by cross-referencing the variables
in the `if` and `case` expressions with the variables used in each clause, trying to find
any assignment they share with each other. If the clauses above do not access `z`, `y`, or
`x`, then no narrowing is performed.

Finally, because Elixir defines reverse arrows for almost all operations, it can refine
expressions [which are not currently refined in TypeScript](https://www.typescriptlang.org/play/?#code/PTAEHUFMBsGMHsC2lQBd5oBYoCoE8AHSAZVgCcBLA1UABWgEM8BzM+AVwDsATAGiwoBnUENANQAd0gAjQRVSQAUCEmYKsTKGYUAbpGF4OY0BoadYKdJMoL+gzAzIoz3UNEiPOofEVKVqAHSKigBmXLCoFPBeBGxEZKh4APoM0BQMgkmC7LAWgoIAFHgAXKCCqJSczKAAPqCc7IjSkGQAlKUNTS2gAN6KoCbR5aAAHqAAvL2gIfDwpXigAL4A3P0iIaAFiUTwGyMBMxjjx6AAROWVzKetvWsDTqjsZF54Ae5VqJirA4ugMIIoPoDe6QR7PUALADUoAAjN8lopFkA),
such as data constructors:

```elixir
def f(foo) when is_bitstring(foo) or is_integer(foo) do
  map = %{foo: foo}

  if is_bitstring(map.foo) do
    byte_size(foo)
  else
    foo + 1
  end
end
```

In the program above, even though `foo` is set as the value of a map,
refining the map still refines the original variable.

## Summary

Elixir's approach to type inference and narrowing is built on a few ideas that
compose well. Dynamic types are refined as variables are used, multiple arrows
give precise types to functions, and propagating types through those arrows in
reverse lets us infer and narrow types across conditionals, patterns, and assignments,
all without hardcoding knowledge about specific functions.

In Elixir v1.21, we use these techniques to find sure bugs in existing Elixir programs,
without requiring any changes to your code. The same mechanisms will apply once type
signatures are introduced: the more precise the signatures, the more precise the
narrowing and the fewer false positives.
