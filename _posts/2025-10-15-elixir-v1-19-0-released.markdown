---
layout: post
title: "Elixir v1.19 released: enhanced type checking, broader type inference, and up to 4x faster compilation for large projects"
authors:
- José Valim
category: Releases
excerpt: "Elixir v1.19 released: type checking of protocols and anonymous functions, broader type inference, improved compile times, and more"
---

Elixir v1.19 brings further improvements to the type system and compilation times, allowing us to find more bugs, faster.

## Type system improvements

This release improves the type system around two key areas: type inference and type checking of anonymous functions and protocols. These enhancements seem simple on the surface but required us to go beyond existing literature by extending current theory and developing new techniques. We will outline the technical details in future articles. For now, let's look at what's new.

### Type inference of all constructs

Type inference (or reconstruction) is the ability of a type system to automatically deduce, either partially or fully, the type of an expression at compile time. Type inference may occur at different levels. For example, many programming languages can automatically infer the types of variables, also known "local type inference", but not all can infer type signatures of functions.

Originally, our plan with Elixir's upcoming type system was to support type inference of patterns, guards, and return types. Therefore, if you wrote this simple function:

```elixir
def even?(x) when is_integer(x) do
  rem(x, 2) == 0
end
```

Elixir would correctly infer the type to be `integer() -> boolean()`. However, if you wrote this function:

```elixir
def even?(x) do
  rem(x, 2) == 0
end
```

The type would be `dynamic() -> boolean()`, since there are no guards, even though the functions behave virtually the same, as the `rem` operator expects both arguments to be integer (they just raise different exceptions for non-integer values).

Inferring type signatures comes with a series of trade-offs:

  * Speed - type inference algorithms are often more computationally intensive than type checking algorithms.

  * Expressiveness - in any given type system, the constructs that support inference are always a subset of those that can be type-checked. Therefore, if a programming language is restricted to only fully reconstructed types, it is less expressive than a solely type checked counterpart.

  * Incremental compilation - type inference complicates incremental compilation. If module A depends on module B, which depends on module C, a change to C may require the type signature in B to be reconstructed, which may then require A to be recomputed (and so on). This dependency chain may require large projects to explicitly add type signatures for stability and compilation efficiency.

  * Cascading errors - when a user accidentally makes type errors or the code has conflicting assumptions, type inference may lead to less clear error messages as the type system tries to reconcile diverging type assumptions across code paths.

On the other hand, type inference offers the benefit of enabling type checking for functions and codebases without requiring the user to add type annotations. To balance these trade-offs, we are exploring "module type inference": our goal is to infer type signatures considering invocations of functions in the same module and of functions from *other applications* (such as Elixir itself and your dependencies). Once module types are inferred, your whole project is type checked considering all declared and inferred types.

We have successfully implemented these features as part of Elixir v1.19, by performing inference of all constructs (except guards), taking into account the signatures from calls to functions within the same module and in Elixir's standard library. This means the second function above, without the guard, will also infer the type `integer() -> boolean()`.

In future releases, we plan to perform type inference of guards (originally planned for v1.19) and also consider the type signatures of your dependencies during inference. Overall, these changes allow us to assess the impact of the trade-offs above as the type system evolves, which suits well our current goals of incrementally using types to find bugs in existing codebases, without changing them.

Keep in mind this only applies to *type inference*. Once we introduce type signatures and you explicitly annotate your functions, type inference and the trade-offs above no longer play a role. Any function with an explicit type signature will be typed checked against the user-provided annotations, as in other statically typed languages.

### Type checking of protocol dispatch and implementations

This release adds type checking when dispatching and implementing protocols.

For example, string interpolation in Elixir uses the `String.Chars` protocol. If you pass a value that does not implement said protocol, Elixir will now emit a warning accordingly.

Here is an example passing a range, which cannot be converted into a string, to an interpolation:

```elixir
defmodule Example do
  def my_code(first..last//step = range) do
    "hello #{range}"
  end
end
```

the above emits the following warnings:

```
warning: incompatible value given to string interpolation:

    data

it has type:

    %Range{first: term(), last: term(), step: term()}

but expected a type that implements the String.Chars protocol, it must be one of:

    dynamic(
      %Date{} or %DateTime{} or %NaiveDateTime{} or %Time{} or %URI{} or %Version{} or
        %Version.Requirement{}
    ) or atom() or binary() or float() or integer() or list(term())
```

Warnings are also emitted if you pass a data type that does not implement the `Enumerable` protocol as a generator to for-comprehensions:

```elixir
defmodule Example do
  def my_code(%Date{} = date) do
    for(x <- date, do: x)
  end
end
```

will emit:

```
warning: incompatible value given to for-comprehension:

    x <- date

it has type:

    %Date{year: term(), month: term(), day: term(), calendar: term()}

but expected a type that implements the Enumerable protocol, it must be one of:

    dynamic(
      %Date.Range{} or %File.Stream{} or %GenEvent.Stream{} or %HashDict{} or %HashSet{} or
        %IO.Stream{} or %MapSet{} or %Range{} or %Stream{}
    ) or fun() or list(term()) or non_struct_map()
```

### Type checking and inference of anonymous functions

Elixir v1.19 can now type infer and type check anonymous functions. Here is a trivial example:

```elixir
defmodule Example do
  def run do
    fun = fn %{} -> :map end
    fun.("hello")
  end
end
```

The example above has an obvious typing violation, as the anonymous function expects a map but a string is given. With Elixir v1.19, the following warning is now printed:

```
    warning: incompatible types given on function application:

        fun.("hello")

    given types:

        binary()

    but function has type:

        (dynamic(map()) -> :map)

    typing violation found at:
    │
  6 │     fun.("hello")
    │        ~
    │
    └─ mod.exs:6:8: Example.run/0
```

Function captures, such as `&String.to_integer/1`, will also propagate the type as of Elixir v1.19, arising more opportunity for Elixir's type system to catch bugs in our programs.

### Acknowledgements

The type system was made possible thanks to a partnership between [CNRS](https://www.cnrs.fr/) and [Remote](https://remote.com/). The development work is currently sponsored by [Fresha](https://www.fresha.com/), [Starfish*](https://starfish.team/), and [Dashbit](https://dashbit.co/).

## Faster compile times in large projects

This release includes two compiler improvements that can lead up to 4x faster builds in large codebases.

While Elixir has always compiled the given files in project or a dependency in parallel, the compiler would sometimes be unable to use all of the machine resources efficiently. This release addresses two common limitations, delivering performance improvements that scale with codebase size and available CPU cores.

### Code loading bottlenecks

Prior to this release, Elixir would load modules as soon as they were defined. However, because the Erlang part of code loading happens within a single process (the code server), this would make it a bottleneck, reducing parallelization, especially on large projects.

This release makes it so modules are loaded lazily. This reduces the pressure on the code server and the amount of work during compilation, with reports of more than two times faster compilation for large projects. The benefits depend on the codebase size and the number of CPU cores available.

Implementation wise, [the parallel compiler already acts as a mechanism to resolve modules during compilation](https://elixir-lang.org/blog/2012/04/24/a-peek-inside-elixir-s-parallel-compiler/), so we built on that. By making sure the compiler controls both module compilation and module loading, it can also better guarantee deterministic builds.

There are two potential regressions with this approach. The first one happens if you spawn processes during compilation which invoke other modules defined within the same project. For example:

```elixir
defmodule MyLib.SomeModule do
  list = [...]

  Task.async_stream(list, fn item ->
    MyLib.SomeOtherModule.do_something(item)
  end)
end
```

Because the spawned process is not visible to the compiler, it won't be able to load `MyLib.SomeOtherModule`. You have two options, either use [`Kernel.ParallelCompiler.pmap/2`](https://hexdocs.pm/elixir/Kernel.ParallelCompiler.html#pmap/2) or explicitly call [`Code.ensure_compiled!(MyLib.SomeOtherModule)`](https://hexdocs.pm/elixir/Code.html#ensure_compiled!/1) before spawning the process that uses said module.

The second one is related to `@on_load` callbacks (typically used for [NIFs](https://www.erlang.org/doc/system/nif.html)) that invoke other modules defined within the same project. For example:

```elixir
defmodule MyLib.SomeModule do
  @on_load :init

  def init do
    MyLib.AnotherModule.do_something()
  end

  def something_else do
    ...
  end
end

MyLib.SomeModule.something_else()
```

The reason this fails is because `@on_load` callbacks are invoked within the code server and therefore they have limited ability to load additional modules. It is generally advisable to limit invocation of external modules during `@on_load` callbacks but, in case it is strictly necessary, you can set `@compile {:autoload, true}` in the invoked module to address this issue in a forward and backwards compatible manner.

Both snippets above could actually lead to non-deterministic compilation failures in the past, and as a result of these changes, compiling these cases are now deterministic.

### Parallel compilation of dependencies

This release introduces a variable called `MIX_OS_DEPS_COMPILE_PARTITION_COUNT`, which instructs `mix deps.compile` to compile dependencies in parallel.

While fetching dependencies and compiling individual Elixir dependencies already happened in parallel, as outlined in the previous section, there were pathological cases where performance gains would be left on the table, such as when compiling dependencies with native code or dependencies where one or two large files would take most of the compilation time.

By setting `MIX_OS_DEPS_COMPILE_PARTITION_COUNT` to a number greater than 1, Mix will now compile multiple dependencies at the same time, using separate OS processes. Empirical testing shows that setting it to half of the number of cores on your machine is enough to maximize resource usage. The exact speed up will depend on the number of dependencies and the number of machine cores and some users reported up to 4x faster compilation times when using our release candidates. If you plan to enable it on CI or build servers, keep in mind it will most likely have a direct impact on memory usage too.

## Erlang/OTP 28 support

Elixir v1.19 officially supports Erlang/OTP 28.1+ and later. In order to support the new Erlang/OTP 28 representation for regular expressions, structs can now control how they are escaped into abstract syntax trees by defining a `__escape__/1` callback.

On the other hand, the new representation for regular expressions in Erlang/OTP 28+ implies they can no longer be used as default values for struct fields. Therefore, this is not allowed:

```elixir
defmodule Foo do
  defstruct regex: ~r/foo/
end
```

You can, however, still use regexes when initializing the structs themselves:

```elixir
defmodule Foo do
  defstruct [:regex]

  def new do
    %Foo{regex: ~r/foo/}
  end
end
```

## OpenChain certification

Elixir v1.19 is also our first release following OpenChain compliance, [as previously announced](https://elixir-lang.org/blog/2025/02/26/elixir-openchain-certification/). In a nutshell:

  * Elixir releases now include a Source SBoM in CycloneDX 1.6 or later and SPDX 2.3 or later formats.
  * Each release is attested along with the Source SBoM.

These additions offer greater transparency into the components and licenses of each release, supporting more rigorous supply chain requirements.

This work was performed by [Jonatan Männchen](https://maennchen.dev) and sponsored by the [Erlang Ecosystem Foundation](https://erlef.org).

## Summary

There are many other goodies in this release, such as improved option parsing, better debuggability and performance in ExUnit, the addition of `mix help Mod`, `mix help Mod.fun`, `mix help Mod.fun/arity`, and `mix help app:package` to make documentation accessible via shell for humans and agents, and much more. [See the CHANGELOG](https://hexdocs.pm/elixir/1.19/changelog.html) for the complete release notes.

Happy coding!
