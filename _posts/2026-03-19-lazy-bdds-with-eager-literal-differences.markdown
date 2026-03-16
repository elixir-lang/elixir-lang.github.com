---
layout: post
title: "Lazy BDDs with eager literal differences"
authors:
- José Valim
category: Internals
excerpt: "This is a follow up to our batch of set-theoretic types optimizations, this time targetting differences"
---

In [a previous article](/blog/2026/02/26/eager-literal-intersections/),
we discussed how we optimized intersections in Elixir set-theoretic types
to improve performance.

In a nutshell, lazy BDDs allow us to represent set-theoretic operations at
any depth. And while this is useful in many cases, they offer a downside
when it comes to intersections. For example, take this type:

```elixir
(%Foo{} or %Bar{} or %Baz{} or %Bat{}) and %Bar{}
```

While we could store the above as-is in the BDD, from a quick glance
it is clear that the above can only be equal to `%Bar{}`. To address
this, we made intersections eager, removing the size of BDDs and
drastically improving compilation times.

Lately, Elixir v1.20.0-rc.2 introduced new improvements to the type
checker. Among them is the ability to propagate type information
across clauses and check for redundant clauses. For example, take
this code:

```elixir
def example(x) when is_binary(x), do: ...
def example(x) when is_integer(x), do: ...
def example(x), do: ...
```

In the first clause, we know the argument is a binary. In the second,
we know it is an integer. Therefore, in the third one, even though there
are no guards, we know `x` has type `not binary() and not integer()`.
In other words, the type of a given clause is computed by the type of its
patterns and guards, **minus** the types of the previous clauses.

Furthermore, we can now check if a clause is redundant by checking if its
type definition is a subset/subtype of the previous ones. For example, if
you have three clauses, each with type `clause1`, `clause2`, and `clause3`,
you know `clause3` is redundant if:

```
clause3 ⊆ (clause1 ∪ clause2)
```

> In set-theoretic types, a type is a subtype of the other if it is a subset
> of said type, so we will use these terms interchangeably.

Or alternatively, the type is redundant if the difference between `clause3`
and the union of the clauses is empty. In Elixir terms:

```elixir
empty?(difference(clause3, union(clause1, clause2)))
```

Long story short: with Elixir v1.20.0-rc.2, the type system is seeing an
increase number of differences. Projects where modules had 1000+ of clauses
were taking too long to compile, so it was time to derive new formulas and
optimizations.

> As with previous articles, we discuss implementation details of the
> type system. You don’t need to understand these internals to use the type
> system. Our goal is simply to document our progress and provide guidance
> for future maintainers and implementers. Let’s get started.

## A recap on lazy BDDs and literals

A lazy BDD has type:

```elixir
type lazy_bdd() = :top or :bottom or
  {type(), constrained :: lazy_bdd(), uncertain :: lazy_bdd(), dual :: lazy_bdd()}
```

where `type()` is the representation of the actual type. For example,
if the type being represented is a `tuple`, `type()` would be a list of
all elements in the tuple. In literature, `type()` is known as literal.

Throughout this article, we will use the following notation to represent
lazy BDDs:

```elixir
B = {a, C, U, D}
```

where `B` stands for BDD, `a` is the literal, `C` is constrained, `U`
is uncertain, and `D` is dual. Semantically, the BDD above is the same as:

```elixir
B = (a and C) or U or (not a and D)
```

Which means the following expression, where `foo`, `bar`, `baz`,
and `bat` below represent types:

```elixir
(foo and not (bar or (baz and bat))
```

will be stored as:

```elixir
{foo,
 {bar, :bottom, :bottom,
  {baz, :bottom,
   {bat, :bottom, :bottom, :top}, :top}, :bottom, :bottom}
```

## Eager literal differences

The main insight of the previous article was, when intersecting two BDDs:

```elixir
B1 = {a1, C1, U1, D1}
B2 = {a2, C2, U2, D2}
```

if the intersection between `a1 and a2` is disjoint (i.e. it returns
the empty type), we can likely build new formulas that eliminate many
nodes from the BDD recursively.

The goal is to apply the same optimization for differences. In particular,
there are two properties that we can leverage from differences. Take the
difference between `a1` and `a2`. If they are disjoint, they have nothing
in common, and the result is `a1`. On the other hand, if `a1` is a subtype
of `a2`, then the difference is empty.

Furthermore, for simplicity, we will only optimize the cases where at least
one of the sides is exclusively a literal, which means that `C = :top`,
`U = :bottom`, and `D = :bottom`. Let's get to work!

### Literal on the right-hand side

We want to derive new formulas for difference when `B2` is a literal.
Let's start with the base formula:

```
B1 and not B2
```

where `B1` is `(a1 and C1) or U1 or (not a1 and D1)` and `B2` is
simply `a2`. So we have:

```
((a1 and C1) or U1 or (not a1 and D1)) and not a2
```

Now let's distribute `and not a2`:

```
(a1 and not a2 and C1) or (U1 and not a2) or (not a1 and not a2 and D1)
```

When they are disjoint, `a1 and not a2` is simply `a1`, so we have:

```
(a1 and C1) or (U1 and not a2) or (not a1 and not a2 and D1)
```

When `a1` is a subtype of `a2`, `a1 and not a2` is empty,
plus `not a1 and not a2` is the same as `not (a1 or a2)`,
which is the same as `not a2`. So we have:

```
(U1 and not a2) or (D1 and not a2)
```

In both formulas, `and not a2` is then applied using the same
eager literal difference recursively.

### Literal on the left-hand side

Now let's derive new formulas for difference when `B1` is a literal.
This means we want to compute:

```
B1 and not B2
```

Which we can expand to:

```
a1 and not ((a2 and C2) or U2 or (not a2 and D2))
```

Now let's distribute the `not` over the right-hand side:

```
a1 and (not a2 or not C2) and (not U2) and (a2 or not D2)
```

When `a1` and `a2` are disjoint, we know that `a1 and (not a2 or not C2)`
is `a1`. This is because if we distribute the intersection,
we end up with `(a1 and not a2) or (a1 and not C2)`. And since
`a1 and not a2` is `a1`, we end up with `a1` unioned with a type
that is a subset of `a1`, hence `a1`.

So we end up with:

```
a1 and (not U2) and (a2 or not D2)
```

And if `a1` and `a2` are disjoint, the intersection between them is empty,
so we are left with the following disjoint formula:

```
a1 and not D2 and not U2
```

When `a1` is a subtype of `a2`, we can simplify two expressions
in the initial formula. Let's look at it again:

```
a1 and (not a2 or not C2) and (not U2) and (a2 or not D2)
```

First we distribute the intersection in `a1 and (not a2 or not C2)`.
We will have two parts, `a1 and not a2`, which is empty, unioned
with `a1 and not C2`, resulting in:

```
a1 and (not C2) and (not U2) and (a2 or not D2)
```

Now we can distribute `a1 and (a2 or not D2)`. And because
`a1 and a2` is `a1` (since `a1` is a subset), we end up with
`a1 or (a1 and not D2)`, which is `a1`. So our subset formula
becomes:

```
a1 and not C2 and not U2
```

As you can see, these new formulas can reduce the amount
of nodes in the BDD drastically, which lead to much better
performance.

## One last trick: one field difference

The optimizations above lead to excellent performance. Projects
that would take dozens of seconds to compile could now do so in
milliseconds. However, there were still some cases where the
optimizations could not kick-in, leading to worse performance.
In particular, with structs.

When working with a struct in Elixir, the fields will most often
have the same type, except for one. For example:

```
def example(%MyStruct{x: x}) when is_binary(x)
def example(%MyStruct{x: x}) when is_integer(x)
def example(%MyStruct{x: x})
```

In the example above, `x` in the third clause starts with the value
of `term`, so the last struct is a supertype of the other ones,
and our optimizations do not apply. Therefore, the type of the third
clause would be:

```elixir
%MyStruct{x: term()} and not %MyStruct{x: integer()} and not %MyStruct{x: binary()}
```

However, whenever only one of the fields are different, we can translate
the above as the difference of said field, so instead we could have:

```elixir
%MyStruct{x: term() and not integer() and not binary()}
```

All we need to do is to compute new formulas. So let's do it one last time.
For our last batch of formulas, we will need three new types: `a_diff`
which is a new literal where we compute the difference between the only
different field (as done above), as well as `a_int` and `a_union`, which
is respectively the intersection and union of the distinct field.

### Literal on the right-hand side

Our formula for `B1 and not B2` with a literal on the right-hand side is:

```
(a1 and not a2 and C1) or (U1 and not a2) or (not a1 and not a2 and D1)
```

`a1 and not a2` is `a_diff`. `not a1 and not a2` is the same as
`(not (a1 or a2))` which is the same as `not a_union`, so we end up with:

```
(a_diff and C1) or (U1 and not a2) or (not a_union and D1)
```

### Literal on the left-hand side

Our starting point is:

```
a1 and (not a2 or not C2) and (not U2) and (a2 or not D2)
```

By distributing the first intersection, we have:

```
((a1 and not a2) or (a1 and not C2)) and not U2 and (a2 or not D2)
```

We know that `a1 and not a2` is `a_diff`. So let's slot that in
and change the order of operations:

```
(a_diff or (a1 and not C2)) and (a2 or not D2) and not U2
```

We now distribute `(a_diff or (a1 and not C2)) and (a2 or not D2)`:

```
((a_diff and (a2 or not D2)) or
 ((a1 and not C2) and (a2 or not D2))) and not U2
```

`a_diff and a2` is empty, so the first `and` becomes `a_diff and not D2`.
Then we distribute the second `and`:

```
((a_diff and not D2) or
 (a1 and a2 and not C2) or
 (a1 and not C2 and not D2)) and not U2
```

We know that `a1 and a2` is `a_int`. But we also know that `a1 = a_diff or a_int`,
so we end up with:

```
((a_diff and not D2) or
 (a_int and not C2) or
 ((a_diff or a_int) and not C2 and not D2)) and not U2
```

If we distribute `(a_diff or a_int) and not C2 and not D2)`,
we get two new terms `a_diff and not C2 and not D2` and
`a_int and not C2 and not D2`, and those two new terms are
subsets of `a_diff and not D2` and `a_int and not C2` respectively,
which means they can be fully discarded, so we end up with:

```
((a_diff and not D2) or (a_int and not C2)) and not U2
```

## Summary

We implemented all simplifications above and they will be available
in full in Elixir v1.20.0-rc4. At the moment, we have measured clear
impact from the left-hand side optimizations, allowing us to drastically
improve the type system performance when checking thousands of clauses
or large structs. At the moment, we did not spot any scenarios where the
right-hand side optimizations were useful, most likely because it does
not show up in codebases (yet).

We will continue assessing the performance of the type system based on
community feedback as we add more features.
