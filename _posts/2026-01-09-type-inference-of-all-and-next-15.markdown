---
layout: post
title: "Type inference of all constructs and the next 15 months"
authors:
- José Valim
category: Announcements
excerpt: "Today we celebrate 15 years since Elixir's first commit! To mark the occasion, we are glad to announce the first release candidate for Elixir v1.20, which performs type inference of all language constructs, with increasing precision."
---

Today we celebrate 15 years since [Elixir's first commit](https://github.com/elixir-lang/elixir/commit/337c3f2d569a42ebd5fcab6fef18c5e012f9be5b)! To mark the occasion, we are glad to announce the first release candidate for Elixir v1.20, which performs type inference of all language constructs, with increasing precision.

In this blog post, we will break down exactly what this means, and what to expect in the short and medium term of the language evolution (roughly the next 15 months).

## Types, in my Elixir?

In 2022, [we announced the effort to add set-theoretic types to Elixir](/blog/2022/10/05/my-future-with-elixir-set-theoretic-types/). In June 2023, we [published an award winning paper on Elixir's type system design](https://arxiv.org/abs/2306.06391) and said our work was transitioning [from research to development](/blog/2023/06/22/type-system-updates-research-dev/).

Our goal is to introduce a type system which is:

* **sound** - the types inferred and assigned by the type system align with the behaviour of the program

* **gradual** - Elixir's type system includes the `dynamic()` type, which can be used when the type of a variable or expression is checked at runtime. In the absence of `dynamic()`, Elixir’s type system behaves as a static one

* **developer friendly** - the types are described, implemented, and composed using basic set operations: unions, intersections, and negations (hence it is a set-theoretic type system)

However, I want to emphasize what the gradual typing means in Elixir. Many gradual type systems have the `any()` type, which, from the point of view of the type system, often means "anything goes" and no type violations are reported.

On the other hand, Elixir's gradual type is called `dynamic()` and it works as a range. For example, you can say `dynamic(integer() or float())`, which means the type is either `integer() or float()` at runtime. Then if you proceed to pass it to a function that expects a `binary()`, you will get a typing violation. This allows the type system to emit warnings even in the presence of dynamism. Even if you declare a type as `dynamic()` and then proceed to use as `integer()` and then `binary()`, a type violation is still reported. We have also [developed new techniques that ensure our gradual typing is sound, without a need for additional runtime checks](/blog/2023/09/20/strong-arrows-gradual-typing/).

The type system was made possible thanks to a partnership between [CNRS](https://www.cnrs.fr/) and [Remote](https://remote.com/). The development work is currently sponsored by [Fresha](https://www.fresha.com/), and [Tidewave](https://tidewave.ai/).

Let's see how this is turning out in practice.

## Inference across Elixir releases

Elixir v1.17 was the first release to introduce set-theoretic types into the compiler. Elixir v1.18 added inference of patterns and return types. Therefore, if you wrote this code:

```elixir
defmodule User do
  defstruct [:age, :car_choice]

  def drive(%User{age: age, car_choice: car}, car_choices) when age >= 18 do
    if car in car_choices do
      {:ok, car}
    else
      {:error, :no_choice}
    end
  end

  def drive(%User{}, _car_choices) do
    {:error, :not_allowed}
  end
end
```

Elixir’s type system will infer the drive function expects a `User` struct as input and returns either `{:ok, dynamic()}` or `{:error, :no_choice}` or `{:error, :not_allowed}`. Therefore, the following code

```elixir
User.drive({:ok, %User{}}, car_choices)
```

will emit a warning stating that we are passing an invalid argument, both in your IDE and the shell:

![Example of a warning when passing wrong argument to a function](/images/contents/type-warning-function-clause.png)

Now consider the expression below. We are expecting the `User.drive/2` call to return `:error`, which cannot possibly be true:

```elixir
case User.drive(user, car_choices) do
  {:ok, car} -> car
  :error -> Logger.error("User cannot drive")
end
```

Therefore the code above would emit the following warning:

![Example of a warning when a case clause won't ever match](/images/contents/type-warning-case.png)

However, Elixir v1.18 could only infer types from patterns. If you wrote this code:

```elixir
def user_age_to_string(user) do
  Integer.to_string(user.age)
end
```

Elixir would not infer anything about the function arguments. As of Elixir v1.20-rc, Elixir correctly infers the function to be `%{..., age: integer()} -> binary()`, which means it expects a map with at least the `age` field (the leading `...` indicates other keys may be present) and it returns a `binary()`.

Or let's see another example:

```elixir
def add_rem(a, b) do
  rem(a + b, 8)
end
```

While `a + b` works with both integers and floats, because the `rem` (remainder) function works exclusively with integers, Elixir correctly infers that `a` and `b` must also both be integers. If you try calling the function above with a float, you will also get a type violation.

In a nutshell, we have been steadily increasing the amount of inference in Elixir programs. Our goal is to find typing violations in Elixir programs for free, without a need for developers to change existing code. And, in the last few days, we finally wrapped up the last missing piece.

## Inference of guards

Elixir v1.20-rc also performs inference of guards! Let's see some examples:

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

And the code above infers `x` does not have the `:foo` key (hence `x.foo` will raise a typing violation), which has the type: `%{..., foo: not_set()}`.

You can also have expressions that assert on the size of data structures:

```elixir
def example(x) when tuple_size(x) < 3
```

Elixir will correctly track that the tuple has at most two elements, and therefore accessing `elem(x, 3)` will emit a typing violation. In other words, Elixir can look at complex guards, infer types, and use this information to find bugs in our code!

## The next ~15 weeks

As we work on the type system, we have been carefully monitoring the compiler performance. And while we have been able to [develop new techniques to keep everything running smoothly](/blog/2025/12/02/lazier-bdds-for-set-theoretic-types/), the next weeks will dramatically ramp up the amount of type information flowing through the compiler, and therefore we need your feedback.

The next Elixir release is scheduled for May. We are shipping this release candidate earlier than usual for validation. We also plan to launch _at least two additional release candidates_ with increased type checking.

### Jan/2026: inference of all constructs

The first release candidate is out right now, with type inference of all Elixir constructs. Please give it a try. However, at this stage, we expect some false positives: the type system will report warnings which are not actual violations. We will explain exactly why in the next paragraphs. So don't change your programs yet. The most valuable feedback we want from you is performance! If everything compiles at roughly the same speed as before, then hooray!

### Feb-Mar/2026: inference across clauses

The second release candidate will add type inference across clauses. Let's see some examples. Take this code:

```elixir
case some_function_call() do
  %{name: name} = user -> ...
  %{first_name: first, last_name: last} = user -> 
end
```

Today, we know `user` in the first clause has the `name` field (and potentially other fields). We know that `user` in the second clause has `first_name` and `last_name`. The code above also implies that `user` in the second clause **does not** have the `name` field (after all, if it had the `name` field, the first clause would have matched). In other words, pattern matching order becomes a source of negative type information. In the first release candidate, the type system cannot infer this information yet, but it will be implemented in the following release candidate.

Besides giving us more precise types, the above will also allow us to perform exhaustiveness checks as well as find redundant clauses (note we already warn for clauses that won't ever match since Elixir v1.18).

However, it is worth keeping in mind the work is a bit more complex than one might think. For example, take this code:

```elixir
case some_function_call() do
  %{age: age} = user when age >= 21 -> ...
  %{name: name} = user -> 
end
```

Can we say the `user` in the second clause does not have the `age` field? No, we can't, because the first clause only matches if age is greater than or equal to 21. So the second clause will still match users with a lower age. This means we must distinguish between "surely accepted clauses" and "potentially accepted clauses".

### Apr-May/2026: inference across dependencies

Finally, we will ship a third release candidate, which enables type inference for function calls across your dependencies. In the current release candidate, Elixir can infer types from function calls, but such inference only applies to modules from Elixir's standard library. Take the following code:

```elixir
def integer_to_string(x) do
  Integer.to_string(x)
end
```

In the code above, we will infer `x` is an `integer()`, but if instead you call `MyInteger.to_string(x)` from a dependency, we only perform type checking, we won't infer the `integer_to_string` function expects an integer. Once implemented, this step will drastically increase the amount of types flowing through the compiler, hence we are dedicating a release candidate for it.

## The next ~15 months

At this point, you may be wondering: when can we officially claim Elixir is statically typed?

When we [first announced the type system effort](/blog/2022/10/05/my-future-with-elixir-set-theoretic-types/), we broke it into three distinct milestones:

1. Type inference of patterns and guards: this is our current milestone which has, since then, been extended to type inference of all language constructs

2. Introduction of typed structs, allowing struct types to propagate throughout the system, as we pattern match on structs throughout the codebase

3. Introduction of type signatures, including for parametric and protocol polymorphism

Assuming all release candidates above go according to plan, we will officially conclude the first milestone as part of Elixir v1.20 and start working on the subsequent ones. However, there are still challenges ahead that may prove the type system to be impractical:

* Ergonomics: all of our improvements so far have happened behind the scenes, without changes to the language. While this has been very valuable to validate the feasibility and performance of the type system, we still need to assess its impact on the developer experience

* Performance: our current implementation does not yet support recursive and parametric types and those may also directly impact performance and make the type system unfeasible

Our goal is to explore these problems and their solutions in the future Elixir v1.21 (Nov/2026) and v1.22 (May/2027) releases, by implementing these operations in the compiler and using it to internally type complex Elixir module, such as the `Enum` module. So while we don't have a precise date for when we will conclude these upcoming milestones, we will likely continue to see gradual improvements on every release for the next 15 months.

## Wrapping up

The first release candidate for Elixir v1.20 is out and includes type inference of all constructs. We will have multiple release candidates before the final release in May/2026, and your feedback is very important:

* Jan/2026: inference of all constructs, may have many false positives, assess performance!
* Feb-Mar/2026: inference across clauses, few or none false positives, assess performance!
* Apr-May/2026: inference across dependencies, assess performance!

Every release will have a thread in the [Elixir Forum](http://elixirforum.com) for discussion.

Check our documentation to learn more about our [overall work on set-theoretic types](http://hexdocs.pm/elixir/main/gradual-set-theoretic-types.html). This release also includes [our official types cheatsheet](https://hexdocs.pm/elixir/main/types-cheat.html).

The [complete CHANGELOG for this release](https://github.com/elixir-lang/elixir/blob/main/CHANGELOG.md) is on GitHub.

Happy coding!
