---
title: "Type inference and narrowing with reverse arrows"
excerpt: "This article explains how Elixir implements type inference and type narrowing using reverse arrows."
date: 2026-11-10
author: "José Valim, Guillaume Duboc"
category: "Internals"
tags: []
---

This article explains how Elixir implements type inference and type narrowing
using reverse arrows. The upcoming Elixir release, v1.21, passes all tests in the
[If-T: Type Narrowing Benchmark by Guo et al.](https://github.com/utahplt/ifT-benchmark).
This means v1.21 can find even more bugs in existing Elixir programs and, when type
signatures are introduced, type narrowing will give us more precise types and avoid
false positives.

> The type system was made possible thanks to a partnership between [CNRS](https://www.cnrs.fr/)
> and [Remote](https://remote.com/). The development work is currently sponsored by
> [Supermethod](https://www.supermethod.com/) and [Dashbit](https://dashbit.co/).

## Type inference

Elixir performs type inference by refining the dynamic type. This is quite different
from how inference and gradual typing is implemented in most type systems, so let's
break it down.

In many gradual languages, the dynamic type, often known as `any`, is a "black-box" and
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
where `term()` is the top type. Then, as a variable is used throughout a function,
its dynamic type is refined by intersecting its type with the domain of the invoked
functions. In other words, we go through the following steps:

1. `x` starts as `dynamic(term())`

2. `x` is given to `x * 2`. The left operand of `*` is `integer() or float()`,
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
inputs to be integer. This means that, at the end of this function, Elixir will
correctly infer that `x` can only be an integer, because `x` was refined from
`dynamic(term())` to `dynamic(integer() or float())` and then only to `dynamic(integer())`.
The inferred type for `using_x_as_integer` is `dynamic(integer()) -> :ok`.

The best part is that all dynamic types in Elixir are refined and therefore the type
system is always doing its best to find sure bug, even in the presence of dynamism.
And the refinement itself is often quite precise, thanks to reverse arrows, which we
will explore next.

## Reverse arrows

Functions in Elixir can be typed with multiple arrows. As an exercise, let's take the
unary negation operator. You could give it this type signature:

```elixir
$ integer() or float() -> integer() or float()
def -number
```

However, this type says that, if you give it an integer, it may return a
float, which is never the case! This signature is too broad. Instead, we
could give it this signature:

```elixir
$ integer() -> integer()
$ float() -> float()
def -number
```

This precisely captures that, if you give it an integer, it returns an integer.
If you give it a float, it returns a float. Multiple arrows are an excellent way
to type functions with multiple clauses, which are common in both Erlang and Elixir.

With this in mind, what do you believe is the inferred type of `x` in the function below?

```elixir
def negated_halt_remainder(x), do: rem(-x, 2)
```

You may think `x` is `dynamic(integer() or float())`, because that's the domain of
the unary negation operator, however, `x` will once again be inferred to be
`dynamic(integer())`, because Elixir reverse propagates types through the arrows.
Let's break it down.

1. We start type checking the function and we find `rem(a, b)`, which has a type
   signature of `integer(), integer() -> integer()`. Because we have a single arrow,
   we know that `a` and `b` have to be `integer()` for this to type check

2. Now we type check `-x`. We know that `-` has two arrows: `integer() -> integer()`
   and `float() -> float()`. We also know that, because the result of `-x` is given to
   `rem` which expects an integer, we can discard the `float() -> float()` arrow,
   and the only valid type for the argument of `-` is `integer()`

3. Now we type check `x` itself. `x` starts with type of `dynamic(term())`. We then
   intersect it with `integer()`, resulting in `dynamic(integer())`

In other words, as we give precise type signatures to our programs using multiple
arrows, the type system will use these same arrows to infer precise types. As we will
learn next, Elixir uses this technique to infers types from guards and performs type
narrowing (also known as occurence typing).

## Guards

Now we have the foundation to understand how Elixir performs type inference of guards.
Take this function clause

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
we start with `true`, which is the only condition a guard would be accepted,
and propagate it through the arrows in reverse:

1. The only clause of `and` that can return `true` is `true, true -> true`,
   therefore we know that both operands must be `true`

2. The only clause of `is_integer` that can return `true` is `integer() -> true`,
   therefore we know `x` must be an integer

3. The only clause of `is_bitstring` that can return `true` is `bitstring() -> true`,
   therefore we know `y` must be a bitstring

If multiple clauses could return true, we would then simply union their domains.

It is worth emphasizing that this behaviour is not hardcoded to a handful of
functions the type checker knows about. It works with any function, in any context.
Let's see more examples.

## Type narrowing (also known as occurrence typing)

Occurrence typing allows us to refine the type of variables and expressions
based on the different branches of a conditional. For example:

```elixir
if is_bitstring(x) do
  x #=> x has type: bitstring()
else
  x #=> x has type: not bitstring()
end
```

The mechanism we use to perform occurrence typing is quite similar to the ones
from the previous sections. Within the `do`-branch, we consider the scenarios
where `is_bitstring(x)` will return `true`. Within the `else`-branch, where it
returns `false`.

And since our foundation is built on reverse arrows, the narrowing applies to
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

The [If-T benchmarks](https://github.com/utahplt/ifT-benchmark) is a collection of
test scenarios designed to evaluate how well type checkers handle type narrowing.
Elixir v1.20 already handled 12 out of the 13 tests but it could not infer the
proper types for this example:

```elixir
y = is_integer(x)

if y do
  # y is true, x remains dynamic
else
  # y is false, x remains dynamic
end
```

In other words, Elixir could only narrow the types in the expressions given to
`if` and `case`. If the expression was moved to an assignment, we could not longer
narrow it. That would be quite harmful once we added type signatures, because it
meant trivial refactoring techniques, such as extracting an expression into a variable,
could lead to false positives.

Elixir v1.21 solves it by narrowing even across assignments, as in the example below:

```elixir
y = is_integer(x)
z = not y

if z do
  # z is true, y is false, x is not integer()
else
  # z is false, y is true, x is integer()
end
```

Our implementation also performs the narrowing lazily, by cross references the variables
in the `if`-expression and `case`-expression with the variables used in each clause.
For example, if the clauses above do not access `z`, `y`, or `x`, then no narrowing is
performed.

Finally, because Elixir defines reverse arrows for almost all operations, it can refine
expressions [which are not currently refined in TypeScript](https://www.typescriptlang.org/fr/play/?#code/PTAEHUFMBsGMHsC2lQBd5oBYoCoE8AHSAZVgCcBLA1UABWgEM8BzM+AVwDsATAGiwoBnUENANQAd0gAjQRVSQAUCEmYKsTKGYUAbpGF4OY0BoadYKdJMoL+gzAzIoz3UNEiPOofEVKVqAHSKigBmXLCoFPBeBGxEZKh4APoM0BQMgkmC7LAWgoIAFHgAXKCCqJSczKAAPqCc7IjSkGQAlKUNTS2gAN6KoCbR5aAAHqAAvL2gIfDwpXigAL4A3P0iIaAFiUTwGyMBMxjjx6AAROWVzKetvWsDTqjsZF54Ae5VqJirA4ugMIIoPoDe6QR7PUALADUoAAjN8lopFkA),
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

In the program below, even though `foo` is set as the value of a map,
refining the map still refines the original variable.
