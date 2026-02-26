---
layout: post
title: "Lazy BDDs with eager literal intersections"
authors:
- José Valim
category: Internals
excerpt: "This article explores the latest batch of optimizations we did to set-theoretic types and their representation"
---

# Lazy BDDs with eager literal intersections

In [a previous article](/blog/2025/12/02/lazier-bdds-for-set-theoretic-types/),
we discussed how Elixir changed its set-theoretic types representation from
Disjunctive Normal Forms (DNFs) to Lazy Binary Decision Diagrams (Lazy BDDs).

In a nutshell, DNFs allow us to represent unions, intersections,
and negations as a flat data structure:

```elixir
(c1 and not d1) or (c2 and not d2) or (c3 and not d3) or ...
```

This meant that any operation between complex types was immediately
flattened. For example, intersections of unions, such as
`(foo or bar) and (baz or bat)`, had to be immediately flatten into the
cartesian production `(foo and baz) or (foo and bat) or (bar and baz) or (bar and bat)`.
Even worse, unions of differences could lead to exponential expansion.

Elixir v1.19 then introduced BDDs with lazy unions (in short, lazy BDDs).
They are trees which allow us to represent set-theoretic operations of any
arbitrary depth, without flattening them, while also detecting duplicate types.
A lazy BDD has type

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

The conversion to lazy BDDs and a few optimizations we added to their
formulation in literature allowed us to type check Elixir programs faster,
despite Elixir v1.19 performing more type checks than v1.18!

However, when working on Elixir v1.20, which introduced type inference of
all constructs, we noticed some of the downsides of lazy BDDs. This article
explores these downsides and how we addressed them.

> As with previous articles, we discuss implementation details of the
> type system. You don’t need to understand these internals to use the type
> system. Our goal is simply to document our progress and provide guidance
> for future maintainers and implementers. Let’s get started.

## The trouble with laziness

As we described above, lazy BDDs allow us to represent set-theoretic 
operations at any depth. And while this is extremely useful for unions
and differences, they offer a downside when it comes to intersections.
For example, take this type:

```elixir
(%Foo{} or %Bar{} or %Baz{} or %Bat{}) and %Bar{}
```

While we could store the above as a BDD, it is also clear that the
above can only be equal to `%Bar{}`. In other words, if we
resolve intersections eagerly, we will most likely reduce the tree
size, speeding up all future operations! To do this, we need
to compute the intersection between literal types (the first element of
the BDD node), rather than intersections between BDDs. So we are naming
these new optimizations **eager literal intersections**.

## Eager literal intersections

Our goal is to apply intersections between literals as soon as possible
as it helps us reduce the size of the tree whenever literal intersections
are empty.

Take two BDDs:

```elixir
B1 = {a1, C1, U1, D1}
B2 = {a2, C2, U2, D2}
```

And imagine there is a function that can compute the intersection between
`a1` and `a2` (which is the intersection of literals, not BDDs). The optimization
works as long as one of `C1` or `C2` are `:top`. In this case, let's choose `C2`,
so we have:

```elixir
B1 = (a1 and C1) or U1 or (not a1 and D1)
B2 = a2 or U2 or (not a2 and D2)
```

The intersection of `B1` and `B2` can be computed as:

```elixir
B1 and (a2 or U2 or (not a2 and D2))
```

Let's distribute it:

```elixir
(a2 and B1) or (U2 and B1) or ((not a2 and D2) and B1)
```

And expand the first `B1`:

```elixir
(a2 and ((a1 and C1) or U1 or (not a1 and D1))) or
  (U2 and B1) or ((not a2 and D2) and B1)
```

And now let's distribute `a2` while reordering the arguments:

```elixir
(((a1 and a2) and C1) or (a2 and U1) or ((a2 and D1) and not a1) or
  (U2 and B1) or ((not a2 and D2) and B1)
```

In the first term of the union, we have `a1 and a2` as a literal intersection.
If `a1 and a2` is empty, then the whole C1 node can be eliminated.

Then we proceed recursively intersect `a2` with every literal node in `a2 and U1`
and `a2 and D1`. And, if their literal nodes are empty, those subtrees are eliminated
too. This allows us to dramatically cut down the size of tree! In our benchmarks,
these optimizations allowed us to reduce type checking of a module from 10s to
25ms.

The remaining terms of the union are `U2 and B1` and `(not a2 and D2) and B1`.
If desired, we could apply the same eager literal intersection optimization to
`U2 and B1` (as long as the constrained part in either `U2` or `B1 ` are `:top`).

This optimization has worked quite well for us, but it is important to keep in
mind since BDDs are ordered and the literal intersection may create a new literal
value, this optimization must be applied semantically so we can recompute the
position of intersected literals in the tree. We cannot apply it when we are
already traversing the tree using the general lazy BDD formulas from the previous
article.

Finally, note this optimization may eagerly reintroduce some of the complexity seen
in DNFs if applied recursively. For instance, if you have `(foo or bar) and (baz or bat)`,
the recursive application of eager literal intersections will yield
`(foo and baz) or (foo and bat) or (bar and baz) or (bar and bat)`. If most of those
intersections are eliminated, then applying eager literal intersections is still beneficial,
but that may not always be the case.

To discuss exactly when these trade-offs may be problematic, let's talk about open vs
closed types.

### Open vs closed types

Elixir's type system can represent both open and closed maps. When you write:

```elixir
user = %{name: "john", age: 42}
```

We are certain the map has keys `:name` and `:age` and only those keys.
We say this map is closed, as it has no other keys, and it would have
the type `%{name: binary(), age: integer()}`.

However, when you pattern match on it:

```elixir
def can_drive?(%{age: age}) when is_integer(age) and age >= 18
```

Because pattern matching only validates the `age` key, a map given as
argument may have other keys! Therefore, we say the map is open and
it has the type `%{..., age: integer()}`. This type says the map may
have any keys but we are sure the `age` is `integer()`.

The trouble is that, when we are intersecting two maps, because the
open map is very broad, their intersection rarely eliminate entries.
For example, the intersection between `%{..., age: integer()}` and
`%{..., name: binary()}` is the map `%{..., name: binary(), age: integer()}`.

So when we have to compute the intersection between `(foo or bar) and (baz or bat)`
and `foo`, `bar`, `baz`, and `bat` are open maps with different keys,
then it will generate a cartesian product of all combinations! However,
if they were closed maps, the end result would be empty. For this reason,
we recommend applying the eager literal intersection only when the
intersection will often lead to empty types.

## Optimizing differences

The difference between `B1 \ B2` can always be expressed as the intersection
between `B1` and `not B2`, which is precisely how we write differences in Elixir.

Now take the following type:

```elixir
{:ok, integer()} and not {:error, integer()}
```

Currently, both `ok`-type and `error`-type are stored as nodes in the BDD.
However, it is clear in the example above the types are disjoint and the
result is `{:ok, integer()}`.

If we know the literals `a1` and `a2` are disjoint (their intersection is
empty), then it is likely we can avoid adding nodes to the tree.

Furthermore, imagine this type:

```elixir
{:ok, integer()} and not (not {:error, integer()})
```

The difference will convert the negation into a positive, resulting in
`{:ok, integer()} and {:error, integer()}`, which is empty. Therefore,
if `B2` contains negations (which means its `D2` component is not bottom),
then we can also apply the eager literal intersection optimization from
the previous section.

We will explore both scenarios next, starting with the one where D2
is bottom.

### When `D2` is bottom

We start `B1 and not B2`:

```elixir
B1 and not B2
```

Next let's break `B1` into `(a1 and C1) or B1_no_C1`, where `B1_no_C1` is `U1 or (not a1 and D1)`:

```elixir
((a1 and C1) or B1_no_C1) and not B2
```

Now we distribute the difference:

```elixir
((a1 and C1) and not B2) or (B1_no_C1 and not B2)
```

Let's solve the left-hand side. We know `B2 = (a2 and C2) or U2` (remember `D2` is bottom), so let's add that:

```elixir
(a1 and C1 and not ((a2 and C2) or U2))
or (B1_no_C1 and not B2)
```

Now distribute the `not` and remove the parenthesis:

```elixir
(a1 and C1 and not (a2 and C2) and not U2)
or (B1_no_C1 and not B2)
```

Now, **if `a1` and `a2` are disjoint**, then `a1 and not (a2 and C2)` is the same as `a1`.
This happens because if `a1` and `a2` are disjoint, `a2 and C2` is a subset of `a2`,
which is then also disjoint with `a1`. So the first part simplifies to `a1 and C1 and not U2`:

```elixir
(a1 and C1 and not U2) or (B1_no_C1 and not B2)
```

Now by expanding `B1_no_C1` into `U1 or (not a1 and D1)` and distributed
the union, we get:

```elixir
(a1 and C1 and not U2) or (U1 and not B2) or (not a1 and D1 and not B2)
```

which is in the BDD format! So we can rewrite the difference of disjoint literals as:

```elixir
{a1, C1 and not U2, U1 and not B2, D1 and not B2}
```

which completely avoids adding `a2` to the BDD and can then continue recursively.

### When `D2` is not bottom

When D2 is not bottom, it means B2 has a negated component.
Since B2 itself is negated when part of a difference, the D2
component of B2 becomes an intersection, and we can apply the
same eager literal technique we applied to intersections.

Once again, we start `B1 and not B2`:

```elixir
B1 and not B2
```

Now let's break `B2` into `(B2_no_D2 or (not a2 and D2))`, where `B2_no_D2` is `(a2 and C2) or U2`:

```elixir
(B1) and not (B2_no_D2 or (not a2 and D2))
```

Now we distribute the negation all the way through:

```elixir
(B1) and (not B2_no_D2 and (a2 or not D2))
```

And distribute `B1`'s intersection with `(a2 or not D2)`:

```elixir
((B1 and a2) or (B1 and not D2)) and not B2_no_D2
```

`B1 and a2` is an eager literal intersection from the previous section,
which we can reuse!

Furthermore, notice at the end we compute the difference between
`((B1 and a2) or (B1 and not D2))` and `B2_no_D2`. Given `B2_no_D2`
by definition has `D2 = bottom`, we can apply the optimized
difference for when D2 is bottom.

At the moment, we are not applying this optimization in Elixir,
as the difference with negations on the right-hand side are uncommon.
We may revisit this in the future.

## Results

We initially [implemented eager literal intersections as part of
Elixir v1.20 release](
https://github.com/elixir-lang/elixir/compare/995f7fc2c4080d2c0d1f78a7d896366b0c715178...0e3d22fd7997004ad23ff02d9ee935160869522f),
which reduced the type checking time of one of the pathological cases
from 10 seconds to 25ms!

However, our initial implementation also caused a performance regression,
as we did not distinguish between open and closed maps. This regression was
addressed by [applying the optimization only to closed maps](https://github.com/elixir-lang/elixir/commit/e5dc69398ef172b4a590e7e4e20f9d52b4b7ab59), as discussed
in the article.