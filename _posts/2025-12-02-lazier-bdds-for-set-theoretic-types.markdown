---
layout: post
title: "Lazier BDDs for set-theoretic types"
authors:
- José Valim
- Guillaume Duboc
category: Internals
excerpt: "This article explores the data structures used to represent set-theoretic types and the recent optimizations we have applied to them"
---

[The Elixir team and the CNRS are working on a set-theoretic type system for Elixir](https://elixir-lang.org/blog/2023/06/22/type-system-updates-research-dev/) which, simply put, is a type-system powered by unions, intersections, and negations. As part of the implementation of said type systems, we need an efficient way of representing said operations. This article discusses the existing approaches found in theory and practice, as well as the improvements we have introduced as part of [Elixir v1.19](/blog/2025/10/16/elixir-v1-19-0-released.markdown/).

This article covers the implementation details of the type system. You don't need to understand these internals to use the type system, just as you don't need to know virtual machine bytecodes or compiler passes to use a programming language. Our goal is to document our progress and provide guidance for future maintainers and implementers. Let's get started.

## DNFs - Disjunctive Normal Forms

A Disjunctive Normal Form (DNF) is a standardized way of expressing logical formulas using only disjunctions (unions) of conjunctions (intersections). In the context of set-theoretic type systems, DNFs provide a canonical representation for union and intersection types, represented respectively as `or` and `and` in Elixir.

In Elixir, we would represent those as lists of lists. Consider a type expression like `(A and B) or (C and D)`. This is already in DNF, it's a union of intersections, and it would be represented as: `[[A, B], [C, D]]`. This means performing unions between two DNFs is a simple list concatenation:

```elixir
def union(dnf1, dnf2), do: dnf1 ++ dnf2
```

However, more complex expressions like `A and (B or C)` need to be converted. Using distributive laws, this becomes `(A and B) or (A and C)`, which is now in DNF. In other words, the intersection of DNFs is a Cartesian product:

```elixir
def intersection(dnf1, dnf2) do
  for intersections1 <- dnf1,
      intersections2 <- dnf2 do
    intersections1 ++ intersections2
  end
end
```

The advantage of DNFs is their simple structure. Every type can be represented as unions of intersecting terms, making operations like checking if a type is empty simply a matter of checking if all unions have at least one intersection that is empty:

```elixir
def empty?(dnf) do
  Enum.all?(dnf, fn intersections ->
    Enum.any?(intersections, &empty_component?/1)
  end)
end
```


However, from the snippets above, we can already see DNFs come with significant drawbacks: if we implement unions as simple list concatenations, those unions can have duplicate types and if we don't eliminate duplicates, we can have several repeated entries as unions are built during type checking.

Furthermore, we have already seen how intersections are Cartesian products, which can lead to exponential blow ups when performing the intersection of unions. For example, `(A₁ or A₂) and (B₁ or B₂) and (C₁ or C₂)` leads to `(A₁ and B₁ and C₁) or (A₁ and B₁ and C₂) or (A₁ and B₂ and C₁) or ...`, with 8 distinct unions.

Despite their limitations, DNFs served us well and were the data structure used as part of Elixir v1.17 and v1.18. However, since Elixir v1.19 introduced type inference of anonymous functions, negations became more prevalent in the type system, making exponential growth more frequent. Let's understand why.

## Inferring anonymous functions

Imagine the following anonymous function:

```elixir
fn
  %{full_name: full} -> "#{full}"
  %{first_name: first, last_name: last} -> "#{last}, #{first}"
end
```

We can say the first clause accepts any map with the key `full_name`. The second clause accepts any map with the keys `first_name` and `last_name` which DO NOT have the key `full_name` (otherwise they would have matched the first clause). Therefore, the inferred type should be:

```elixir
$ %{full_name: String.Chars.t()} -> String.t()
$ %{first_name: String.Chars.t(), last_name: String.Chars.t()} and not
    %{full_name: String.Chars.t()} -> String.t()
```

As you can see, in order to express this type, we need a negation (`not`). Or, more precisely, a difference since `A and not B` is the same as `A - B`.

Implementing negations/differences in DNFs is relatively straightforward. Instead of lists of lists, we now use lists of two-element tuples, where the first element is a list of positive types, and the second is a list of negative types. For example, previously we said `(A and B) or (C and D)` would be represented as `[[A, B], [C, D]]`, now it will be represented as:

```elixir
[{[A, B], []}, {[C, D], []}]
```

While `(A and not B) or C or D` is represented as:

```elixir
[{[A], [B]}, {[C], []}, {[D], []}]
```

The difference between two DNFs is implemented similarly to intersections, except we now need to perform the Cartesian product over the positive and negative parts of each conjunction. And given anonymous functions have differences, inferring the types of anonymous functions are now exponentially expensive, which caused some projects to take minutes to compile. Not good!

## BDDs - Binary Decision Diagrams

Luckily, those exact issues are well documented in literature and are addressed by Binary Decision Diagrams (BDDs), introduced by [Alain Frisch (2004)](https://www.cduce.org/papers/frisch_phd.pdf) and later recalled and expanded by [Giuseppe Castagna (2016)](https://www.irif.fr/~gc/papers/covcon-again.pdf).

BDDs represent set-theoretic operations as an ordered tree. This requires us to provide an order, any order, across all types. Given [all Elixir values have a total order](https://hexdocs.pm/elixir/Kernel.html#module-term-ordering), that's quite straightforward. Furthermore, by ordering it, we can detect duplicates as we introduce nodes in the tree. The tree can have three distinct node types:

```elixir
type bdd() = :top or :bottom or {type(), constrained :: bdd(), dual :: bdd()}
```

`:top` represents the top type (where the intersection `type and :top` returns `type`) and `:bottom` represents the bottom type (where the intersection `type and :bottom` returns `:bottom`). Non-leaf nodes are represented via a three-element tuple, where the first element is the type (what we have been calling `A`,  `B`... so far), the second element is called in literature the constrained branch, and the third element is the dual branch.

In order to compute the actual type of a non-leaf node, we need to compute `(type() and constrained()) or (not type() and dual())` (hence the names constrained and dual). Let's see some examples.

The type `A` is represented as `{A, :top, :bottom}`. This is because, if we compute `(A and :top) or (not A and :bottom)`, we get `A or :bottom`, which is equivalent to `A`.

The type `not A` is represented as `{A, :bottom, :top}`, and it gives us `(A and :bottom) or (not A and :top)`, which yields `:bottom or not A`, which is equivalent to `not A`.

The type `A and B`, assuming `A < B` according to a total order, is represented as `{A, {B, :top, :bottom}, :bottom}`. Expanding it node by node gives us:

```elixir
(A and ((B and :top) or (not B and :bottom))) or (not A and :bottom)
(A and (B or :bottom)) or (not A and :bottom)
(A and B) or :bottom
(A and B)
```

While the difference `A and not B` is represented as `{A, {B, :bottom, :top}, :bottom}`, which we also expand node by node:

```elixir
(A and ((B and :bottom) or (not B and :top))) or (not A and :bottom)
(A and (:bottom or not B)) or (not A and :bottom)
(A and not B) or :bottom
(A and not B)
```

Finally, the union `A or B` is implemented as `{A, :top, {B, :top, :bottom}}`. Let's expand it:

```elixir
(A and :top) or (not A and ((B and :top) or (not B and :bottom)))
(A and :top) or (not A and (B or :bottom))
A or (not A and B)
(A or not A) and (A or B)
:top and (A or B)
A or B
```

In other words, Binary Decision Diagrams allow us to represent unions, intersections, and differences efficiently, removing the exponential blow up. [Guillaume Duboc implemented them as part of Elixir v1.19](https://github.com/elixir-lang/elixir/pull/14693), addressing the bottlenecks introduced as part of the new type system features... but unfortunately BDDs introduced new slow downs.

The issue with BDDs comes when applying unions to intersections and differences. Take the following type `(A and B) or C`. Since we need to preserve the order `A < B < C`, it would be represented as:

```elixir
{A, {B, :top, {C, :top, :bottom}}, {C, :top, :bottom}}
```

which can be expanded as:

```elixir
(A and ((B and :top) or (not B and ((C and :top) or (not C and :bottom))))) or (not A and ((C and :top) or (not C and :bottom)))
(A and (B or (not B and C))) or (not A and C)
(A and (B or C)) or (not A and C)
(A and B) or (A and C) or (not A and C)
(A and B) or C
```

While the above is correct, the issue is that C appears twice in our tree representation. As we perform further operations in it, it leads to redundant computations causing them to grow exponentially in size on consecutive unions. It seems we traded faster intersections/differences for slower unions. Perhaps we can have our cake and eat it too?

## BDDs with lazy unions (or ternary decision diagrams)

Luckily, the issue above was also forecast by Alain Frisch (2004), where he suggests an additional representation, called BDDs with lazy unions.

In a nutshell, we introduce a new element to each non-leaf node to represent unions:

```elixir
type lazy_bdd() = :top or :bottom or
  {type(), constrained :: bdd(), uncertain :: bdd(), dual :: bdd()}
```

We'll refer to the `uncertain` as unions going forward.

The type of each non-leaf node can be computed by `(type() and constrained()) or uncertain() or (not type() and dual())`. Here are some examples:

```elixir
A = {A, :top, :bottom, :bottom}
A and B = {A, {B, :top, :bottom, :bottom}, :bottom, :bottom}
A or B = {A, :top, {B, :top, :bottom, :bottom}, :bottom}
```

And, going back to `(A and B) or C`, it can be represented as:

```elixir
{A, {B, :top, :bottom, :bottom}, {C, :top, :bottom, :bottom}, :bottom}
```

The duplication of `C` is fully removed. With our new representation in hand, the next step is to implement union, intersection, and difference of lazy BDDs, using the formulas found in literature and described below.

Assuming that a lazy BDD `B` is represented as `{a, C, U, D}`, and therefore `B1 = {a1, C1, U1, D2}` and `B2 = {a2, C2, U2, D2}`, the union of the lazy BDDs `B1 or B2` can be computed as:

```elixir
{a1, C1 or C2, U1 or U2, D1 or D2} when a1 == a2
{a1, C1, U1 or B2, D1} when a1 < a2
{a2, C2, B1 or U2, D2} when a1 > a2
```

The intersection `B1 and B2` is:

```elixir
{a1, (C1 or U1) and (C2 or U2), :bottom, (D1 or U1) and (D2 or U2)} when a1 == a2
{a1, C1 and B2, U1 and B2, D1 and B2} when a1 < a2
{a2, B1 and C2, B1 and U2, B1 and D2} when a1 > a2
```

The difference `B1 and not B2` is:

```elixir
{a1, (C1 or U1) and not (C2 or U2), :bottom, (D1 or U1) and not (D2 or U2)} when a1 == a2
{a1, (C1 or U1) and not B2, :bottom, (D1 or U1) and not B2} when a1 < a2
{a2, B1 and not (C2 or U2), :bottom, B1 and not (D2 or U2)} when a1 > a2
```

[Guillaume Duboc first implemented lazy BDDs to represent our function types](https://github.com/elixir-lang/elixir/pull/14799), addressing some of the bottlenecks introduced alongside BDDs. Afterwards, we attempted to convert all types to use lazy BDDs, hoping they would address the remaining bottlenecks, but that was not the case. There were still some projects that type checked instantaneously in Elixir v1.18 (which used DNFs) but took minutes on v1.19 release candidates, which could only point to large unions still being the root cause. However, weren't lazy BDDs meant to address the issue with unions?

That was the question ringing in Guillaume's head and in mine after an hours-long conversation, when we decided to call it a day. Unbeknownst to each other, we both continued working on the problem that night and the following morning. Separately, we were both able to spot the issue and converge on the same solution.

## Lazier BDDs (for intersections)

If you carefully look at the formulas above, you can see that intersections and differences of equal nodes cause a distribution of unions. Here is the intersection:

```elixir
{a1, (C1 or U1) and (C2 or U2), :bottom, (D1 or U1) and (D2 or U2)} when a1 == a2
```

Notice how U1 and U2 now appear on both constrained and dual parts and the whole union part of the node disappeared, now listed simply as `:bottom`.

In addition, considering the common case where `C1 = C2 = :top` and `D1 = D2 = :bottom`, the node above becomes `{a1, :top, :bottom, U1 and U2}`, which effectively moves the unions to the dual part. If you play close attention to it, since the uncertain is now `:bottom`, we reverted back to the original BDD representation. Any further `union` on those nodes will behave exactly as in the non-lazy BDDs, which we know to be problematic.

In other words, certain operations on lazy BDDs cause unions to revert to the previous BDD representation. So it seems lazy BDDs are not lazy enough? Could we stop this from happening?

Guillaume and I arrived at a new formula using different approaches. Given Guillaume's approach can also be used to optimize differences, that's the one I will show below. In particular, we know the intersection of equal nodes is implemented as:

```elixir
{a1, (C1 or U1) and (C2 or U2), :bottom, (D1 or U1) and (D2 or U2)} when a1 == a2
```

If we distribute the intersection in the constrained part, we get:

```elixir
(C1 and C2) or (C1 and U2) or (U1 and C2) or (U1 and U2)
```

If we distribute the intersection in the dual part, we get:

```elixir
(D1 and D2) or (D1 and U2) or (U1 and D2) or (U1 and U2)
```

We can clearly see both parts have `U1 and U2`, which we can then move to the union! Leaving us with:

```elixir
{a1,
 (C1 and C2) or (C1 and U2) or (U1 and C2),
 (U1 and U2),
 (D1 and D2) or (D1 and U2) or (U1 and D2)} when a1 == a2
```

We can then factor out `C1` in the constrained and `D1` in the dual (or `C2` and `D2` respectively), resulting in:

```elixir
{a1,
 (C1 and (C2 or U2)) or (U1 and C2),
 (U1 and U2),
 (D1 and (D2 or U2)) or (U1 and D2)} when a1 == a2
```

While this new formula requires more operations, if we consider the common case `C1 = C2 = :top` and `D1 = D2 = :bottom`, we now have `{a1, :top, U1 and U2, :bottom}`, with the unions perfectly preserved in the middle. We independently implemented this formula and noticed it addressed all remaining bottlenecks!

## Lazier BDDs (for differences)

The issues we outlined above for intersections are even worse for differences. Let's check the difference formula:

```elixir
{a1, (C1 or U1) and not (C2 or U2), :bottom, (D1 or U1) and not (D2 or U2)} when a1 == a2
{a1, (C1 or U1) and not B2, :bottom, (D1 or U1) and not B2} when a1 < a2
{a2, B1 and not (C2 or U2), :bottom, B1 and not (D2 or U2)} when a1 > a2
```

As you can see, all operations shuffle the union nodes and return `:bottom`. But this time, we know how to improve it! Let's start with `a1 == a2`. If we expand the difference in the constrained part, we get:

```elixir
(C1 and not C2 and not U2) or (U1 and not C2 and not U2)
```

If we do the same in the dual part, we have:

```elixir
(D1 and not D2 and not U2) or (U1 and not D2 and not U2)
```

Unfortunately, there are no shared union terms between the constrained and dual parts, unless C2 and D2 are `:bottom`. Therefore, instead of fully rewriting the difference of equal nodes, we add the following special case:

```elixir
{a1, C1 and not U2, U1 and not U2, D1 and not U2}
when a1 == a2 and C2 == :bottom and D2 == :bottom
```

We can apply a similar optimization when `a1 < a2`. The current formula:

```elixir
{a1, (C1 or U1) and not B2, :bottom, (D1 or U1) and not B2} when a1 < a2
```

The constrained part can be written as `(C1 and not B2) or (U1 and not B2)` and the dual part as `(D1 and not B2) or (U1 and not B2)`. Given `(U1 and not B2)` is shared on both parts, we can also convert it to a union, resulting in:

```elixir
{a1, C1 and not B2, U1 and not B2, D1 and not B2} when a1 < a2
```

Unfortunately, we can't apply this for `a2 > a1`, as differences are asymmetric and do not distribute over unions on the right side. Therefore, the updated formula for difference is:

```elixir
{a1, C1 and not U2, U1 and not U2, D1 and not U2} when a1 == a2 and C2 == :bottom and D2 == :bottom
{a1, (C1 or U1) and not (C2 or U2), :bottom, (D1 or U1) and not (D2 or U2)} when a1 == a2
{a1, C1 and not B2, U1 and not B2, D1 and not B2} when a1 < a2
{a2, B1 and not (C2 or U2), :bottom, B1 and not (D2 or U2)} when a1 > a2
```

With these new formulas, all new typing features in Elixir v1.19 perform efficiently and most projects now type check faster than in Elixir v1.18. We have also been able to use the rules above to derive additional optimizations for differences, such as when `a1 == a2 and U2 == :bottom`, which will be part of future releases. Hooray!

## Acknowledgements

As there is an increasing interest in implementing set-theoretic types for other dynamic languages, we hope this article shines a brief light on the journey and advancements made by the research and Elixir teams when it comes to representing set-theoretic types.

The type system was made possible thanks to a partnership between [CNRS](https://www.cnrs.fr/) and [Remote](https://remote.com/). The development work is currently sponsored by [Fresha](https://www.fresha.com/) and [Tidewave](https://tidewave.ai/).