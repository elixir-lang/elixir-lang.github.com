---
layout: post
title: "Elixir v1.17 released: set-theoretic types in patterns, calendar durations, and Erlang/OTP 27 support"
author: Andrea Leopardi
category: Releases
excerpt: "Elixir v1.17 released: set-theoretic types in patterns, calendar durations, and Erlang/OTP 27 support"
---

Elixir v1.17 has just been released. 🎉

This release introduces set-theoretic types into a handful of language constructs. While there are still [many steps ahead of us](https://elixir-lang.org/blog/2023/06/22/type-system-updates-research-dev/), this important milestone already brings benefits to developers in the form of new warnings for common mistakes. This new version also adds support for [Erlang/OTP 27](https://www.erlang.org/downloads/27), the latest and greatest Erlang release. You'll also find a new calendar-related data type (`Duration`) and a `Date.shift/2` function.

Let's dive in.

## Warnings from gradual set-theoretic types

This release introduces gradual set-theoretic types to infer types from patterns and use them to type check programs, enabling the Elixir compiler to find faults and bugs in codebases without requiring changes to existing software. The underlying principles, theory, and roadmap of our work have been outlined in ["The Design Principles of the Elixir Type System" by Giuseppe Castagna, Guillaume Duboc, José Valim](https://arxiv.org/abs/2306.06391).

At the moment, Elixir developers will interact with set-theoretic types only through **warnings** found by the type system. The current implementation models all data types in the language:

  * `binary()`, `integer()`, `float()`, `pid()`, `port()`, `reference()` - these
    types are indivisible. This means both `1` and `13` get the same `integer()`
    type.

  * `atom()` - it represents all atoms and it is divisible. For instance, the
    atom `:foo` and `:hello_world` are also valid (distinct) types.

  * `map()` and structs - maps can be "closed" or "open". Closed maps only allow
    the specified keys, such as `%{key: atom(), value: integer()}`. Open maps
    support any other keys in addition to the ones listed and their definition
    starts with `...`, such as `%{..., key: atom(), value: integer()}`. Structs
    are closed maps with the `__struct__` key.

  * `tuple()`, `list()`, and `function()` - currently they are modelled as
    indivisible types. The next Elixir versions will also introduce fine-grained
    support to them.

We focused on *atoms* and *maps* on this initial release as they are respectively the simplest and the most complex types representations, so we can stress the performance of the type system and quality of error messages. Modelling these types will also provide the most immediate benefits to Elixir developers. Assuming there is a variable named `user`, holding a `%User{}` struct with a `address` field, Elixir v1.17 will emit the following warnings at compile-time:

  * Pattern matching against a map or a struct that does not have the given key,
    such as `%{adress: ...} = user` (notice `address` vs `adress`).

  * Accessing a key on a map or a struct that does not have the given key, such
    as `user.adress`.

  * Invoking a function on non-modules, such as `user.address()`.

  * Capturing a function on non-modules, such as `&user.address/0`.

  * Attempting to call an anonymous function without an actual function, such as
    `user.()`.

  * Performing structural comparisons between structs, such as `my_date <
    ~D[2010-04-17]`.

  * Performing structural comparisons between non-overlapping types, such as
    `integer >= string`.

  * Building and pattern matching on binaries without the relevant specifiers,
    such as `<<name>>` (this warns because by default it expects an integer, it
    should have been `<<name::binary>>` instead).

  * Attempting to rescue an undefined exception or a struct that is not an
    exception.

  * Accessing a field that is not defined in a rescued exception.

Here's an example of how the warning for accessing a misspelled field of a
struct looks like:

![Example of a warning when accessing a mispelled struct field](/images/contents/type-warning-on-struct-field.png)

Another example, this time it's a warning for structural comparison across two
`Date` structs:

![Example of a warning when comparing two structs with ">"](/images/contents/type-warning-on-date-comparison.png)

These warnings also work natively in text editors, as they are standard Elixir
compiler warnings:

![Example of a type warning inline in an editor](/images/contents/type-warning-in-editor.png)

These new warnings will help Elixir developers find bugs earlier and give more
confidence when refactoring code, especially around maps and structs. While
Elixir already emitted some of these warnings in the past, those were discovered
using syntax analysis. The new warnings are more reliable, precise, and with
better error messages. Keep in mind, however, that the Elixir typechecker only
infers types from patterns within the same function at the moment. Analysis from
guards and across function boundaries will be added in future releases. For more
details, see our new [reference document on gradual set-theoretic
types](https://hexdocs.pm/elixir/gradual-set-theoretic-types.html).

The type system was made possible thanks to a partnership between
[CNRS](https://www.cnrs.fr/) and [Remote](https://remote.com/). The development
work is currently sponsored by [Fresha](https://www.fresha.com/)
([they are hiring!](https://www.fresha.com/careers/openings?department=engineering)),
[Starfish*](https://starfish.team/), and [Dashbit](https://dashbit.co/).

## Erlang/OTP support

This release adds support for Erlang/OTP 27 and drops support for Erlang/OTP 24.
We recommend Elixir developers to migrate to Erlang/OTP 26 or later, especially
on Windows. Support for WERL (a graphical user interface for the Erlang terminal
on Windows) will be removed in Elixir v1.18.

You can read more about Erlang/OTP 27 in [their release
announcement](https://www.erlang.org/downloads/27). The bits that are
particularly interesting for Elixir developers are the addition of a [`json`
module](https://erlang.org/documentation/doc-15.0-rc3/lib/stdlib-6.0/doc/html/json.html)
and process labels (`proc_lib:set_label/1`). The latter will also be available
in this Elixir release as `Process.set_label/1`.

## New `Duration` data type and shifting functions

This Elixir version introduces the `Duration` data type and APIs to shift dates,
times, and date times by a given duration, considering different calendars and
time zones.

```elixir
iex> Date.shift(~D[2016-01-31], month: 2)
~D[2016-03-31]
```

We chose the name *"shift"* for this operation (instead of "add") since working
with durations does not obey properties such as **associativity**. For instance,
adding one month and then one month does not give the same result as adding two
months:

```elixir
iex> ~D[2016-01-31] |> Date.shift(month: 1) |> Date.shift(month: 1)
~D[2016-03-29]
```

Still, durations are essential for building intervals, recurring events, and
modelling scheduling complexities found in the world around us. For `DateTime`s,
Elixir will correctly deal with time zone changes (such as Daylight Saving
Time). However, provisions are also available in case you want to surface
conflicts, such as shifting to a wall clock that does not exist, because the
clock has been moved forward by one hour. See `DateTime.shift/2` for examples.

Finally, we added a new `Kernel.to_timeout/1` function, which helps developers
normalize durations and integers to a timeout used by many APIs—like `Process`,
`GenServer`, and more. For example, to send a message after one hour, you can
now write:

```elixir
Process.send_after(pid, :wake_up, to_timeout(hour: 1))
```

## Learn more

Here are other notable changes in this release:

  * There are new `Keyword.intersect/2,3` functions to mirror the equivalent in
    the `Map` module.

  * A new Mix profiler was added, `mix profile.tprof`, which lets you use the
    new [tprof](https://www.erlang.org/doc/apps/tools/tprof.html)
    profiler released with Erlang/OTP 27. This profiler leads to the
    soft-deprecation of `mix profile.cprof` and `mix profile.eprof`.

  * We added `Kernel.is_non_struct_map/1`, a new guard to help with the common
    pitfall of matching on `%{}`, which also successfully matches structs (as
    they are maps underneath).

  * Elixir's Logger now formats
    [`gen_statem`](https://www.erlang.org/doc/apps/stdlib/gen_statem.html)
    reports and includes Erlang/OTP 27 *process labels* in logger events.

For a complete list of all changes, see the
[full release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.17.0).

Check [the Install section](/install.html) to get Elixir installed and
read our [Getting Started guide](https://hexdocs.pm/elixir/introduction.html)
to learn more.

Happy learning!
