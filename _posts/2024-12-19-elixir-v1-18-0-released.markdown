---
layout: post
title: "Elixir v1.18 released: type checking of function calls, Language Server listeners, built-in JSON, and ExUnit improvements"
author: José Valim
category: Releases
excerpt: "Elixir v1.18 released: type checking of function calls, Language Server listeners, built-in JSON, and ExUnit improvements"
---

Elixir v1.18 is an impressive release with improvements across the two main efforts happening within the Elixir ecosystem right now: set-theoretic types and language servers. It also comes with built-in JSON support and adds new capabilities to its unit testing library. Let's go over each of those in detail.

## Type inference of patterns and return types

There are several updates in the typing department, so let's break it down.

#### A type system? In my Elixir?

There is an on-going [research and development](https://elixir-lang.org/blog/2023/06/22/type-system-updates-research-dev/) effort to bring static types to Elixir. Elixir's type system is:

  * **sound** - the types inferred and assigned by the type system align with the behaviour of the program

  * **gradual** - Elixir's type system includes the `dynamic()` type, which can be used when the type of a variable or expression is checked at runtime. In the absense of `dynamic()`, Elixir's type system behaves as a static one

  * **developer friendly** - the types are described, implemented, and composed using basic set operations: unions, intersections, and negation (hence it is a set-theoretic type system)

More interestingly, you can compose `dynamic()` with any type. For example, `dynamic(integer() or float())` means the type is either `integer()` or `float()` at runtime. This allows the type system to emit warnings if none of the types are satisfied, even in the presence of dynamism.

#### What has already been done?

[Elixir v1.17 was the first release to incorporate the type system in the compiler](https://elixir-lang.org/blog/2024/06/12/elixir-v1-17-0-released/). In particular, we have added support for primitive types (integer, float, binary, pids, references, ports), atoms, and maps. We also added type checking to a handful of operations related to those types, such as accessing fields in maps, as in `user.adress` (mind the typo), performing structural comparisons between structs, as in `my_date < ~D[2010-04-17]`, etc.

#### What is new in v1.18?

The most exciting change in Elixir v1.18 is type checking of function calls, alongside gradual inference of patterns and return types. To understand how this will impact your programs, consider the following code defined in `lib/user.ex`:

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

Elixir's type system will infer the `drive` function expects a `User` struct as input and returns either `{:ok, dynamic()}` or `{:error, :no_choice}` or `{:error, :not_allowed}`. Therefore, the following code

```elixir
User.drive({:ok, %User{}}, car_choices)
```

will emit a warning stating that we are passing an invalid argument:

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

Our goal is for the warnings to provide enough contextual information that lead to clear reports and that's an area we are actively looking for feedback. If you receive a warning that is unclear, please open up a bug report.

Elixir v1.18 also augments the type system with support for tuples and lists, plus type checking of almost all Elixir language constructs, except `for`-comprehensions, `with`, and closures. Here is a non-exaustive list of the new violations that can be detected by the type system:

  * if you define a pattern that will never match any argument, such as `def function(x = y, x = :foo, y = :bar)`

  * matching or accessing tuples at an invalid index, such as `elem(two_element_tuple, 2)`

  * if you have a branch in a `try` that will never match the given expression

  * if you have a branch in a `cond` that always passes (except the last one) or always fails

  * if you attempt to use the return value of a call to `raise/2` (which by definition returns no value)

In summary, this release takes us further in our journey of providing type checking and type inference of existing Elixir programs, without requiring Elixir developers to explicitly add type annotations.

For existing codebases with reasonable code coverage, most type system reports will come from uncovering dead code - code which won't ever be executed - as seen in a [few](https://github.com/phoenixframework/phoenix_live_view/commit/6c6e2aaf6a01957cc6bb8a27d2513bff273e8ca2) [distinct](https://github.com/elixir-ecto/postgrex/commit/3308f277f455ec64f2d0d7be6263f77f295b1325) [projects](https://github.com/phoenixframework/flame/commit/0c0c2875e42952d2691cbdb7928fc32f4715e746). A notable example is the type system ability to track how private functions are used throughout a module and then point out which clauses are unused:

```elixir
defmodule Example do
  def public(x) do
    private(Integer.parse(x))
  end

  defp private(nil), do: nil
  defp private("foo"), do: "foo"
  defp private({int, _rest}), do: int
  defp private(:error), do: 0
  defp private("bar"), do: "bar"
end
```

![Example of a warning for unused private clauses](/images/contents/type-warning-private.png)

Keep in mind the current implementation does not perform type inference of guards yet, which is an important source of typing information in programs. There is a lot the type system can learn about our codebases, that it does not yet. This brings us to the next topic.

#### Future work

The next Elixir release should improve the typing of maps, tuples, and closures, allowing us to type even more constructs. We also plan to fully type the `with` construct, `for`-comprehensions, as well as protocols.

But more importantly, we want to focus on complete type inference of guards, which in turn will allow us to explore ideas such as redundant pattern matching clauses and exhaustiveness checks. Our goal with inference is to strike the right balance between developer experience, compilation times, and the ability of finding provable errors in existing codebases. You can learn more [about the trade-offs we made for inference in our documentation](https://hexdocs.pm/elixir/1.18/gradual-set-theoretic-types.html#type-inference).

Future Elixir versions will introduce user-supplied type signatures, which should bring the benefits of a static type system without relying on inference. [Check our previous article on the overall milestones for more information](https://elixir-lang.org/blog/2023/06/22/type-system-updates-research-dev/).

#### Sponsors

The type system was made possible thanks to a partnership between [CNRS](https://www.cnrs.fr/) and [Remote](https://remote.com/). The development work is currently sponsored by [Fresha](https://www.fresha.com/) ([they are hiring!](https://www.fresha.com/careers/openings?department=engineering)), [Starfish*](https://starfish.team/), and [Dashbit](https://dashbit.co/).

## Language server listeners

3 months ago, we welcomed [the Official Language Server team](https://elixir-lang.org/blog/2024/08/15/welcome-elixir-language-server-team/), with the goal of unifying the efforts behind code intelligence, tools, and editors in Elixir. Elixir v1.18 brings new features on this front by introducing locks and listeners to its compilation. Let's understand what it means.

At the moment, all language server implementations have their own compilation environment. This means that your project and dependencies during development are compiled once, for your own use, and then again for the language server. This duplicate effort could cause the language server experience to lag, when it could be relying on the already compiled artifacts of your project.

This release addresses the issue by introducing a compiler lock, ensuring that only a single operating system running Elixir compiles your project at a given moment, and by providing the ability for one operating system process to listen to the compilation results of others. In other words, different Elixir instances can now communicate over the same compilation build, instead of racing each other.

These enhancements do not only improve editor tooling, but they also directly benefit projects like IEx and Phoenix. Here is a quick snippet showing how to enable auto-reloading inside IEx, then running `mix compile` in one shell automatically reloads the module inside the IEx session:

<video controls>
  <source src="/images/contents/iex-auto-reload.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Built-in JSON

[Erlang/OTP 27 added built-in support for `JSON`](https://www.erlang.org/doc/apps/stdlib/json.html) and we are now bringing it to Elixir. A new module, called [`JSON`](https://hexdocs.pm/elixir/1.18/JSON.html), has been added with functions to encode and decode JSON. Its most basic APIs reflect the ones [from the Jason project](https://hexdocs.pm/jason/Jason.html) (the de-facto JSON library in the Elixir community up to this point).

A protocol, called [`JSON.Encoder`](https://hexdocs.pm/elixir/1.18/JSON.Encoder.html), is also provided for those who want to customize how their own data types are encoded to JSON. You can also derive protocols for structs, with a single-line of code:

```elixir
@derive {JSON.Encoder, only: [:id, :name]}
defstruct [:id, :name, :email]
```

The deriving API mirrors the one from `Jason`, helping those who want to migrate to the new `JSON` module.

## Parameterized tests and ExUnit groups

[ExUnit now supports parameterized tests](https://hexdocs.pm/ex_unit/1.18/ExUnit.Case.html#module-parameterized-tests). This allows your test modules to run multiple times under different parameters.

For example, Elixir ships [a local, decentralized and scalable key-value process storage called `Registry`](https://hexdocs.pm/elixir/Registry.html). The registry can be partitioned and its implementation differs depending if partitioning is enabled or not. Therefore, during tests, we want to ensure both modes are exercised. With Elixir v1.18, we can achieve this by writing:

```elixir
defmodule Registry.Test do
  use ExUnit.Case,
    async: true,
    parameterize: [
      %{partitions: 1},
      %{partitions: 8}
    ]

  # ... the actual tests ...
end
```

Once specified, the number of partitions is available as part of the test configuration. For example, to start one registry per test with the correct number of partitions, you can write:

```elixir
  setup config do
    partitions = config.partitions
    name = :"#{config.test}_#{partitions}"
    opts = [keys: :unique, name: name, partitions: partitions]
    start_supervised!({Registry, opts})
    opts
  end
```

Prior to parameterized types, Elixir resorted on code generation, which increased compilation types. Furthermore, ExUnit parameterizes the whole test modules, which also allows the different parameters to run concurrently if the `async: true` option is given. Overall, this features allows you to compile and run multiple scenarios more efficiently.

Finally, ExUnit also comes with the ability of specifying test groups. While ExUnit supports running tests concurrently, those tests must not have shared state between them. However, in large applications, it may be common for some tests to depend on some shared state, and other tests to depend on a completely separate state. For example, part of your tests may depend on Cassandra, while others depend on Redis. Prior to Elixir v1.18, these tests could not run concurrently, but in v1.18 they might as long as they are assigned to different groups:

```elixir
defmodule MyApp.PGTest do
  use ExUnit.Case, async: true, group: :pg

  # ...
end
```

Tests modules within the same group do not run concurrently, but across groups, they might.

With features like async tests, suite partitioning, and now grouping, Elixir developers have plenty of flexibility to make the most use of their machine resources, both in development and in CI.

## `mix format --migrate`

The `mix format` command now supports an explicit `--migrate` flag, which will convert constructs that have been deprecated in Elixir to their latest version. Because this flag rewrites the AST, it is not guaranteed the migrated format will always be valid when used in combination with macros that also perform AST rewriting.

As of this release, the following migrations are executed:

  * Normalize parens in bitstring modifiers - it removes unnecessary parentheses in known bitstring modifiers, for example `<<foo::binary()>>` becomes `<<foo::binary>>`, or adds parentheses for custom modifiers, where `<<foo::custom_type>>` becomes `<<foo::custom_type()>>`.

  * Charlists as sigils - formats charlists as `~c` sigils, for example `'foo'` becomes `~c"foo"`.

  * `unless` as negated `if`s - rewrites `unless` expressions using `if` with a negated condition, for example `unless foo do` becomes `if !foo do`. We plan to deprecate `unless` in future relases.

More migrations will be added in future releases to help us push towards more consistent codebases.

## Summary

Other notable changes include [`PartitionSupervisor.resize!/2`](https://hexdocs.pm/elixir/1.18/PartitionSupervisor.html#resize!/2), for resizing the number of partitions (aka processes) of a supervisor at runtime, [Registry.lock/3](https://hexdocs.pm/elixir/1.18/Registry.html#lock/3) for simple in-process key locks, PowerShell versions of `elixir` and `elixirc` scripts for better DX on Windows, and more. [See the CHANGELOG](https://hexdocs.pm/elixir/1.18/changelog.html) for the complete release notes.

Happy coding!
