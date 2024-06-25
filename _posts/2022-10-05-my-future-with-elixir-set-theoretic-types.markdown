---
layout: post
title: "My Future with Elixir: set-theoretic types"
author: José Valim
category: Announcements
excerpt: We announce and explore the possibilities for bringing set-theoretic types into Elixir.
---

*This is article contains excerpts from my keynotes at [ElixirConf Europe 2022](https://www.youtube.com/watch?v=Jf5Hsa1KOc8) and [ElixirConf US 2022](https://www.youtube.com/watch?v=KmLw58qEtuM).*

In May 2022, we have celebrated 10 years since Elixir v0.5, the first public release of Elixir, was announced.

At such occasions, it may be tempting to try to predict how Elixir will look in 10 years from now. However, I believe that would be a futile effort, because, 10 years ago, I would never have guessed Elixir would have gone [beyond excelling at web development](https://phoenixframework.org/), but also into domains such as [embedded software](https://www.nerves-project.org/) and making inroads into machine learning and data analysis with projects such as [Nx (Numerical Elixir)](https://github.com/elixir-nx/nx), [Explorer](https://github.com/elixir-nx/explorer), [Axon](https://github.com/elixir-nx/axon), and [Livebook](https://livebook.dev/) ([here is a summary of the main Numerical Elixir projects](https://github.com/elixir-nx/). Elixir was designed to be extensible and how it will be extended has always been a community effort.

For these reasons, I choose to focus on *My Future* with Elixir. Those are the projects I am personally excited about and working on alongside other community members. The topic of today's article is type systems, as discussed in my ElixirConf EU presentation in May 2022.

## The elephant in the room: types

Throughout the years, the Elixir Core Team has addressed the biggest needs of the community. [Elixir v1.6 introduced the Elixir code formatter](https://elixir-lang.org/blog/2018/01/17/elixir-v1-6-0-released/), as the growing community and large teams saw an increased need for style guides and conventions around large codebases.

[Elixir v1.9 shipped with built-in support for releases](https://elixir-lang.org/blog/2019/06/24/elixir-v1-9-0-released/): self-contained archives that consist of your application code, all of its dependencies, plus the whole Erlang Virtual Machine (VM) and runtime. The goal was to address the perceived difficulty in deploying Elixir projects, by bringing tried approaches from both Elixir and Erlang communities into the official tooling. This paved the way to future automation, such as `mix phx.gen.release`, which automatically generates a Dockerfile tailored to your Phoenix applications.

Given our relationship with the community, it would be disingenuous to talk about my future with Elixir without addressing what seems to be the biggest community need nowadays: static typing. However, when the community asks for static typing, what are we effectively expecting? And what is the Elixir community to gain from it?

## Types and Elixir

Different programming languages and platforms extract different values from types. These values may or may not apply to Elixir.

For example, different languages can extract performance benefits from types. However, Elixir still runs on the Erlang VM, which is dynamically typed, so we should not expect any meaningful performance gain from typing Elixir code.

Another benefit of types is to _aid_ documentation (emphasis on the word _aid_ as I don't believe types replace textual documentation). Elixir already reaps similar benefits from [typespecs](https://hexdocs.pm/elixir/typespecs.html) and I would expect an integrated type system to be even more valuable in this area.

However, the upsides and downsides of static typing become fuzzier and prone to exaggerations once we discuss them in the context of code maintenance, in particular when comparing types with other software verification techniques, such as tests. In those situations, it is common to hear unrealistic claims such as "a static type system would catch 80% of my Elixir bugs" or that "you need to write fewer tests once you have static types".

While [I explore why I don't believe those claims are true during the keynote](https://www.youtube.com/watch?v=Jf5Hsa1KOc8), saying a static type system helps catch bugs is not helpful unless we discuss exactly the type of bugs it is supposed to identify, and that's what we should focus on.

For example, Rust's type system helps prevent bugs such as deallocating memory twice, dangling pointers, data races in threads, and more. But adding such type system to Elixir would be unproductive because those are not bugs that we run into in the first place, as those properties are guaranteed by the garbage collector and the Erlang runtime.

This brings another discussion point: a type system naturally restricts the amount of code we can write because, in order to prove certain properties about our code, certain styles have to be rejected. However, I would prefer to avoid restricting the expressive power of Elixir, because I am honestly quite happy with the language semantics (which we mostly inherited from Erlang).

For Elixir, the benefit of a type system would revolve mostly around contracts. If function `caller(arg)` calls a function named `callee(arg)`, we want to guarantee that, as both these functions change over time, that `caller` is passing valid arguments into `callee` and that the `caller` properly handles the return types from `callee`.

This may seem like a simple guarantee to provide, but we'd run into tricky scenarios even on small code samples. For example, imagine that we define a `negate` function, that negates numbers. One may implement it like this:

```elixir
def negate(x) when is_integer(x), do: -x
```

We could then say `negate` has the type `integer() -> integer()`.

With our custom negation in hand, we can implement a custom subtraction:

```elixir
def subtract(a, b) when is_integer(a) and is_integer(b) do
  a + negate(b)
end
```

This would all work and typecheck as expected, as we are only working with integers. However, imagine in the future someone decides to make `negate` polymorphic, so it also negates booleans:

```elixir
def negate(x) when is_integer(x), do: -x
def negate(x) when is_boolean(x), do: not x
```

If we were to naively say that `negate` now has the type `integer() | boolean() -> integer() | boolean()`, we would now get a false positive warning in our implementation of subtract:

```elixir
Type warning:

  |
  |  def subtract(a, b) when is_integer(a) and is_integer(b) do
  |    a + negate(b)
         ^ the operator + expects integer(), integer() as arguments,
           but the second argument can be integer() | boolean()
```

**So we want a type system that can type contracts between functions but, at the same time, avoids false positives and does not restrict the Elixir language**. Balancing those trade-offs is not only a technical challenge but also one that needs to consider the needs of the community. The [Dialyzer project](https://www.erlang.org/doc/man/dialyzer.html), implemented in Erlang and available for Elixir projects, chose to have no false positives. However, that implies certain bugs may not be caught.

At this point in time, it seems the overall community would prefer a system that flags more potential bugs, even if it means more false positives. This may be particularly tricky in the context of Elixir and Erlang because I like to describe them as [_assertive languages_](https://dashbit.co/blog/writing-assertive-code-with-elixir): we write code that will crash in face of unexpected scenarios because we rely on supervisors to restart parts of our application whenever that happens. This is the foundation of building self-healing and fault-tolerant systems in those languages.

On the other hand, this is what makes a type system for Erlang/Elixir so exciting and unique: the ability to deal with failure modes both at compile-time and runtime elegantly. Because at the end of the day, regardless of the type system of your choice, you will run into unexpected scenarios, especially when interacting with external resources such as the filesystem, APIs, distributed nodes, etc.

## The big announcement

This brings me to the big announcement from ElixirConf EU 2022: **we have an on-going PhD scholarship to research and develop a type system for Elixir based on set-theoretic types**. Guillaume Duboc (PhD student) is the recipient of the scholarship, lead by Giuseppe Castagna (Senior Resercher) with support from José Valim (that's me).

The scholarship is a partnership between the [CNRS](https://www.cnrs.fr/) and [Remote](https://remote.com/). It is sponsored by Supabase ([they are hiring!](https://supabase.com/company)), Fresha ([they are hiring!](https://www.fresha.com/careers/openings?department=engineering)), and [Dashbit](https://dashbit.co/), all heavily invested in Elixir's future.

## Why set-theoretic types?

We want a type system that can elegantly model all of Elixir idioms and, at a first glance, set-theoretic types were an excellent match. In set-theoretic types, we use set operations to define types and ensure that the types satisfy the associativity and distributivity properties of the corresponding set-theoretic operations.

For example, numbers in Elixir can be integers _or_ floats, therefore we can write them as the union `integer() | float()` (which is equivalent to `float() | integer()`).

Remember the `negate` function we wrote above?

```elixir
def negate(x) when is_integer(x), do: -x
def negate(x) when is_boolean(x), do: not x
```

We could think of it as a function that has both types `(integer() -> integer())` and `(boolean() -> boolean())`, which is as an intersection. This would naturally solve the problem described in the previous section: when called with an integer, it can only return an integer.

We also have a data-structure called atoms in Elixir. They uniquely represent a value which is given by their own name. Such as `:sunday` or `:banana`. You can think of the type `atom()` as the set of all atoms. In addition, we can think of the values `:sunday` and `:banana` as subtypes of `atom()`, as they are contained in the set of all atoms. `:sunday` and `:banana` are also known as singleton types (as they are made up of only one value).

In fact, we could even consider each integer to be a singleton type that belongs to the `integer()` set. The choice of which values will become singletons in our type system will strongly depend on the trade-offs we defined in the previous sections. The type system also has to be gradual, as typed Elixir code may interact with untyped Elixir code and vice-versa.

Personally, I find set-theoretical types an elegant and accessible approach to reason about types. At the end of the day, an Elixir developer won't have to think about intersections when writing a function with multiple clauses, but the modelling is straight-forward if they are ever to look under the hood.

Despite the initial fit between Elixir semantics and set-theoretic types, there are open questions and existing challenges in putting the two together. Here are some examples:

  * Elixir has [an expressive collection of idioms used in pattern matching and guards](https://hexdocs.pm/elixir/patterns-and-guards.html), can we map them all to set-theoretic types?

  * Elixir associative data structures, [called maps](https://hexdocs.pm/elixir/Map.html), can be used both as records and as dictionaries. Would it be possible to also type them with a unified foundation?

  * Gradual type systems must introduce runtime type checks in order to remain sound. However, those type checks will happen in addition to the checks already done by the Erlang VM, which can degrade performance. Therefore, is it possible to leverage the existing runtime checks done by the Erlang VM so the resulting type system is still sound?

Those challenges are precisely what makes me excited to work with Giuseppe Castagna and Guillaume Duboc, as we believe it is important to formalize those problems and their solutions, before we dig deep into the implementation. To get started with set-theoretic types, I recommend [Programming with union, intersection, and negation types by Giuseppe Castagna](https://www.irif.fr/~gc/papers/set-theoretic-types-2022.pdf).

Finally, it is important to note there are areas we don't plan to tackle at the moment, such as typing of messages between processes.

## Expectations and roadmap

At this point, you may be expecting that Elixir will certainly become a gradually typed language at some moment in its future. However, it is important to note this may not be the case, as there is a long road ahead of us.

One of the challenges in implementing a type system - at least for someone who doesn't have the relevant academic background like myself - is that it feels like a single indivisible step: you take a language without a type system and at the end you have one, without much insight or opportunity for feedback in the middle. Therefore we have been planning to incorporate the type system into Elixir in steps, which I have been referring to as "a gradual gradual type system": one where we add gradual types to the language gradually.

The first step, the one we are currently working on, is to leverage the existing type information found in Elixir programs. As previously mentioned, [we write assertive code](https://dashbit.co/blog/writing-assertive-code-with-elixir) in Elixir, which means there is a lot of type information in patterns and guards. We want to lift this information and use it to type check existing codebases. The Erlang compiler already does so to improve performance within a single module and we want to eventually do so across modules and applications too.

During this phase, Elixir developers won't have to change a single line of code to leverage the benefits of the type system. Of course, we will catch only part of existing bugs, but this will allows us to stress test, benchmark, and collect feedback from developers, making improvements behind the scenes (or even revert the whole thing if we believe it won't take us where we expect).

The next step is to introduce typed structs into the language, allowing struct types to propagate throughout the system, as you pattern match on structs throughout the codebase. In this stage we will introduce a new API for defining structs, yet to be discussed, and developers will have to use the new API to reap its benefits.

Finally, once we are happy with the improvements and the feedback collected, we can migrate to introduce a new syntax for typing function signatures in Elixir codebases, including support for more advanced features such as polymorphic types. Those will allow us to type complex constructs such as the ones found in the `Enum` module.

The important point to keep in mind is that those features will be explored and developed in steps, with plenty of opportunity to gather community feedback. I also hope our experience may be useful to other ecosystems who wish to gradually introduce type systems into existing programming languages, in a way that feels granular and participative.

Thank you for reading and see you in future updates.
